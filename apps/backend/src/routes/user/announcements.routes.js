import { Router } from 'express';
import { listAnnouncements, getAnnouncement } from '../../controllers/announcementController.js';

const r = Router();
r.get('/', listAnnouncements);
r.get('/:id', getAnnouncement);
export default r;
