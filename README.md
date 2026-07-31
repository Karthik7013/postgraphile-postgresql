# LMS API

Apollo Server + PostGraphile GraphQL API for the learning platform.

## Stack

- **Apollo Server 4** — GraphQL server with Apollo Sandbox
- **PostGraphile 4** — auto-generates GraphQL types from PostgreSQL
- **Express** — HTTP server
- **PostgreSQL** — remote Aiven database
- **Merged Schema** — PostGraphile types + custom domain resolvers stitched together

## Project Structure

```
src/
├── index.js                        # Entry — Express, Apollo, health check
├── config/
│   └── database.js                 # PG pool with SSL support
├── graphql/
│   ├── schema.js                   # Builds PostGraphile + merges domain schemas
│   ├── domains.js                  # Auto-discovers domain folders
│   └── auth/                       # Domain: authentication
│       ├── typeDefs.js             # GraphQL SDL strings
│       ├── resolvers.js            # Resolver functions
│       └── index.js                # Re-exports { typeDefs, resolvers }
└── services/
    ├── auth.js                     # Auth business logic (signup, login, JWT)
    └── email.js                    # Email sending (verification, notifications)
```

### Adding a new domain

Create a folder under `graphql/` with the same three-file pattern:

```
graphql/courses/
├── typeDefs.js
├── resolvers.js
└── index.js
```

The `domains.js` auto-discovers it — no registration needed.

## Quick Commands

```bash
npm run dev      # Start dev server with nodemon (auto-restart on changes)
npm start        # Start production server
```

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/graphql` | Merged GraphQL (PostGraphile DB types + custom mutations) |
| `/health` | Health check — returns `{ status: "OK", timestamp: "..." }` |

Open `http://localhost:4000/graphql` in a browser for the **Apollo Sandbox** explorer.

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `production` | Environment name |
| `PORT` | No | `4000` | HTTP server port |
| `DB_HOST` | Yes | — | PostgreSQL host |
| `DB_USER` | Yes | — | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `DB_NAME` | Yes | — | Database name |
| `DB_PORT` | No | `5432` | Database port |
| `DB_SSL` | No | `false` | Enable SSL (`true`/`false`) |
| `DB_SSL_CA_PATH` | No | — | Path to CA certificate file |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | `true` | SSL rejection on/off |
| `JWT_SECRET` | For auth | — | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `STRIPE_SECRET_KEY` | For payments | — | Stripe API key |
| `EMAIL_HOST` | For email | — | SMTP host |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_SECURE` | No | `false` | SMTP SSL on/off |
| `EMAIL_USER` | For email | — | SMTP username |
| `EMAIL_PASS` | For email | — | SMTP password |
| `EMAIL_FROM` | No | `LMS <noreply@example.com>` | Sender address |

## Schema Merging

The API uses a merged schema approach:

1. **PostGraphile** introspects the `auth` database schema and generates Query/Mutation/types automatically
2. **Custom domains** (`auth/`, etc.) define additional typeDefs and resolvers
3. Both are stitched together via `@graphql-tools/schema` `makeExecutableSchema`

## Dependencies

- `@apollo/server` — Apollo Server 4
- `postgraphile` — PostGraphile (auto-generates GraphQL from DB)
- `@graphile-contrib/pg-simplify-inflector` — Cleaner type naming
- `@graphql-tools/schema` — Schema merging
- `pg` — PostgreSQL client
- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT tokens
- `nodemailer` — Email sending
- `stripe` — Payment processing
- `dotenv` — Environment config
- `cors`, `express` — HTTP layer
