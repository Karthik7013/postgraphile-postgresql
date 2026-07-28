# Implement JWT Auth with Roles + Postgres RLS Enforcement


## Goal

Add authentication and authorization to the existing Apollo Server + PostGraphile app without exposing auth tables via GraphQL.

## Decisions

1. Use Apollo Server REST route `POST /auth/signin` for JWT issuance (not GraphQL mutation).
2. Store auth tables in `user_management` schema; generate GraphQL schema only from `contact_management`.
3. Use flexible many-to-many `users ↔ roles` and `roles → permissions` model.
4. Centralized enforcement via Postgres Row Level Security (RLS) with transaction-scoped session variables.
5. Auth tables remain DB-only: no auto-generated GraphQL exposure.

## Implementation Steps

### 1. Add Dependencies

- `jsonwebtoken`
- `bcrypt`

Update `package.json` and run `npm install`.

### 2. Create Auth Tables Migration

Add `/migrations/001_create_auth_tables.sql`:

Tables in `user_management`:
- `users`: `id`, `email`, `password_hash`, `created_at`, `updated_at`
- `roles`: `id`, `name`, `description`
- `permissions`: `id`, `name`, `description`
- `user_roles`: `user_id`, `role_id`
- `role_permissions`: `role_id`, `permission_id`

Include unique constraints, indexes on `email`, and junction table PKs.

### 3. Signin Endpoint

Create `src/routes/auth.js`:

- `POST /auth/signin` accepts `{email, password}`
- Queries `user_management.users` by email, verifies password with `bcrypt.compare`
- On success: issues JWT containing `{userId, roleIds, email}` signed with `JWT_SECRET` from `.env`
- Returns `{token, user: {id, email, roles}}`
- On failure: returns 401

Wire into `src/app.js` via `app.use('/auth', authRouter)` before Apollo middleware.

### 4. JWT Middleware for GraphQL

Create `src/middleware/auth.js`:

- Reads `Authorization` header from incoming GraphQL requests
- Verifies JWT with `jsonwebtoken.verify`
- On success: returns context with `{userId, roleIds, email, req}`
- On failure/missing: attaches anonymous context or throws authentication error (recommend 401 via Apollo error)

Apply as Express middleware on `/graphql` path before `server.applyMiddleware`:

```js
app.use(
  server.graphqlPath,
  authMiddleware
);
```

Update Apollo Server context function to merge middleware-derived auth state:
```js
context: ({ req }) => ({ ...req.authContext, pgClient })
```

### 5. Transaction Plugin Update (RLS Support)

Update `src/plugins/transaction.js`:
- After `BEGIN`, execute:
  - `SET LOCAL app.current_user_id = '<userId>'`
  - `SET LOCAL app.current_role_ids = '<comma-separated-roleIds>'`
- These are Postgres session variables scoped to the transaction and visible to RLS policies.

### 6. Postgres Row Level Security Policies

Create `/migrations/002_enable_rls.sql`:

For tables in `contact_management` that need access control:

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Create policies using `app.current_user_id` and `app.current_role_ids` for SELECT/INSERT/UPDATE/DELETE operations.
- Example policy pattern:
  ```sql
  CREATE POLICY contact_policy ON contact_management.contacts
    FOR ALL TO PUBLIC
    USING (
      /* logic using app.current_user_id / app.current_role_ids */
    );
  ```

Create a DB role or ensure the connection role has permission to use these session variables.

### 7. Environment Configuration

Add to `.env`:
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRY=1h` (optional, configurable)

Document in README.

### 8. Validation Checks

Confirm:
1. Valid JWT → GraphQL requests succeed, RLS sees correct `app.current_user_id`
2. Missing JWT → 401 or anonymous context (depending on implementation choice)
3. Invalid JWT → rejected with error
4. Signin with wrong password → 401
5. Signin with valid credentials → returns token
6. RLS policies restrict data access based on role membership

## Files to Create

- `src/routes/auth.js`
- `src/middleware/auth.js`
- `migrations/001_create_auth_tables.sql`
- `migrations/002_enable_rls.sql`

## Files to Modify

- `package.json` (add `jsonwebtoken`, `bcrypt`)
- `.env` (add `JWT_SECRET`)
- `src/app.js` (add auth route + middleware wiring)
- `src/plugins/transaction.js` (add `SET LOCAL` statements)
- `README.md` (document `/auth/signin` and `.env` requirements)

## Out of Scope

- Password reset, email verification, refresh tokens
- GraphQL-facing mutations for auth
- UI or client integration
- Rate limiting
