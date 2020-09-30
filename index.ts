import Knex from "knex";

import {
  ApolloServer,
  gql,
  AuthenticationError,
  IFieldResolver,
  IResolverObject,
} from "apollo-server";
import { IResolvers } from "graphql-tools";
import { merge } from "lodash";
import selections from "./utils/selection";
import {
  typeDef as propertyImageTypeDef,
  resolver as propertyImageResolver,
} from "./PropertyImage";
import { deletePropertyImageFromS3 } from "./PropertyImage/delete";
import jwt, {
  VerifyOptions,
  JwtHeader,
  SigningKeyCallback,
} from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import * as redisClient from "redis";
import { promisify } from "util";
import Auth0 from "auth0";

import config from "./config";

const redis = redisClient.createClient(config.redisUrl);
const getAsync = promisify(redis.get).bind(redis);

var auth0 = new Auth0.ManagementClient({
  ...config.auth,
  tokenProvider: {
    enableCache: true,
    cacheTTLInSeconds: 10,
  },
});

enum ProcessingStatus {
  NOT_STARTED = 0,
  PENDING = 1,
  STARTED = 2,
  DONE = 3,
}

type Context = {
  knex: Knex;
};

const client = jwksClient({
  jwksUri: `https://dev-u8w-c5z5.eu.auth0.com/.well-known/jwks.json`,
});

function getKey(header: JwtHeader, cb: SigningKeyCallback) {
  if (header.kid) {
    client.getSigningKey(header.kid, function (err, key) {
      //@ts-ignore
      var signingKey = key.publicKey || key.rsaPublicKey;
      cb(null, signingKey);
    });
  } else {
    cb(new Error("No header kid"));
  }
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

enum PropertyType {
  HOUSE,
  FLAT,
  BUNGALOW,
}

enum PropertyStatus {
  FOR_SALE,
  OFFER_ACCEPTED,
  SOLD,
}

enum Ownership {
  FREEHOLD,
  LEASEHOLD,
}

type Property = {
  id: string;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  isLetting: Boolean;
  propertyType: PropertyType;
  isActive: Boolean;
  price: number;
  priceStatus: string;
  propertyStatus: PropertyStatus;
  ownership: Ownership;
  bedroom: number;
  reception: number;
  description: string;
  keyFeatures: [string];
  images: [PropertyImage];
};
type PropertyImageInput = {
  propertyId: string;
  description: string;
};

const knex = Knex(config.databaseUrl);

const typeDefs = gql`
  interface Node {
    id: ID!
  }

  type Property implements Node {
    id: ID!
    addressLine1: String!
    addressLine2: String
    postcode: String!
    isLetting: Boolean
    propertyType: PropertyType!
    isActive: Boolean
    price: Int
    priceStatus: String
    propertyStatus: PropertyStatus
    ownership: Ownership
    bedroom: Int
    reception: Int
    description: String!
    keyFeatures: [String!]
    image: [PropertyImage!]
  }

  type Query {
    node(nodeId: ID!): Node
    properties(
      isLetting: Boolean
      propertyType: PropertyType
      propertyStatus: PropertyStatus
    ): [Property!]
    test: String
  }

  enum PropertyType {
    HOUSE
    FLAT
    BUNGALOW
  }

  enum PropertyStatus {
    NA
    FOR_SALE
    OFFER_ACCEPTED
    SOLD
  }

  enum Ownership {
    NA
    FREEHOLD
    LEASEHOLD
  }

  input PropertyInput {
    addressLine1: String!
    addressLine2: String
    postcode: String!
    isLetting: Boolean
    propertyType: PropertyType!
    isActive: Boolean
    price: Int
    priceStatus: String
    propertyStatus: PropertyStatus
    ownership: Ownership
    bedroom: Int
    reception: Int
    description: String!
    keyFeatures: [String!]
  }

  interface File {
    id: ID!
    filepath: String
    mimetype: String!
    encoding: String!
  }

  input PropertyImageEditInput {
    id: ID!
    description: String
    order: Int
  }

  type DeletedItem {
    id: ID!
  }

  enum ProcessingStatus {
    NOT_STARTED
    PENDING
    STARTED
    DONE
  }

  type Mutation {
    addProperty(property: PropertyInput): Property
    updateProperty(id: ID!, property: PropertyInput): Property
    deleteProperty(id: ID!): DeletedItem
  }
`;

function decodeNodeId(nodeID: string) {
  // decode node if to [type, id]
  return Buffer.from(nodeID, "base64").toString().split(":");
}

type StandardEnum<T> = {
  [K in keyof T]: T[K];
};

function resolveEnum<T>(enumValue: T): StandardEnum<T> {
  return Object.keys(enumValue).reduce((acc, key) => {
    if (isNaN(parseInt(key))) {
      //@ts-ignore
      acc[key] = enumValue[key];
    }
    return acc;
  }, {} as StandardEnum<T>);
}

const resolvers: IResolvers<any, Context> = {
  Query: {
    properties: async (parent, args, { knex }, info) => {
      return knex<Property>("property").select([
        ...selections(info, { filter: ["image"] }),
      ]);
    },
    node: async (parent, { nodeId }, { knex }, info) => {
      const [type, id] = decodeNodeId(nodeId);
      let result;
      if (type.toLowerCase() === "property") {
        result = await knex<Property>("property")
          .select([
            ...selections(info, { filter: ["image"], type: "Property" }),
          ])
          .where("id", id);
      }
      if (type.toLowerCase() === "propertyimage") {
        const selects = selections(info, { filter: [], type: "PropertyImage" });
        const hasFormat = selects.delete("format");
        const query = knex<PropertyImage, PropertyImage>(
          "property_image"
        ).select([...selects]);
        if (hasFormat) {
          query.select(
            knex.raw(
              `json_build_object('images', format)::json->'images' as format`
            )
          );
        }
        result = await query.where("id", id);
      }
      if (result) {
        return { ...result[0], __GLOBAL_ID_TYPE: type };
      }
      throw new Error("Object does not exists");
    },
  },
  Mutation: {
    updateProperty: async (parent, args, { knex }, info) => {
      const [type, id] = decodeNodeId(args.id);
      const { keyFeatures, ...property } = args.property;
      const result = ((await knex<Property, Property>("property")
        .returning([...selections(info)])
        .update({
          ...property,
          keyFeatures: JSON.stringify(keyFeatures || []),
        })
        .where("id", id)) as unknown) as Property[];
      return result[0];
    },
    addProperty: async (parent, args, { knex }, info) => {
      const { keyFeatures, ...property } = args.property;
      return knex<Property>("property")
        .returning([...selections(info)])
        .insert({
          ...property,
          keyFeatures: JSON.stringify(keyFeatures || []),
        })
        .then((properties) => properties[0]);
    },
    deleteProperty: async (parent, args, { knex }, info) => {
      const [type, id] = decodeNodeId(args.id);
      const query = knex<PropertyImage, PropertyImage>(
        "property_image"
      ).select([
        "id",
        "original",
        knex.raw(
          `json_build_object('images', format)::json->'images' as format`
        ),
      ]);

      const data = await query.where("propertyId", id);
      if (data.length) {
        deletePropertyImageFromS3(data as PropertyImage[]);
      }

      await knex<Property>("property").delete().where("id", id);
      return {
        id: args.id,
      };
    },
  },
  PropertyType: {
    HOUSE: 1,
    FLAT: 2,
    BUNGALOW: 3,
  },
  Ownership: {
    NA: 0,
    FREEHOLD: 1,
    LEASEHOLD: 2,
  },
  PropertyStatus: {
    NA: 0,
    FOR_SALE: 1,
    OFFER_ACCEPTED: 2,
    SOLD: 3,
  },
  ProcessingStatus: resolveEnum<typeof ProcessingStatus>(ProcessingStatus),
  File: {
    __resolveType(obj: { type: string }) {
      return obj.type;
    },
  },
  Node: {
    __resolveType(obj: any, context: any, info: any) {
      return obj.__GLOBAL_ID_TYPE;
    },
  },
  PropertyImage: {
    id(obj) {
      return Buffer.from(`PropertyImage:${obj.id}`).toString("base64");
    },
  },
  Property: {
    id(obj) {
      return Buffer.from(`Property:${obj.id}`).toString("base64");
    },
    async image(parent: Property, args, { knex }, info) {
      const selects = selections(info);
      const hasFormat = selects.delete("format");
      const query = knex<PropertyImage, PropertyImage>(
        "property_image"
      ).select([...selects]);
      if (hasFormat) {
        query.select(
          knex.raw(
            `json_build_object('images', format)::json->'images' as format`
          )
        );
      }
      const data = await query
        .where("propertyId", parent.id)
        .orderBy([
          { column: "order" },
          { column: "updated_at", order: "desc" },
        ]);

      return data;
    },
  },
};

const options: VerifyOptions = {
  audience: "http://fullersestates.com/",
  issuer: "https://dev-u8w-c5z5.eu.auth0.com/",
  algorithms: ["RS256"],
};

function ProtectMutations(next: IFieldResolver<any, any, any>) {
  return async (
    parent: any,
    args: any,
    context: any,
    info: any
  ): Promise<IFieldResolver<any, any, any>> => {
    const user = await context.user;
    if (user && user.email) {
      return next(parent, args, context, info);
    }
    throw new AuthenticationError("You must be logged in");
  };
}

const resolversFunc = merge({}, resolvers, propertyImageResolver);
resolversFunc.Mutation = Object.entries(resolversFunc.Mutation).reduce(
  (acc, [key, value]) => {
    acc[key] = ProtectMutations(value);
    return acc;
  },
  {} as IResolverObject<any, any>
);

const server = new ApolloServer({
  typeDefs: [typeDefs, ...propertyImageTypeDef],
  resolvers: resolversFunc,
  engine: {
    debugPrintReports: true,
  },
  tracing: true,
  context: ({ req }) => {
    const token = req.headers.authorization?.split(" ")[1];
    const user = new Promise(async (resolve, reject) => {
      if (token) {
        jwt.verify(token, getKey, options, async (err, jwtDecoded) => {
          if (err) {
            return reject(err);
          }
          const decoded = jwtDecoded as { sub?: string; aud?: string[] };
          if (
            decoded.sub &&
            decoded.aud?.includes("http://fullersestates.com/")
          ) {
            const userString = await getAsync(decoded.sub);

            let user = userString && JSON.parse(userString);
            if (!user) {
              user = await auth0.getUser({ id: decoded.sub });
              redis.setex(decoded.sub, 6 * 60 * 60, JSON.stringify(user));
            }
            return resolve(user);
          }
        });
      } else {
        return resolve();
      }
    });

    return {
      knex,
      user,
    };
  },
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
