import { Router } from 'express';
import {
  listAllEvents,
  getAnyEvent,
  addEvent,
  editEvent,
  approveEvent,
  rejectEvent,
  removeEvent,
} from '../../controllers/eventController.js';

const r = Router();
r.get('/', listAllEvents);
r.get('/:id', getAnyEvent);
r.post('/', addEvent);
r.put('/:id', editEvent);
r.patch('/:id/approve', approveEvent);
r.patch('/:id/reject', rejectEvent);
r.delete('/:id', removeEvent);
export default r;
