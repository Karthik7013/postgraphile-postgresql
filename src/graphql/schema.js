import { createPostGraphQLSchema } from 'postgraphile';

export async function buildSchema(pgPool) {
  const schemas = (process.env.GRAPHQL_SCHEMAS || 'contact_management').split(',').map(s => s.trim()).filter(Boolean);
  return await createPostGraphQLSchema(pgPool, schemas);
}
