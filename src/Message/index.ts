import { merge } from "lodash";
import { typeDef as createTypeDef, resolver as createResolver } from "./create";
import { typeDef as readTypeDef, resolver as readResolver } from "./read";

import { typeDef as updateTypeDef, resolver as updateResolver } from "./update";
import { typeDef as deleteTypeDef, resolver as deleteResolver } from "./delete";

export const typeDef = [readTypeDef, createTypeDef, updateTypeDef, deleteTypeDef];

export const resolver = merge({}, readResolver, createResolver, updateResolver, deleteResolver);
