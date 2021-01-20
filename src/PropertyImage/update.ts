import Knex from "knex";
import { gql } from "apollo-server";
import selections from "../utils/selection";

import { IResolvers } from "graphql-tools";
import { GraphQLResolveInfo } from "graphql";
import { kernel } from "sharp";

export const typeDef = gql`
  extend type Mutation {
    updatePropertyImage(
      propertyImageId: ID!
      description: String
      order: Int
    ): PropertyImage
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
  order: number;
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

async function updatePropertyImage(
  parent: any,
  {
    propertyImageId,
    description,
    order,
  }: { propertyImageId: string; description?: string; order?: number },
  { knex }: { knex: Knex },
  info: GraphQLResolveInfo
) {
  let method: "select" | "returning" = "returning";
  if (!description && typeof order !== "number") {
    throw Error("Description or order must be present");
  }
  const [type, id] = decodeNodeId(propertyImageId);
  const selects = selections(info);
  //@ts-ignore
  const imageQuery = knex<PropertyImage>("property_image")[method]([
    ...selects,
  ]);

  if (description) {
    imageQuery.update({
      description,
    });
  } else {
    method = "select";
  }

  const hasFormat = selects.delete("format");
  if (hasFormat) {
    //@ts-ignore
    imageQuery[method]([
      ...selects,
      (knex.raw(
        `json_build_object('images', format)::json->'images' as format`
      ) as unknown) as string,
    ]);
  }
  if (typeof order === "number") {
    await reorder(knex, id, order);
  }

  const result = ((await imageQuery.where(
    "id",
    id
  )) as unknown) as PropertyImage[];

  return result[0];
}

async function reorder(knex: Knex, id: string, order: number) {
  const result = await knex<PropertyImage>({ p: "property_image" })
    .select("id", "order")
    .orderBy([{ column: "order" }, { column: "updated_at", order: "desc" }])
    .whereExists(
      knex("property_image")
        .select(1)
        .where("id", id)
        .where("propertyId", knex.ref("p.propertyId"))
    );
  const source = result.findIndex((img) => img.id === parseInt(id));

  const trx = await knex.transaction();

  const reorderItems = [
    ...result.slice(0, source),
    ...result.slice(source + 1),
  ];
  reorderItems.splice(order, 0, result[source]);
  for (const [index, element] of reorderItems.entries()) {
    await trx("property_image")
      .transacting(trx)
      .update({
        order: index,
      })
      .where("id", element.id);
  }
  return trx.commit();
}

export const resolver: IResolvers<Context> = {
  Mutation: {
    updatePropertyImage,
  },
};
