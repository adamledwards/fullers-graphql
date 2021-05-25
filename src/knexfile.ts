require("dotenv").config();
const {parse} = require('pg-connection-string')
const pgconfig = parse(process.env.DATABASE_URL);
pgconfig.ssl = { rejectUnauthorized: false };
export = {
  client: "postgresql",
  connection: pgconfig,
}