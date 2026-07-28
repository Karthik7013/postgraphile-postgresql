import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createPool } from '../config/database.js';
import { buildSchema } from '../graphql/schema.js';
import { transactionPlugin } from '../plugins/transaction.js';

export async function createApp() {
  const app = express();

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  const pgPool = createPool();
  const schema = await buildSchema(pgPool);

  const server = new ApolloServer({
    schema,
    persistedQueries: false,
    introspection: true,
    context: async () => {
      const pgClient = await pgPool.connect();
      await pgClient.query('BEGIN');
      return { pgClient };
    },
    plugins: [transactionPlugin()]
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  return app;
}
