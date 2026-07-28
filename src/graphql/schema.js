import { createPostGraphQLSchema } from 'postgraphile';

export async function buildSchema(pgPool) {
  return await createPostGraphQLSchema(pgPool, ['contact_management', 'user_management']);
}
