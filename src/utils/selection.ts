import {
  FieldNode,
  SelectionNode,
  GraphQLResolveInfo,
  
  SelectionSetNode,
  FragmentSpreadNode,
  InlineFragmentNode,
} from "graphql";


type SelectionFields = Array<string | {[key: string]: SelectionFields}>
export default function selections(
  info: GraphQLResolveInfo,
  options?: { filter: string[]; type?: string},
  selectionNodeName?: string
) {
  let collectFields: SelectionFields = [];

  const fieldNode = info.fieldNodes[0];

  if (fieldNode?.selectionSet) {
    let selections: SelectionSetNode | void = fieldNode.selectionSet
    if(selectionNodeName) {
      const selectionSet = fieldNode.selectionSet.selections.find((field) => isFieldNode(field) && field.name.value === selectionNodeName) as FieldNode
      selections = selectionSet?.selectionSet 
    }
    if(!selections) {
      return new Set()
    }
    
    collectFields = [
      ...collectFields,
      ...extractFields(selections, info, options),
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
      if(field.selectionSet?.selections) {
        // extractRootFields()
      }
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
  }, [] as SelectionFields);


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



