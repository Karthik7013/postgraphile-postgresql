# PostGraphile Express Server

This project implements a GraphQL API using Express, Apollo Server, and PostGraphile. It automatically generates a GraphQL schema based on your PostgreSQL database schema and serves it via Apollo Server.

## Live Demo

You can access the deployed GraphQL Playground here:  
[https://postgraphile-postgresql.onrender.com/graphql](https://postgraphile-postgresql.onrender.com/graphql)

## Features

- **Automatic Schema Generation**: Uses `postgraphile` to create a GraphQL schema from a PostgreSQL database.
- **Apollo Server Integration**: Runs the schema within `apollo-server-express` for a robust GraphQL server experience.
- **Transaction Management**: Implements a transactional workflow where every request runs inside a PostgreSQL transaction.
  - `BEGIN` on request start.
  - `COMMIT` on success.
  - `ROLLBACK` if errors occur.
- **Secure Database Connection**: Configured to connect to the database using SSL with a custom CA certificate.

## Prerequisites

- Node.js
- PostgreSQL Database

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**

   Create a `.env` file in the root directory containing your database connection string:

   ```env
   CONNECTION_STRING=postgres://username:password@hostname:port/dbname
   ```

3. **SSL Certificate**

   Ensure you have a `CA.pem` file in the root directory. This file is required by the application to establish a secure SSL connection to your PostgreSQL instance.

## Running the Server

Start the application:

```bash
node index.js
```

The server will start locally on port 5000. You can access the endpoint at http://localhost:5000/graphql.
