import { resolver as createResolver, typeDef as createTypeDef } from "./create";

import { resolver as deleteResolver, typeDef as deleteTypeDef } from "./delete";

import { resolver as updateResolver, typeDef as updateTypeDef } from "./update";

import { merge } from "lodash";

export const typeDef = [createTypeDef, deleteTypeDef, updateTypeDef];
export const resolver = merge(
  {},
  createResolver,
  deleteResolver,
  updateResolver
);
