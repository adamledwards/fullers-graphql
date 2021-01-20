import Knex from "knex";
import { gql } from "apollo-server";
import * as path from "path";
import s3 from "../aws/s3/client";
import { IResolvers } from "graphql-tools";
import { GraphQLResolveInfo } from "graphql";
import selections from "../utils/selection";

export const typeDef = gql`
  type DeletedPropertyImage {
    id: ID!
  }
  extend type Mutation {
    deletePropertyImage(propertyImageId: ID!): DeletedPropertyImage!
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
  isFloorPlans?: boolean
};

function decodeNodeId(nodeID: string) {
  // decode node if to [type, id]
  return Buffer.from(nodeID, "base64").toString().split(":");
}

async function deletePropertyImage(
  parent: any,
  { propertyImageId }: { propertyImageId: string },
  { knex }: Context,
  info: GraphQLResolveInfo
) {
  const [type, id] = decodeNodeId(propertyImageId);
  const images = ((await knex<PropertyImage>("property_image")
    .select([
      "id",
      "original",
      knex.raw(`json_build_object('images', format)::json->'images' as format`),
    ])
    .where("id", id)) as unknown) as PropertyImage[];

  await knex("property_image").delete().where("id", id);
  await deletePropertyImageFromS3(images);

  return {
    id: propertyImageId,
  };
}

export async function deletePropertyImageFromS3(images: PropertyImage[]) {
  const deleteObjects = images.reduce((s3Objects, image) => {
    return [
      ...s3Objects,
      { Key: path.basename(image.original) },
      ...(image.format || []).map((format) => ({
        Key: path.basename(format.path),
      })),
    ];
  }, <{ Key: string }[]>[]);

  const result = await new Promise((resolve, reject) => {
    s3.deleteObjects(
      {
        Bucket: "fullers",
        Delete: { Objects: deleteObjects },
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
  return result;
}
export const resolver: IResolvers<Context> = {
  Mutation: {
    deletePropertyImage,
  },
};
