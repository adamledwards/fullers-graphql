import * as dotenv from "dotenv";
import * as Joi from "joi";

dotenv.config();

const {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_SCOPE,
  REDIS_URL,
  DATABASE_URL,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT,
  S3_BUCKET,
} = process.env;

type Config = {
  redisUrl: string;
  databaseUrl: string;
  auth: {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience: string;
    scope: string;
  };
  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
  };
  s3Bucket: string;
};
const schema = Joi.object<Config>({
  databaseUrl: Joi.string().required(),
  redisUrl: Joi.string().required(),
  auth: Joi.object({
    domain: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    audience: Joi.string().required(),
    scope: Joi.string().required(),
  }),
  s3: Joi.object({
    accessKeyId: Joi.string().required(),
    secretAccessKey: Joi.string().required(),
    endpoint: Joi.string().required(),
  }),
  s3Bucket: Joi.string().required(),
});

const { error, value } = schema.validate({
  redisUrl: REDIS_URL,
  databaseUrl: DATABASE_URL,
  auth: {
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    audience: AUTH0_AUDIENCE,
    scope: AUTH0_SCOPE,
  },
  s3: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    endpoint: S3_ENDPOINT,
  },
  s3Bucket: S3_BUCKET,
});

if (error) {
  throw error;
}

export default value as Config;
