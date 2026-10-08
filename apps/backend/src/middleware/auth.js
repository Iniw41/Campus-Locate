// Validates the Bearer token for any signed-in user (student, faculty or admin).
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { findById } from '../models/User.js';

export function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = findById(payload.sub);
    if (!req.user) throw new Error();
    next();
  } catch { res.status(401).json({ message: 'Please sign in again.' }); }
}
