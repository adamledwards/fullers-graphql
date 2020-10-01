require("dotenv").config();
import got from "got";
import sharp, { format } from "sharp";
import { PropertyImage } from ".";
import { Job } from "bull";
import Knex from "knex";
import config from "./config";
import s3, { getSignedUrl } from "./aws/s3/client";
import { PassThrough } from "stream";
import * as path from "path";

import mime from "mime/lite";

const knex = Knex(config.databaseUrl);

export type JobArgs = {
  propertyImage: {
    id: number;
    original: string;
  };
};

export default async function (job: Job<JobArgs>) {
  await knex<PropertyImage>("property_image")
    .returning("id")
    .update({
      processingStatus: 2,
    })
    .where("id", job.data.propertyImage.id);

  const transform = sharp().resize({
    width: 1600,
    withoutEnlargement: true,
    fastShrinkOnLoad: true,
  });

  const passThroughStreamJpeg = new PassThrough();
  const passThroughStreamWebp = new PassThrough();

  transform.clone().jpeg({ quality: 80 }).pipe(passThroughStreamJpeg);
  transform.clone().webp({ quality: 80 }).pipe(passThroughStreamWebp);

  const signedUrl = await getSignedUrl(job.data.propertyImage.original);

  got.stream(signedUrl).pipe(transform);

  const parsedFile = path.parse(job.data.propertyImage.original);

  const responses = await Promise.all([
    upload("webp", passThroughStreamWebp, parsedFile),
    upload("jpg", passThroughStreamJpeg, parsedFile),
  ]);

  const re = /(\[)(.+)([\]])/g;

  const formatInput = responses
    .map((format) => [<string>mime.getType(format.Key), format.Location])
    .map((formatList) => {
      return JSON.stringify(formatList).replace(re, "($2)");
    });

  return knex<PropertyImage>("property_image")
    .returning("id")
    .update({
      filepath: parsedFile.base,
      processingStatus: 3,
      format: knex.raw(
        `array[${Array.from(formatInput, () => "?::format").join(",")}]`,
        formatInput
      ),
    })
    .where("id", job.data.propertyImage.id);
}

async function upload(
  format: string,
  stream: NodeJS.WritableStream,
  parsedFile: path.ParsedPath
) {
  return new Promise<AWS.S3.ManagedUpload.SendData>((resolve, reject) =>
    s3.upload(
      {
        Bucket: "fullers",
        Key: `${parsedFile.name}-1600.${format}`,
        Body: stream,
        ContentType: mime.getType(format) as string,
        ACL: "public-read",
      },
      async (err, response) => {
        if (err) {
          throw err;
        }
        resolve(response);
      }
    )
  );
}
