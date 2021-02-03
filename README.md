# Fullers Estate Agent GraphQL API

This is the repo for Fullers Estate agent api.

## Overview

This API will be used for the public viewing site and the admin tool. The authentication is outsourced to auth0.

## Requirements

- Redis (async image processing via Bull)
- PostgreSQL
- S3 bucket (localstack for development)

## Getting Started

Docker is used to manage the requirements.
run `docker-compose up` to start the services.

Next install the node dependencies.
`npm install`

Create an .env file and set the environment values

```
S3_ACCESS_KEY_ID = ""
S3_SECRET_ACCESS_KEY = ""
S3_REGION = eu-west-1

AUTH0_DOMAIN = ""
AUTH0_CLIENT_ID = ""
AUTH0_CLIENT_SECRET = ""
AUTH0_AUDIENCE = ""
AUTH0_SCOPE = ""

DATABASE_URL ""
REDIS_URL = ""

# Optional
APOLLO_KEY = ""
APOLLO_GRAPH_VARIANT = ""
```

### Migrate the databse

Run `npx knex:latest` to setup the database.

### Run the project

Run `npm run dev` to start the project this will start the main process and run the the parallel worker process for image compression.
