const path = require('path');
const fs = require('fs');

/**
 * @typedef {Object} Domain
 * @property {string} [typeDefs] GraphQL SDL for the domain (root types must
 *   extend, not redefine — schema.js normalizes this anyway).
 * @property {Record<string, any>} [resolvers] Resolver map keyed by type name.
 */

/**
 * Discovers every domain folder under `src/graphql/` that exports
 * `{ typeDefs, resolvers }` from its `index.js`. A domain whose module
 * fails to load throws at startup (loud, not silent).
 *
 * @returns {Domain[]} Loaded domain modules.
 */
function collectDomains() {
  return fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((dir) => fs.existsSync(path.join(__dirname, dir, 'index.js')))
    .map((dir) => require(path.join(__dirname, dir, 'index')));
}

module.exports = { collectDomains };
