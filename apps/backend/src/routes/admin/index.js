// Guarded admin routes (adminAuth is applied in routes/index.js). Add announcements/events/tickets/users routers here later.
import { Router } from 'express';
import { toPublic } from '../../models/User.js';
const r = Router();
r.get('/me', (req, res) => res.json({ user: toPublic(req.user) }));
export default r;
