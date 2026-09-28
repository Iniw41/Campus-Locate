// Strict gate for /admin routes: valid token AND admin role.
import { auth } from './auth.js';

export function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only.' });
    next();
  });
}
