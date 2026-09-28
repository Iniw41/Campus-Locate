// Admin login (admin role only).
import { login } from '../../services/authService.js';
export const adminLogin = (req, res, next) => {
  try { res.json(login(req.body.id, req.body.password, ['admin'])); } catch (e) { next(e); }
};
