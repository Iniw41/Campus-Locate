import { Router } from 'express';
import { listUserEvents, getUserEvent, submitEvent } from '../../controllers/eventController.js';

const r = Router();
r.get('/', listUserEvents);
r.get('/:id', getUserEvent);
r.post('/', submitEvent); // students: goes to admin for approval
export default r;
