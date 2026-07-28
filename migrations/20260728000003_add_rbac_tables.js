export async function up(knex) {
  return knex.schema
    .withSchema('user_management')
    .createTable('schema_grants', table => {
      table.bigInteger('role_id').notNullable();
      table.string('schema_name', 255).notNullable();
      table.boolean('allowed').notNullable().defaultTo(true);
      table.primary(['role_id', 'schema_name']);
      table.foreign('role_id').references('id').inTable('user_management.roles').onDelete('CASCADE');
    })
    .createTable('table_permissions', table => {
      table.bigIncrements('id').primary();
      table.bigInteger('role_id').notNullable();
      table.string('schema_name', 255).notNullable();
      table.string('table_name', 255).notNullable();
      table.boolean('can_select').notNullable().defaultTo(false);
      table.boolean('can_insert').notNullable().defaultTo(false);
      table.boolean('can_update').notNullable().defaultTo(false);
      table.boolean('can_delete').notNullable().defaultTo(false);
      table.foreign('role_id').references('id').inTable('user_management.roles').onDelete('CASCADE');
      table.index(['schema_name', 'table_name']);
    })
    .createTable('rls_policies', table => {
      table.bigIncrements('id').primary();
      table.string('schema_name', 255).notNullable();
      table.string('table_name', 255).notNullable();
      table.string('policy_name', 255).notNullable();
      table.text('using_expression');
      table.text('with_check_expression');
      table.boolean('enabled').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.unique(['schema_name', 'table_name', 'policy_name']);
    });
}

export async function down(knex) {
  return knex.schema
    .withSchema('user_management')
    .dropTable('rls_policies')
    .dropTable('table_permissions')
    .dropTable('schema_grants');
}
