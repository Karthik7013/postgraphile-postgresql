import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.authContext = { userId: null, roleIds: [], email: null };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.authContext = {
      userId: decoded.userId,
      roleIds: decoded.roleIds || [],
      email: decoded.email
    };
    return next();
  } catch (err) {
    req.authContext = { userId: null, roleIds: [], email: null };
    return next();
  }
}

export async function adminOnly(req, res, next) {
  if (!req.authContext || !req.authContext.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const pgPool = req.app.get('pgPool');
  const client = await pgPool.connect();
  try {
    const result = await client.query(
      `SELECT r.name FROM user_management.roles r INNER JOIN user_management.user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.name = 'admin'`,
      [req.authContext.userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden - admin access required' });
    }
    return next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
}
