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
- **Role-Based Authorization**: Centralized access control managed via `user_management` schema tables (`users`, `roles`, `permissions`, `user_roles`, `role_permissions`).
- **PostgreSQL Row Level Security (RLS)**: Database-enforced row-level access control using session variables set per request.
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
   ```

3. **SSL Certificate**

   Ensure you have a `CA.pem` file in the root directory. This file is required by the application to establish a secure SSL connection to your PostgreSQL instance.

4. **Database Migrations**

   Run migrations with Knex:

   ```bash
   npm run migrate:latest
   ```

5. **Initial Seed**

   Seed the default admin user and basic roles/permissions:

   ```bash
   npm run seed:run
   ```

   Default admin credentials:
   - Email: `admin@example.com`
   - Password: `Admin@123`

   You can override them with environment variables:
   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourPassword123 npm run seed:run
   ```

## Running the Server

Start the application:

```bash
node src/index.js
```

The server will start locally on port 5000. You can access the endpoint at http://localhost:5000/graphql.

## Roles and Permissions

The auth schema is intentionally **not exposed via GraphQL**. Initial data is seeded via Knex. The admin user can manage roles and permissions through direct SQL or by extending the seed system.

### Predefined Roles

- `admin` — full access (`contact:create`, `contact:read`, `contact:update`, `contact:delete`, `role:*`, `user:*`)
- `user` — limited read-only access (`contact:read`, `role:read`, `user:read`)
- `guest` — no permissions by default

### Guest Access

Unauthenticated requests are allowed. RLS policies enforce what anonymous users can access. By default, unauthenticated users have no user context and will only see rows permitted by guest-level policies.

## Authentication Flow

1. **Sign In**

   ```bash
   curl -X POST http://localhost:5000/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

   Response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 1,
       "email": "user@example.com",
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
