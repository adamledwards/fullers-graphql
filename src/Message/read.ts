import { gql } from "apollo-server";
import { IResolverObject, IResolvers } from "graphql-tools";
import Knex from "knex";
import selections from "../utils/selection";
import { Context, MessageType, Message } from "./types";


export const typeDef = gql`

  interface Message {
    firstName: String
    lastName: String!
    email: String
    message: String
    telephone: String
    created_at: String
    updated_at: String

    read: Boolean
  }
  enum MessageType {
    VIEWING,
  VALUATION,
  CONTACT,
    }
  type Contact implements Node & Message {
    id: ID!

    firstName: String!
    lastName: String!
    email: String!
    message: String
    telephone: String
    created_at: String
    updated_at: String
    read: Boolean

    subject: String
  }

  type Valuation implements Node & Message {
    id: ID!

    firstName: String!
    lastName: String!
    email: String
    message: String
    telephone: String
    created_at: String
    updated_at: String
    read: Boolean

    addressLine1: String!
    addressLine2: String
    town: String!
    postcode: String!
  }

  type Viewing implements Node & Message {
    id: ID!

    firstName: String!
    lastName: String!
    email: String
    message: String
    telephone: String
    created_at: String
    updated_at: String
    read: Boolean

    subject: String
    property: Property!
  }

  type Contacts {
    total: Int!
    unread: Int!
    data: [Contact]
  }
  type Valuations {
    total: Int!
    unread: Int!
    data: [Valuation]
  }
  type Viewings {
    total: Int!
    unread: Int!
    data: [Viewing]
  }
  type Messages {
    contacts: Contacts
    valuations: Valuations
    viewings: Viewing
  }

  extend type Query {
    messages: Messages
  }
`;


const formTypeMap = {
    [MessageType.VIEWING]: 'Viewing',
    [MessageType.VALUATION]: 'Valuation',
    [MessageType.CONTACT]: 'Contact'
}

const messageGeneric = (type: string): IResolverObject => ({
  async total(
    { queryBuilder }: { queryBuilder: Knex.QueryBuilder },
    args,
    { knex },
    info
  ) {
    const query = await queryBuilder.count();
    return query[0].count;
  },
  async unread(
    { queryBuilder }: { queryBuilder: Knex.QueryBuilder },
    args,
    { knex },
    info
  ) {
    const query = await queryBuilder.where({ read: false }).count();
    return query[0].count;
  },
  async data(
    { queryBuilder }: { queryBuilder: Knex.QueryBuilder },
    args,
    { knex },
    info
  ) {
    const result  = await queryBuilder.select([...selections(info)]).orderBy(["created_at"]);
    return result
  },
});

export const resolver: IResolvers<any, Context> = {
    MessageType: {
        VIEWING: MessageType.VIEWING,
        VALUATION: MessageType.VALUATION,
        CONTACT: MessageType.CONTACT
    },
  Query: {
    messages(...args) {
      return args;
    },
  },
  Contact: {
    id(obj) {
        return Buffer.from(`Contact:${obj.id}`).toString("base64");
      },
  },
  Viewing: {
    id(obj) {
        return Buffer.from(`Viewing:${obj.id}`).toString("base64");
      },
  },
  Valuation: {
    id(obj) {
        return Buffer.from(`Valuation:${obj.id}`).toString("base64");
      },
  },
  Message: {
    __resolveType(obj: { formType: MessageType }) {
      return formTypeMap[obj.formType];
    },
  },
  Contacts: {
    ...messageGeneric('Contact'),
  },
  Valuations: {
    ...messageGeneric('Valuation'),
  },
  Viewings: {
    ...messageGeneric('Viewing'),
  },
  Messages: {
    contacts(parent, args, { knex }, info) {
      const queryBuilder = knex<Message>("message");
      queryBuilder.where({
        formType: MessageType.CONTACT,
      });
      return {
        get queryBuilder() {
          return queryBuilder.clone();
        },
      };
    },
    valuations(parent, args, { knex }, info) {
      const queryBuilder = knex<Message>("message");
      queryBuilder.where({
        formType: MessageType.VALUATION,
      });
      return {
        get queryBuilder() {
          return queryBuilder.clone();
        },
      };
    },
    viewings(parent, args, { knex }, info) {
      const queryBuilder = knex<Message>("message");
      queryBuilder.where({
        formType: MessageType.VIEWING
      });
      return {
        get queryBuilder() {
          return queryBuilder.clone();
        },
      };
    },
  },
};
