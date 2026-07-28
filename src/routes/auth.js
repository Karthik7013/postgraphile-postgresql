import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const router = express.Router();
const pool = new pg.Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    ca: require('fs').readFileSync('./CA.pem').toString(),
    rejectUnauthorized: true
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, email, password_hash FROM user_management.users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const rolesResult = await client.query(
      'SELECT r.id, r.name FROM user_management.roles r INNER JOIN user_management.user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user.id]
    );
    const roleIds = rolesResult.rows.map(r => r.id);

    const token = jwt.sign(
      { userId: user.id, roleIds, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '1h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        roles: rolesResult.rows
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
