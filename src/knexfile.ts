require("dotenv").config();

module.exports = {
  client: "postgresql",
  connectionString: process.env.DATABASE_URL, 
  ssl: { 
      rejectUnauthorized: false 
  } 
}