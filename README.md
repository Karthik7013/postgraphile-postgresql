# PostGraphile Express Server

This project implements a GraphQL API using Express, Apollo Server, and PostGraphile. It automatically generates a GraphQL schema based on your PostgreSQL database schema and serves it via Apollo Server.

 🟢 Live Demo

You can access the deployed GraphQL Playground here:  
[https://postgraphile-postgresql.onrender.com/graphql](https://postgraphile-postgresql.onrender.com/graphql)

## Features

- **Automatic Schema Generation**: Uses `postgraphile` to create a GraphQL schema from a PostgreSQL database.
- **Apollo Server Integration**: Runs the schema within `apollo-server-express` for a robust GraphQL server experience.
- **Transaction Management**: Implements a transactional workflow where every request runs inside a PostgreSQL transaction.
  - `BEGIN` on request start.
  - `COMMIT` on success.
  - `ROLLBACK` if errors occur.
- **JWT Authentication**: Sign in via `POST /auth/signin` to receive a JWT. Pass it in the `Authorization: Bearer <token>` header on GraphQL requests.
- **Role-Based Authorization**: Centralized access control managed via `user_management` schema tables (`users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `schema_grants`, `table_permissions`, `rls_policies`).
- **PostgreSQL Row Level Security (RLS)**: Database-enforced row-level access control using session variables set per request.
- **Multi-Module Schema Support**: Configure which PostgreSQL schemas are exposed via GraphQL with `GRAPHQL_SCHEMAS` env var.
- **Admin REST API**: Manage roles, permissions, schema grants, table permissions, and RLS policies via `/admin/*` endpoints.
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

   Create a `.env` file in the root directory containing your database connection string and JWT secret:

   ```env
   CONNECTION_STRING=postgres://username:password@hostname:port/dbname
   JWT_SECRET=your-strong-random-secret
   JWT_EXPIRY=1h
   GRAPHQL_SCHEMAS=contact_management
   ```
   
   - `GRAPHQL_SCHEMAS`: comma-separated list of schemas to expose via GraphQL (default: `contact_management`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: optional overrides for the initial admin seed (default: `admin@example.com` / `Admin@123`)

3. **SSL Certificate**

   Ensure you have a `CA.pem` file in the root directory. This file is required by the application to establish a secure SSL connection to your PostgreSQL instance.

4. **Database Migrations**

   Run migrations with Knex:

   ```bash
   npm run migrate:latest
   ```

5. **Initial Seed**

   Seed the default admin user, roles, and permissions:

   ```bash
   npm run seed:run
   ```

## Running the Server

Start the application:

```bash
node src/index.js
```

The server will start locally on port 5000. You can access the endpoint at http://localhost:5000/graphql.

## Authentication Flow

1. **Sign In**

   ```bash
   curl -X POST http://localhost:5000/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Admin@123"}'
   ```

   Response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 1,
       "email": "admin@example.com",
       "roles": []
     }
   }
   ```

2. **GraphQL Requests**

   Pass the JWT in the `Authorization` header:

   ```bash
   curl -X POST http://localhost:5000/graphql \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ contacts { id } }"}'
   ```

## Admin REST API

All `/admin/*` endpoints require authentication and admin role.

**Management of roles, permissions, schema grants, and table permissions:**

- `GET /admin/roles` - list roles
- `POST /admin/roles` - create role (`{ name, description }`)
- `POST /admin/roles/:roleId/permissions` - assign permissions to role (`{ permissionIds: [1, 2, 3] }`)
- `DELETE /admin/roles/:roleId/permissions/:permissionId` - remove permission from role
- `POST /admin/roles/:roleId/schemas` - grant schema access to role (`{ schemaName, allowed }`)
- `DELETE /admin/roles/:roleId/schemas/:schemaName` - revoke schema access from role
- `POST /admin/roles/:roleId/schemas/:schemaName/tables` - set table permissions (`{ tableName, can_select, can_insert, can_update, can_delete }`)
- `PUT /admin/roles/:roleId/schemas/:schemaName/tables/:tableName` - update table permissions

**RLS Management:**

- `POST /admin/rls/own-records` - enable "own records" RLS on a table (`{ schemaName, tableName, ownerColumn }`)
- `DELETE /admin/rls/policies/:schemaName/:tableName/:policyName` - drop an RLS policy

## Roles and Permissions

The auth schema is intentionally **not exposed via GraphQL**. Initial data is seeded via Knex. The admin user can manage roles, permissions, schema grants, and table permissions through `/admin/*` REST endpoints.

### Predefined Roles

- `admin` — full access
- `user` — limited access
- `guest` — no permissions by default

### Guest Access

Unauthenticated requests are allowed. RLS policies enforce what anonymous users can access. By default, unauthenticated users have no user context and will only see rows permitted by guest-level policies.
