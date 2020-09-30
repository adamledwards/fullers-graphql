import {
  FieldNode,
  SelectionNode,
  GraphQLResolveInfo,
  SelectionSetNode,
  FragmentSpreadNode,
  InlineFragmentNode,
} from "graphql";

export default function selections(
  info: GraphQLResolveInfo,
  options?: { filter: string[]; type?: string }
) {
  let collectFields: string[] = [];

  const fieldNode = info.fieldNodes[0];
  if (fieldNode?.selectionSet) {
    collectFields = [
      ...collectFields,
      ...extractFields(fieldNode?.selectionSet, info, options),
    ];
  }

  const fields = new Set(["id", ...collectFields]);
  fields.delete("__typename");
  return fields;
}

function extractFields(
  selectionSet: SelectionSetNode,
  info: GraphQLResolveInfo,
  options?: { filter: string[]; type?: string }
) {
  return selectionSet.selections.reduce((fields, field) => {
    if (isFieldNode(field) && !options?.filter.includes(field.name.value)) {
      fields.push(field.name.value);
    } else if (isFragmentSpread(field)) {
      fields = [
        ...fields,
        ...extractFields(
          info.fragments[field.name.value].selectionSet,
          info,
          options
        ),
      ];
    } else if (
      isInlineFragment(field) &&
      field.typeCondition?.name.value === options?.type
    ) {
      fields = [...fields, ...extractFields(field.selectionSet, info, options)];
    }
    return fields;
  }, <Array<string>>[]);
}

function isFieldNode(node: SelectionNode): node is FieldNode {
  if (node.kind === "Field") {
    return true;
  }
  return false;
}

function isFragmentSpread(node: SelectionNode): node is FragmentSpreadNode {
  if (node.kind == "FragmentSpread") {
    return true;
  }
  return false;
}

function isInlineFragment(node: SelectionNode): node is InlineFragmentNode {
  if (node.kind == "InlineFragment") {
    return true;
  }
  return false;
}
