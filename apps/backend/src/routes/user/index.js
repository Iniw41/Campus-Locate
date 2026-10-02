import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { userLogin } from '../../controllers/user/authController.js';
import profileRoutes from './profile.routes.js';
import lostFoundRoutes from './lostFound.routes.js';

const r = Router();
r.post('/auth/login', userLogin);   // public
r.use(auth);                         // everything below needs a token
r.use(profileRoutes);
r.use('/lost-and-found', lostFoundRoutes);
export default r;

