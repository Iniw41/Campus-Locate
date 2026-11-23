

// Guarded admin routes (adminAuth is applied in routes/index.js). Add announcements/events/tickets/users routers here later.
import { Router } from 'express';
import { toPublic } from '../../models/User.js';
import lostFoundRoutes from './lostFound.routes.js';
import announcementRoutes from './announcements.routes.js';
import eventRoutes from './events.routes.js';

const r = Router();
r.get('/me', (req, res) => res.json({ user: toPublic(req.user) }));
r.use('/lost-and-found', lostFoundRoutes);
r.use('/announcements', announcementRoutes);
r.use('/events', eventRoutes);
export default r;

