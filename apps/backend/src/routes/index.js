// Central router: splits traffic into /user and /admin prefixes.
import { Router } from 'express';
import userRoutes from './user/index.js';
import adminRoutes from './admin/index.js';
import adminAuthRoutes from './admin/adminAuth.routes.js';
import { adminAuth } from '../middleware/adminAuth.js';

const r = Router();
r.use('/user', userRoutes);
r.use('/admin/auth', adminAuthRoutes);       // public: admin login
r.use('/admin', adminAuth, adminRoutes);     // strictly guarded
export default r;
