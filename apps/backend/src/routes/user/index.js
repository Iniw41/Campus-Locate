// Everything under /api/v1/user. Add lost-and-found, events, navigation routers here later.
import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { userLogin } from '../../controllers/user/authController.js';
import profileRoutes from './profile.routes.js';
const r = Router();
r.post('/auth/login', userLogin);   // public
r.use(auth, profileRoutes);         // everything below needs a token
export default r;
