// Public admin login, mounted BEFORE the admin guard in routes/index.js.
import { Router } from 'express';
import { adminLogin } from '../../controllers/admin/authController.js';
const r = Router();
r.post('/login', adminLogin);
export default r;
