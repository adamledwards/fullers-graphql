import { gql } from "apollo-server";
import { IFieldResolver, IResolvers } from "graphql-tools";
import Knex from "knex";
import selections from "../utils/selection";
import { Context, MessageType, Message } from "./types";

export const typeDef = gql`

  input DeletedMessageInput {
    id: ID!,
  
  }

  type DeletedMessage {
      id: ID!
  }

 extend type Mutation {
    deleteMessage(message: DeletedMessageInput!): DeletedMessage
    
 }

`

function decodeNodeId(nodeID: string) {
    return Buffer.from(nodeID, "base64").toString().split(":");
  }

export const resolver: IResolvers<any, Context> = {
    Mutation: {
        async deleteMessage(parent, { status }, { knex }, info) {
            const [type, id] = decodeNodeId(status.id)
            let selectionSet = selections(info, { type, filter: [] })
            selectionSet = new Set([...selectionSet, 'formType'])
            await knex('message').delete().where({id})
            
            return {
                id: status.id
            }
        },
      
    }
}