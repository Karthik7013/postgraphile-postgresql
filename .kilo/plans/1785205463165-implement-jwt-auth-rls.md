# Implement JWT Auth + Roles + RLS Enforcement

## Goal
Add JWT authentication, role/permission-based authorization, and centralized Postgres RLS enforcement to the existing Apollo Server + PostGraphile app without exposing auth tables via GraphQL.

## Architecture Decisions
- Auth: Apollo Server REST route `POST /auth/signin` (not GraphQL mutation).
- Auth tables live in `user_management` schema; PostGraphile generates GraphQL schema only from `contact_management`.
- Role model: many-to-many `users ↔ roles` and `roles ↔ permissions`.
- Enforcement: Postgres Row Level Security (RLS) using transaction-scoped session variables set per request.

## Implementation Steps

### 1. Dependencies
Add to `package.json`:
- `jsonwebtoken`
- `bcrypt`

Run `npm install`.

### 2. Auth Tables Migration
Create `migrations/001_create_auth_tables.sql`:

Tables in `user_management`:
- `users`: `id`, `email`, `password_hash`, `created_at`, `updated_at`
- `roles`: `id`, `name`, `description`
- `permissions`: `id`, `name`, `description`
- `user_roles`: `user_id`, `role_id`
- `role_permissions`: `role_id`, `permission_id`

Include unique constraints, indexes on `email`, and junction table PKs.

### 3. Signin Endpoint
Create `src/routes/auth.js`:
- `POST /auth/signin` body: `{email, password}`
- Lookup user in `user_management.users`, verify with `bcrypt.compare`
- Success: sign JWT with `{userId, roleIds, email}` using `JWT_SECRET` from `.env`
- Return `{token, user: {id, email, roles}}`
- Fail: return `401 Unauthorized`

Wire in `src/app.js` via `app.use('/auth', authRouter)` before Apollo middleware.

### 4. JWT Middleware
Create `src/middleware/auth.js`:
- Read `Authorization` header on `/graphql` requests
- Verify JWT
- On success: attach `{userId, roleIds, email}` to request
- On failure/missing: return `401` (or anonymous context; recommend 401)

Apply as Express middleware on `server.graphqlPath` before `server.applyMiddleware`.

Update Apollo context to merge auth state:
```js
context: ({ req }) => ({ ...req.authContext, pgClient })
```

### 5. Transaction Plugin Update (RLS)
Update `src/plugins/transaction.js`:
- After `BEGIN`, execute:
  - `SET LOCAL app.current_user_id = '<userId>'`
  - `SET LOCAL app.current_role_ids = '<comma-separated-roleIds>'`

These Postgres session variables are scoped to the current transaction and consumed by RLS policies.

### 6. RLS Policies
Create `migrations/002_enable_rls.sql`:

For tables in `contact_management` that need access control:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Create policies using `app.current_user_id` and `app.current_role_ids` for SELECT/INSERT/UPDATE/DELETE operations.

Ensure the DB role used by the app has permission to use these session variables.

### 7. Environment
Add to `.env`:
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRY=1h` (optional)

Update `README.md` to document:
- `/auth/signin` endpoint
- `.env` requirements

## Files to Create
- `src/routes/auth.js`
- `src/middleware/auth.js`
- `migrations/001_create_auth_tables.sql`
- `migrations/002_enable_rls.sql`

## Files to Modify
- `package.json`
- `.env` (add `JWT_SECRET`)
- `src/app.js`
- `src/plugins/transaction.js`
- `README.md`

## Validation Checklist
1. Valid JWT → GraphQL requests succeed; RLS sees correct `app.current_user_id`
2. Missing JWT → rejected with 401
3. Invalid JWT → rejected with error
4. Wrong password → 401
5. Valid credentials → returns token
6. RLS policies restrict data access based on role membership
7. Transaction rollback on errors still works

## Out of Scope
- Password reset, email verification, refresh tokens
- GraphQL-facing auth mutations
- UI or client integration
- Rate limiting
