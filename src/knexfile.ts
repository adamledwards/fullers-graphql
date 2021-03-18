require("dotenv").config();

module.exports = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  ssl: true
};
