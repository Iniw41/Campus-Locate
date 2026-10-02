import { getAllTickets, getTicketById, createTicket, updateTicketStatus, deleteTicket } from '../models/LostFound.js';

export const listTickets = (req, res) => {
  res.json({ tickets: getAllTickets() });
};

export const getTicket = (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
  res.json({ ticket });
};

export const addTicket = (req, res) => {
  const { name, status, lastFound, date, time, item, description, image } = req.body;

  if (
    !name?.trim() ||
    !lastFound?.trim() ||
    !date?.trim() ||
    !time?.trim() ||
    !item?.trim() ||
    !description?.trim()
  ) {
    return res.status(400).json({ message: 'All fields except image are required.' });
  }

  const ticket = createTicket({
    name: name.trim(),
    status: status === 'Found' ? 'Found' : 'Lost',
    lastFound: lastFound.trim(),
    date: date.trim(),
    time: time.trim(),
    item: item.trim(),
    description: description.trim(),
    image: image || null,
    createdBy: req.user?.id || null,
  });

  res.status(201).json({ ticket });
};

export const updateStatus = (req, res) => {
  const { status } = req.body;
  const allowed = ['Lost', 'Found', 'Claimed', 'Resolved', 'Returned'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }

  const updated = updateTicketStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ message: 'Ticket not found.' });
  }
  res.json({ ticket: updated });
};

export const removeTicket = (req, res) => {
  const deleted = deleteTicket(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Ticket not found.' });
  }
  res.json({ message: 'Ticket deleted successfully.', id: Number(req.params.id) });
};

