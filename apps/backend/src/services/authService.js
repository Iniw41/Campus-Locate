// Shared login logic. `allowedRoles` keeps student and admin logins separate.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { findByLoginId, toPublic } from '../models/User.js';

export function login(loginId, password, allowedRoles) {
  const user = findByLoginId(loginId || '');
  const ok = user && allowedRoles.includes(user.role) && bcrypt.compareSync(password || '', user.passwordHash);
  if (!ok) { const e = new Error('Incorrect ID or password.'); e.status = 401; throw e; }
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '8h' });
  return { token, user: toPublic(user) };
}
