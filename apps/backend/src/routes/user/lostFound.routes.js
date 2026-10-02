import { Router } from 'express';
import { listTickets, getTicket, addTicket } from '../../controllers/lostFoundController.js';

const r = Router();
r.get('/', listTickets);
r.get('/:id', getTicket);
r.post('/', addTicket);

export default r;
