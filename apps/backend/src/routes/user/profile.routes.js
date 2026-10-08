// GET /api/v1/user/profile
import { Router } from 'express';
import { toPublic } from '../../models/User.js';
const r = Router();
r.get('/profile', (req, res) => res.json({ user: toPublic(req.user) }));
export default r;
