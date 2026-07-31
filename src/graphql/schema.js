const { createPostGraphileSchema } = require('postgraphile');
const { makeExtendSchemaPlugin, gql } = require('graphile-utils');
const pool = require('../config/database');
const { collectDomains } = require('./domains');

/** Database schemas PostGraphile introspects and exposes through the API. */
const PG_SCHEMAS = [];

// PostGraphile already defines the root types; normalize domain root type
// definitions to extensions so existing fields are preserved (idempotent).

/**
 * Converts plain root type definitions in domain SDL into extensions, so
 * domain files may use either `type Query` or `extend type Query`.
 * Idempotent: `extend type` declarations pass through unchanged.
 *
 * @param {string} typeDefs Domain GraphQL SDL.
 * @returns {string} Same SDL with `type Query|Mutation|Subscription`
 *   replaced by `extend type ...`.
 */
const rootTypesAsExtensions = (typeDefs) =>
  typeDefs.replace(/(^|\n)\s*type\s+(Query|Mutation|Subscription)\b/g, '$1extend type $2');

/**
 * Builds the merged GraphQL schema: PostGraphile introspection of the
 * configured database schemas, with each domain's typeDefs/resolvers
 * attached as extension plugins.
 *
 * @returns {Promise<import('graphql').GraphQLSchema>} Ready-to-serve schema.
 */
async function buildSchema() {
  const domainPlugins = collectDomains()
    .filter((domain) => domain.typeDefs)
    .map((domain) =>
      makeExtendSchemaPlugin({
        typeDefs: gql`
          ${rootTypesAsExtensions(domain.typeDefs)}
        `,
        resolvers: domain.resolvers || {},
      }),
    );
  return createPostGraphileSchema(pool, PG_SCHEMAS, { appendPlugins: domainPlugins });
}

module.exports = buildSchema;
