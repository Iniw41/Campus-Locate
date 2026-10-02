import { Router } from 'express';
import { listUserTickets, getTicket, addTicket } from '../../controllers/lostFoundController.js';

const r = Router();
r.get('/', listUserTickets);
r.get('/:id', getTicket);
r.post('/', addTicket);

export default r;
