module.exports = {
  client: 'pg',
  connection: process.env.CONNECTION_STRING,
  pool: { min: 0, max: 8 },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
};
