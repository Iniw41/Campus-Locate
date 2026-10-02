import { getAllTickets, getTicketById, createTicket } from '../models/LostFound.js';

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
