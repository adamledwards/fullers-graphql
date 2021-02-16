import { parse } from "postcode";


export function stripHouseNumber(addressLine1: string) {
  const re = /(\d+\s+)/g;
  const match = addressLine1.match(re);
  if (match) {
    return addressLine1.replace(match[0], "");
  }
  return addressLine1;
}

export function extractOutCode(postcode: string) {
  const { outcode } = parse(postcode);
  return outcode || "";
}
