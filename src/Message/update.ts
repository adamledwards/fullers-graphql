import { gql } from "apollo-server";
import { IFieldResolver, IResolvers } from "graphql-tools";
import Knex from "knex";
import selections from "../utils/selection";
import { Context, MessageType, Message } from "./types";

export const typeDef = gql`

  input ReadInput {
    id: ID!,
    read: Boolean
  }



 
 extend type Mutation {
    updateRead(status: ReadInput!): Message
    
 }

`

function decodeNodeId(nodeID: string) {
    return Buffer.from(nodeID, "base64").toString().split(":");
  }

export const resolver: IResolvers<any, Context> = {
    Mutation: {
        async updateRead(parent, { status }, { knex }, info) {
            const [type,  id] = decodeNodeId(status.id)
            let selectionSet = selections(info, { type, filter: [] })
            selectionSet = new Set([...selectionSet, 'formType'])
            const query = await knex<Message>('message').update({
                read: status.read,
            })
            //@ts-ignore
            .returning([...selectionSet])
            return query[0]
        },
      
    }
}