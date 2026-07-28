import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createPool } from '../config/database.js';
import { buildSchema } from '../graphql/schema.js';
import { transactionPlugin } from '../plugins/transaction.js';
import authRouter from '../routes/auth.js';
import { authMiddleware } from '../middleware/auth.js';

export async function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  const pgPool = createPool();

  app.use('/auth', authRouter);

  const schema = await buildSchema(pgPool);

  const server = new ApolloServer({
    schema,
    persistedQueries: false,
    introspection: true,
    context: ({ req }) => ({
      ...req.authContext,
      pgClient: pgPool.connect()
    }),
    plugins: [transactionPlugin()]
  });

  await server.start();

  app.use(server.graphqlPath, authMiddleware);
  server.applyMiddleware({ app, path: '/graphql' });

  return app;
}
