import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  deleteTicket,
  approveTicket,
} from '../models/LostFound.js';

export const listTickets = (req, res) => {
  res.json({ tickets: getAllTickets() });
};

export const listUserTickets = (req, res) => {
  const userId = req.user?.id;
  const all = getAllTickets();
  // Return approved tickets, plus any pending tickets submitted by the current user so they see their submission
  const visible = all.filter(
    (t) => t.approvalStatus === 'approved' || (userId && t.createdBy === userId)
  );
  res.json({ tickets: visible });
};

export const getTicket = (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
  res.json({ ticket });
};

export const addTicket = (req, res) => {
  const { firstName, lastName, name, status, lastFound, date, time, item, description, image } = req.body;

  // Support both separate firstName/lastName and legacy name field
  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const hasValidName = (fName && lName) || (name && name.trim());

  if (
    !hasValidName ||
    !lastFound?.trim() ||
    !date?.trim() ||
    !time?.trim() ||
    !item?.trim() ||
    !description?.trim()
  ) {
    return res.status(400).json({ message: 'All fields except image are required.' });
  }

  // Admin submissions are auto-approved; student submissions require admin approval
  const isAdmin = req.user?.role === 'admin';
  const approvalStatus = isAdmin ? 'approved' : 'pending';

  const ticket = createTicket({
    firstName: fName,
    lastName: lName,
    name: name?.trim() || `${lName}, ${fName}`,
    status: status === 'Found' ? 'Found' : 'Lost',
    approvalStatus,
    lastFound: lastFound.trim(),
    date: date.trim(),
    time: time.trim(),
    item: item.trim(),
    description: description.trim(),
    image: image || null,
    createdBy: req.user?.id || null,
  });

  res.status(201).json({
    ticket,
    message: isAdmin
      ? 'Ticket created successfully.'
      : 'Ticket submitted! It will appear once approved by an admin.',
  });
};

export const approveTicketController = (req, res) => {
  const ticket = approveTicket(req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found.' });
  }
  res.json({ ticket, message: 'Ticket approved successfully.' });
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
