import { Router } from 'express';
import {
  listAnnouncements,
  getAnnouncement,
  addAnnouncement,
  editAnnouncement,
  removeAnnouncement,
} from '../../controllers/announcementController.js';

const r = Router();
r.get('/', listAnnouncements);
r.get('/:id', getAnnouncement);
r.post('/', addAnnouncement);
r.put('/:id', editAnnouncement);
r.delete('/:id', removeAnnouncement);
export default r;
