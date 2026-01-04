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

    const schema = await createPostGraphQLSchema(pgPool, 'public', {
        watchPg: true,
        graphiql: true,
        enhanceGraphiql: true,
        dynamicJson: true
    });

    const server = new ApolloServer({
        schema,
        introspection: true,
        tracing: true,
        cacheControl: true,
        formatError: (error) => {
            return error;
        },
        formatResponse: (response) => {
            return response;
        },
        context: async () => {
            const pgClient = await pgPool.connect();
            return { pgClient };
        },
        plugins: [{
            async requestDidStart() {
                return {
                    async willSendResponse({ context }) {
                        if (context.pgClient) context.pgClient.release();
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
