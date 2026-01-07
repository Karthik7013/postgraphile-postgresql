import express from 'express';
import { createPostGraphQLSchema } from 'postgraphile';
import fs from 'fs';
import dotenv from 'dotenv'
import { ApolloServer } from 'apollo-server-express';
import pg from 'pg';
dotenv.config()

const app = express();

async function startServer() {
    const pgPool = new pg.Pool({
        connectionString: process.env.CONNECTION_STRING,
        ssl: {
            ca: fs.readFileSync('./CA.pem').toString(),
            rejectUnauthorized: true
        }
    });

    const schema = await createPostGraphQLSchema(pgPool, ['contact_management','user_management']);

    const server = new ApolloServer({
        schema,
        persistedQueries: false,  // Added: Disable persisted queries to prevent DoS vulnerability
        introspection: true,
        context: async () => {
            const pgClient = await pgPool.connect();
            await pgClient.query('BEGIN');
            return { pgClient };
        },
        plugins: [{
            async requestDidStart() {
                return {
                    async willSendResponse({ context, errors }) {
                        if (context.pgClient) {
                            try {
                                await context.pgClient.query(errors ? 'ROLLBACK' : 'COMMIT');
                            } finally {
                                context.pgClient.release();
                            }
                        }
                    }
                };
            }
        }]
    })
    await server.start()
    server.applyMiddleware({ app, path: '/graphql' })
    app.listen(5000, () => {
        console.log('server running on http://localhost:5000/graphql');
    });
}

startServer().catch(console.error)
