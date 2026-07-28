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
