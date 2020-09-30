import Knex from "knex";
import { FileUpload } from "graphql-upload";
import md5 from "md5";
import Bull from "bull";
import { gql } from "apollo-server";
import { JobArgs } from "../imageTask";
import * as path from "path";
import s3 from "../aws/s3/client";

import { IResolvers } from "graphql-tools";

export const typeDef = gql`
  type Format {
    mimetype: String!
    path: String!
  }

  type PropertyImage implements File & Node {
    id: ID!
    filepath: String
    mimetype: String!
    encoding: String!
    original: String!
    processingStatus: ProcessingStatus!
    description: String
    format: [Format!]
    order: Int!
    updated_at: String
    created_at: String
  }

  input PropertyImageInput {
    propertyId: ID!
    description: String
    order: Int
  }

  extend type Mutation {
    addPropertyImage(
      files: [Upload!]!
      propertyImage: [PropertyImageInput!]!
    ): [PropertyImage!]!
  }
`;

type Context = {
  knex: Knex;
};

enum ProcessingStatus {
  NOT_STARTED = 0,
  PENDING = 1,
  STARTED = 2,
  DONE = 3,
}

export type PropertyImage = {
  id: number;
  filepath: string;
  mimetype: string;
  encoding: string;
  original: string;
  processingStatus: ProcessingStatus;
  propertyId: number;
  description: string;
  format: {
    mimetype: string;
    path: string;
  }[];
};

function decodeNodeId(nodeID: string) {
  // decode node if to [type, id]
  return Buffer.from(nodeID, "base64").toString().split(":");
}

async function addPropertyImage(
  parent: any,
  {
    propertyImage,
    files,
  }: { propertyImage: PropertyImage[]; files: Promise<FileUpload>[] },
  { knex }: { knex: Knex }
) {
  const imageQueue = new Bull<JobArgs>("imageProcessor");

  const uploads = files.map((filePromise, i) => {
    return new Promise(async (resolve, reject) => {
      const file = await filePromise;
      const fileExt = path.extname(file.filename);
      const filename = `${md5(`${file.filename}-${Date.now()}`)}${fileExt}`;
      const [type, propertyId] = decodeNodeId(
        <string>(<unknown>propertyImage[i].propertyId)
      );

      return s3.upload(
        {
          Bucket: "fullers",
          Key: filename,
          Body: file.createReadStream(),
          ContentType: file.mimetype,
        },
        async (err, response) => {
          if (err) {
            reject(err);
          }

          const image = await knex<PropertyImage>("property_image")
            .returning("id")
            .insert({
              filepath: "",
              mimetype: file.mimetype,
              encoding: file.encoding,
              original: response.Location,
              processingStatus: 0,
              propertyId: parseInt(propertyId),
              description: propertyImage[i].description,
            });
          imageQueue.add({
            propertyImage: {
              id: image[0],
              original: response.Location,
            },
          });
          resolve({
            id: image[0],
            filepath: "",
            mimetype: file.mimetype,
            encoding: file.encoding,
            original: response.Location,
            processingStatus: 0,
            propertyId: parseInt(
              <string>(<unknown>propertyImage[i].propertyId)
            ),
            description: propertyImage[i].description,
          });
        }
      );
    });
  });
  return Promise.all(uploads);
}

export const resolver: IResolvers<Context> = {
  Mutation: {
    addPropertyImage,
  },
};
