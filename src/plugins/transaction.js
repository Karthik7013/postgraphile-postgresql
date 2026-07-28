export function transactionPlugin() {
  return {
    async requestDidStart() {
      return {
        async didStart(requestContext) {
          const { userId, roleIds } = requestContext.contextValue;
          if (userId) {
            const params = [`app.current_user_id = '${userId}'`];
            if (roleIds && roleIds.length > 0) {
              params.push(`app.current_role_ids = '${roleIds.join(',')}'`);
            }
            await requestContext.contextValue.pgClient.query(`SET LOCAL ${params.join(', ')}`);
          }
        },
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
