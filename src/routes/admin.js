import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { adminOnly } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const pool = new pg.Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    ca: fs.readFileSync('./CA.pem').toString(),
    rejectUnauthorized: true
  }
});

router.use(adminOnly);

router.get('/roles', async (req, res) => {
  const client = await pool.connect();
  try {
    const roles = await client.query('SELECT * FROM user_management.roles ORDER BY id');
    res.json(roles.rows);
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/roles', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const client = await pool.connect();
  try {
    const [role] = await client.query(
      'INSERT INTO user_management.roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json(role);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/roles/:roleId/permissions', async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body;
  if (!Array.isArray(permissionIds)) return res.status(400).json({ message: 'permissionIds array is required' });
  const client = await pool.connect();
  try {
    const rows = [];
    for (const pid of permissionIds) {
      const [row] = await client.query(
        'INSERT INTO user_management.role_permissions (role_id, permission_id) VALUES ($1, $2) RETURNING *',
        [roleId, pid]
      );
      rows.push(row);
    }
    res.status(201).json(rows);
  } catch (error) {
    console.error('Assign permissions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.delete('/roles/:roleId/permissions/:permissionId', async (req, res) => {
  const { roleId, permissionId } = req.params;
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM user_management.role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    res.status(204).send();
  } catch (error) {
    console.error('Remove permission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/roles/:roleId/schemas', async (req, res) => {
  const { roleId } = req.params;
  const { schemaName, allowed } = req.body;
  if (!schemaName) return res.status(400).json({ message: 'schemaName is required' });
  const client = await pool.connect();
  try {
    const [row] = await client.query(
      'INSERT INTO user_management.schema_grants (role_id, schema_name, allowed) VALUES ($1, $2, $3) RETURNING *',
      [roleId, schemaName, allowed !== false]
    );
    res.status(201).json(row);
  } catch (error) {
    console.error('Grant schema error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.delete('/roles/:roleId/schemas/:schemaName', async (req, res) => {
  const { roleId, schemaName } = req.params;
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM user_management.schema_grants WHERE role_id = $1 AND schema_name = $2',
      [roleId, schemaName]
    );
    res.status(204).send();
  } catch (error) {
    console.error('Revoke schema error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/roles/:roleId/schemas/:schemaName/tables', async (req, res) => {
  const { roleId, schemaName } = req.params;
  const { tableName, can_select, can_insert, can_update, can_delete } = req.body;
  if (!tableName) return res.status(400).json({ message: 'tableName is required' });
  const client = await pool.connect();
  try {
    const [row] = await client.query(
      'INSERT INTO user_management.table_permissions (role_id, schema_name, table_name, can_select, can_insert, can_update, can_delete) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [roleId, schemaName, tableName, !!can_select, !!can_insert, !!can_update, !!can_delete]
    );
    res.status(201).json(row);
  } catch (error) {
    console.error('Set table permission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.put('/roles/:roleId/schemas/:schemaName/tables/:tableName', async (req, res) => {
  const { roleId, schemaName, tableName } = req.params;
  const { can_select, can_insert, can_update, can_delete } = req.body;
  const client = await pool.connect();
  try {
    const [row] = await client.query(
      `UPDATE user_management.table_permissions SET can_select = COALESCE($1, can_select), can_insert = COALESCE($2, can_insert), can_update = COALESCE($3, can_update), can_delete = COALESCE($4, can_delete) WHERE role_id = $5 AND schema_name = $6 AND table_name = $7 RETURNING *`,
      [can_select, can_insert, can_update, can_delete, roleId, schemaName, tableName]
    );
    if (!row) return res.status(404).json({ message: 'Table permission not found' });
    res.json(row);
  } catch (error) {
    console.error('Update table permission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/rls/own-records', async (req, res) => {
  const { schemaName, tableName, ownerColumn = 'owner_id' } = req.body;
  if (!schemaName || !tableName) return res.status(400).json({ message: 'schemaName and tableName are required' });
  const client = await pool.connect();
  try {
    const policyName = `own_records_${tableName}`;
    const usingExpr = `${ownerColumn} = app.current_user_id::bigint`;
    const withCheckExpr = `${ownerColumn} = app.current_user_id::bigint`;
    await client.query('BEGIN');
    await client.query(
      `CREATE POLICY ${policyName} ON ${schemaName}.${tableName} FOR ALL TO PUBLIC USING (${usingExpr}) WITH CHECK (${withCheckExpr})`
    );
    await client.query('COMMIT');
    res.status(201).json({ message: 'RLS own records policy created', policyName, schemaName, tableName });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create RLS policy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.delete('/rls/policies/:schemaName/:tableName/:policyName', async (req, res) => {
  const { schemaName, tableName, policyName } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DROP POLICY IF EXISTS ${policyName} ON ${schemaName}.${tableName}`);
    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Drop RLS policy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
