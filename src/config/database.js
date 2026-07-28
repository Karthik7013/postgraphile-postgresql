import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

dotenv.config();

export function createPool() {
  return new pg.Pool({
    connectionString: process.env.CONNECTION_STRING,
    ssl: {
      ca: fs.readFileSync('./CA.pem').toString(),
      rejectUnauthorized: true
    }
  });
}
