const pool = require('../config/database');

// PostGraphile resolvers need a real pg client, and its mutations use
// SAVEPOINT statements that require a transaction block — mirror
// PostGraphile's own middleware by wrapping every request in BEGIN/COMMIT.

/**
 * Apollo Server context factory: grabs a pg client from the pool and
 * opens a transaction so PostGraphile's SAVEPOINT-based mutations work.
 *
 * @returns {Promise<{ pgClient: import('pg').PoolClient }>} Context with a
 *   transaction-wrapped client (finalized by `pgTransactionPlugin`).
 */
async function createContext() {
  const pgClient = await pool.connect();
  await pgClient.query('BEGIN');
  return { pgClient };
}

/**
 * Apollo Server plugin that finalizes the per-request transaction: COMMIT
 * normally; if the transaction aborted (COMMIT fails), ROLLBACK cleans it
 * up. The pooled client is always released.
 */
const pgTransactionPlugin = {
  requestDidStart() {
    return {
      willSendResponse: async ({ contextValue }) => {
        const pgClient = contextValue?.pgClient;
        if (!pgClient) return;
        await pgClient.query('COMMIT')
          .catch(() => pgClient.query('ROLLBACK'))
          .catch(() => {});
        pgClient.release();
      },
    };
  },
};

module.exports = { createContext, pgTransactionPlugin };
