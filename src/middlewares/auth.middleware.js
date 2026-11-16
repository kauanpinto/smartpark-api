import { auth } from '../config/firebase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const token = header.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  let decoded;

  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  req.user = {
    uid: decoded.uid,
    email: decoded.email,
    role: decoded.role ?? 'user',
  };

  return next();
}

export async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }

  return next();
}
