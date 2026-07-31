// Root types must be declared as extensions: PostGraphile already defines
// Query/Mutation, so a plain "type Query" causes a type naming conflict.
// Follow this pattern in every new domain.

/** Auth domain SDL — placeholder fields on the root types. */
const typeDefs = `#graphql
  extend type Query { _placeholder: String }
  extend type Mutation { _placeholder: String }
`;

module.exports = typeDefs;
