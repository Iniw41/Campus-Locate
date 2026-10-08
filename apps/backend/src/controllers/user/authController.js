// Student / faculty login.
import { login } from '../../services/authService.js';
export const userLogin = (req, res, next) => {
  try { res.json(login(req.body.id, req.body.password, ['student', 'faculty'])); } catch (e) { next(e); }
};
