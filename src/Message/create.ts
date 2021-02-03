import { gql } from "apollo-server";
import { IFieldResolver, IResolvers } from "graphql-tools";
import Knex from "knex";
import selections from "../utils/selection";
import { Context, MessageType, Message } from "./types";

export const typeDef = gql`
 input ContactInput {
    firstName: String!
    lastName: String!
    email: String!
    message: String
    telephone: String
    subject: String
 }

 input ValuationInput {
    
    firstName: String!
    lastName: String!
    email: String
    message: String
    telephone: String
    subject: String

    addressLine1: String!
    addressLine2: String
    town: String!
    postcode: String!
  }


  input ViewingInput {


    firstName: String!
    lastName: String!
    email: String
    message: String
    telephone: String
    

    subject: String
    propertyId: String!
  }


 type Success {
    ok: Boolean
    firstName: String!
    lastName: String!
 }
 
 extend type Mutation {
    addContactMessage(message: ContactInput!): Success
    addValuationMessage(message: ValuationInput!): Success
    addViewingMessage(message: ViewingInput!): Success
 }

`

const addMessage: IFieldResolver<any, Context & {formType: MessageType}> = async function(parent, { message }, { knex, formType }, info) {
    
    const query = await knex<Message>('message').insert({
        formType,
        read: false,
        ...message
    }).returning(['firstName', 'lastName'])
   
    return {
        ...query[0],
        ok: true
    }
}

function decodeNodeId(nodeID: string) {
    return Buffer.from(nodeID, "base64").toString().split(":");
  }

export const resolver: IResolvers<any, Context> = {
    Mutation: {
        addContactMessage(parent, args, context, info) {
            console.log(args)
            return addMessage(parent, args, {...context, formType: MessageType.CONTACT }, info)
        },
        addValuationMessage(parent, args, context, info) {
            return addMessage(parent, args, {...context, formType: MessageType.VALUATION }, info)
        },
        addViewingMessage(parent, args, context, info) {
            const [type, propertyId] = decodeNodeId(args.message.propertyId)
            console.log(args)
            const newArgs = {
                ...args, 
                message:{
                    ...args.message,
                    propertyId 
                }
            }
            
            return addMessage(parent, newArgs, {...context, formType: MessageType.VIEWING }, info)
        }
    }
}