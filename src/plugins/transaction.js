export function transactionPlugin() {
  return {
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
  };
}
