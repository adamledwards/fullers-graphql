import AWS from "aws-sdk";
import * as path from "path";
import config from "../../config";

const s3 = new AWS.S3(config.s3);

export async function getSignedUrl(unSignedUrl: string) {
  try {
    const url = await s3.getSignedUrlPromise("getObject", {
      Bucket: config.s3Bucket,
      Key: path.basename(unSignedUrl),
      Expires: 60 * 10,
    });
    return url;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export default s3;
