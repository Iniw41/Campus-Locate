import { Router } from 'express';
import { listTickets, getTicket, addTicket, updateStatus, removeTicket } from '../../controllers/lostFoundController.js';

const r = Router();
r.get('/', listTickets);
r.get('/:id', getTicket);
r.post('/', addTicket);
r.patch('/:id/status', updateStatus);
r.delete('/:id', removeTicket);

export default r;

