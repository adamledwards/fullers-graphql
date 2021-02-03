
import Knex from "knex";
 export enum MessageType {
    VIEWING,
    VALUATION,
    CONTACT,
  }
  export interface Message {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    message?: string;
    telephone?: string;
    created_at: string;
    updated_at: string;
    addressLine1: string;
    addressLine2: string;
    town: string;
    postcode: string;
    formType: MessageType;
    read: boolean;
    propertyId: number;
  }

  export type Context = {
    knex: Knex;
    user: {};
  };