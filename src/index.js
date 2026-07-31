require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const pool = require('./config/database');
const buildSchema = require('./graphql/schema');
const { createContext, pgTransactionPlugin } = require('./graphql/pg-context');

/**
 * Boots the Express + Apollo Server: DB health check, merged schema build,
 * GraphQL endpoint with per-request transaction context, graceful shutdown.
 */
async function main() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Verify DB connection before starting
  try {
    const result = await pool.query('SELECT 1 AS connected');
    console.log(`✅ DB connected (${result.rows[0].connected})`);
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Build merged schema (PostGraphile + custom domains)
  const schema = await buildSchema();

  const apollo = new ApolloServer({
    schema,
    introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
    plugins: [
      // Landing page plugin optional — omit to disable in Apollo Server v4
      ...(process.env.GRAPHQL_LANDING_PAGE !== 'false'
        ? [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
        : []),
      pgTransactionPlugin,
    ],
  });
  await apollo.start();
  app.use('/graphql', expressMiddleware(apollo, { context: createContext }));

  const port = process.env.PORT || 4000;
  const server = app.listen(port, () => {
    console.log(`🌐 Apollo:      http://localhost:${port}/graphql`);
    console.log(`❤️  Health:      http://localhost:${port}/health`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  /**
   * Gracefully stops accepting connections, drains the DB pool, then exits.
   * @param {string} signal Received signal name (SIGINT/SIGTERM).
   */
  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => {
      pool.end()
        .then(() => process.exit(0))
        .catch((err) => {
          console.error('Error closing DB pool:', err.message);
          process.exit(1);
        });
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('❌ Startup error:', err);
  process.exit(1);
});
