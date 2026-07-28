export async function up(knex) {
  return knex.schema
    .alterTable('contact_management.contacts', table => {
      table.enableRowLevelSecurity();
    })
    .alterTable('contact_management.notes', table => {
      table.enableRowLevelSecurity();
    })
    .raw(`
      CREATE POLICY contact_ownership ON contact_management.contacts
        FOR ALL TO PUBLIC
        USING (owner_id = app.current_user_id::bigint)
    `)
    .raw(`
      CREATE POLICY note_ownership ON contact_management.notes
        FOR ALL TO PUBLIC
        USING (owner_id = app.current_user_id::bigint)
    `);
}

export async function down(knex) {
  return knex.schema
    .raw('DROP POLICY IF EXISTS contact_ownership ON contact_management.contacts')
    .raw('DROP POLICY IF EXISTS note_ownership ON contact_management.notes')
    .alterTable('contact_management.contacts', table => {
      table.disableRowLevelSecurity();
    })
    .alterTable('contact_management.notes', table => {
      table.disableRowLevelSecurity();
    });
}
