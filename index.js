import express from 'express';
import { postgraphile } from 'postgraphile';
import fs from 'fs';
import dotenv from 'dotenv'
dotenv.config()

const app = express();
const connectionString = process.env.CONNECTION_STRING

app.use(postgraphile(
    {
        connectionString,
        ssl: {
            ca: fs.readFileSync('./CA.pem'),
            rejectUnauthorized: true
        }
    },
    'public',
    {
        graphiql: true,
        enhanceGraphiql: true,
        watchPg: false,
        dynamicJson: true,
        ownerConnectionString: {
            connectionString,
            ssl: {
                ca: fs.readFileSync('./CA.pem'),
                rejectUnauthorized: true
            }
        }
    }
));

app.listen(5000, () => {
    console.log('server running on 5000/graphiql');
});
