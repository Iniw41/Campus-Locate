import { Router } from 'express';
import {
  listTickets,
  getTicket,
  addTicket,
  updateStatus,
  removeTicket,
  approveTicketController,
} from '../../controllers/lostFoundController.js';

const r = Router();
r.get('/', listTickets);
r.get('/:id', getTicket);
r.post('/', addTicket);
r.patch('/:id/approve', approveTicketController);
r.patch('/:id/status', updateStatus);
r.delete('/:id', removeTicket);

export default r;

