/**
 * Placeholder resolvers proving the domain merge pipeline works.
 * @type {Record<string, Record<string, () => string>>}
 */
const resolvers = {
  Query: { _placeholder: () => 'ready' },
  Mutation: { _placeholder: () => 'ready' },
};

module.exports = resolvers;