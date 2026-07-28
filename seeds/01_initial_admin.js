import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

export async function seed(knex) {
  await knex('user_management.role_permissions').del();
  await knex('user_management.user_roles').del();
  await knex('user_management.permissions').del();
  await knex('user_management.roles').del();
  await knex('user_management.users').del();

  const [adminRole] = await knex('user_management.roles').insert({ name: 'admin', description: 'Administrator with full access' }).returning('id');
  const [userRole] = await knex('user_management.roles').insert({ name: 'user', description: 'Regular user with limited access' }).returning('id');
  const [guestRole] = await knex('user_management.roles').insert({ name: 'guest', description: 'Guest with read-only access' }).returning('id');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const [adminUser] = await knex('user_management.users').insert({ email: ADMIN_EMAIL, password_hash: passwordHash }).returning('id');

  await knex('user_management.user_roles').insert({ user_id: adminUser.id, role_id: adminRole.id });
  await knex('user_management.user_roles').insert({ user_id: adminUser.id, role_id: userRole.id });
  await knex('user_management.user_roles').insert({ user_id: adminUser.id, role_id: guestRole.id });

  const allPermissions = [
    { name: 'contact:create', description: 'Create contacts' },
    { name: 'contact:read', description: 'Read contacts' },
    { name: 'contact:update', description: 'Update contacts' },
    { name: 'contact:delete', description: 'Delete contacts' },
    { name: 'role:create', description: 'Create roles' },
    { name: 'role:read', description: 'Read roles' },
    { name: 'role:update', description: 'Update roles' },
    { name: 'role:delete', description: 'Delete roles' },
    { name: 'user:create', description: 'Create users' },
    { name: 'user:read', description: 'Read users' },
    { name: 'user:update', description: 'Update users' },
    { name: 'user:delete', description: 'Delete users' },
    { name: 'schema:grant', description: 'Grant schema access to roles' },
    { name: 'table:permission', description: 'Manage table permissions for roles' },
    { name: 'rls:manage', description: 'Manage RLS policies' }
  ];

  for (const perm of allPermissions) {
    const [row] = await knex('user_management.permissions').insert(perm).returning('id');
    await knex('user_management.role_permissions').insert({ role_id: adminRole.id, permission_id: row.id });
  }

  const readOnlyPermissions = [
    'contact:read',
    'role:read',
    'user:read'
  ];

  for (const permName of readOnlyPermissions) {
    const [permRow] = await knex('user_management.permissions').where({ name: permName }).returning('id');
    if (permRow) {
      await knex('user_management.role_permissions').insert({ role_id: userRole.id, permission_id: permRow.id });
    }
  }

  await knex('user_management.schema_grants').insert([
    { role_id: adminRole.id, schema_name: 'contact_management', allowed: true },
    { role_id: adminRole.id, schema_name: 'user_management', allowed: true },
    { role_id: userRole.id, schema_name: 'contact_management', allowed: true },
    { role_id: guestRole.id, schema_name: 'contact_management', allowed: true }
  ]);

  const contactsPerms = await knex('user_management.permissions').whereIn('name', ['contact:create', 'contact:read', 'contact:update', 'contact:delete']).returning('id');
  for (const perm of contactsPerms) {
    await knex('user_management.role_permissions').insert({ role_id: adminRole.id, permission_id: perm.id });
  }
  const readContactPerms = await knex('user_management.permissions').whereIn('name', ['contact:read']).returning('id');
  for (const perm of readContactPerms) {
    await knex('user_management.role_permissions').insert({ role_id: userRole.id, permission_id: perm.id });
    await knex('user_management.role_permissions').insert({ role_id: guestRole.id, permission_id: perm.id });
  }
}
