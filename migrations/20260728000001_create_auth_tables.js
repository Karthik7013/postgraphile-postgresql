export async function up(knex) {
  return knex.schema
    .withSchema('user_management')
    .createTable('users', table => {
      table.bigIncrements('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('roles', table => {
      table.bigIncrements('id').primary();
      table.string('name', 100).unique().notNullable();
      table.text('description');
    })
    .createTable('permissions', table => {
      table.bigIncrements('id').primary();
      table.string('name', 100).unique().notNullable();
      table.text('description');
    })
    .createTable('user_roles', table => {
      table.bigInteger('user_id').notNullable();
      table.bigInteger('role_id').notNullable();
      table.primary(['user_id', 'role_id']);
      table.foreign('user_id').references('id').inTable('user_management.users').onDelete('CASCADE');
      table.foreign('role_id').references('id').inTable('user_management.roles').onDelete('CASCADE');
    })
    .createTable('role_permissions', table => {
      table.bigInteger('role_id').notNullable();
      table.bigInteger('permission_id').notNullable();
      table.primary(['role_id', 'permission_id']);
      table.foreign('role_id').references('id').inTable('user_management.roles').onDelete('CASCADE');
      table.foreign('permission_id').references('id').inTable('user_management.permissions').onDelete('CASCADE');
    })
    .raw('CREATE INDEX IF NOT EXISTS idx_users_email ON user_management.users(email)');
}

export async function down(knex) {
  return knex.schema
    .withSchema('user_management')
    .dropTable('role_permissions')
    .dropTable('user_roles')
    .dropTable('permissions')
    .dropTable('roles')
    .dropTable('users');
}
