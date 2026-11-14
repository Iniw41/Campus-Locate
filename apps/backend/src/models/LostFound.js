// In-memory Lost and Found storage.
export const tickets = [];

let nextId = 1;

const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

export const getAllTickets = () => tickets.slice().reverse();

export const getTicketById = (id) => tickets.find((t) => t.id === Number(id));

export const createTicket = ({
  firstName,
  lastName,
  name,
  status,
  approvalStatus,
  lastFound,
  date,
  time,
  item,
  description,
  image,
  createdBy,
}) => {
  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const fullName = name ? name.trim() : (lName && fName ? `${lName}, ${fName}` : lName || fName);
  const { date: nowDate, time: nowTime } = getCurrentDateTime();

  const ticket = {
    id: nextId++,
    firstName: fName,
    lastName: lName,
    name: fullName,
    status: status === 'Found' ? 'Found' : 'Lost',
    approvalStatus: approvalStatus || 'pending', // 'pending' | 'approved' | 'rejected'
    lastFound,
    date,
    time,
    item,
    description,
    image: image || null,
    createdBy: createdBy || null,
    createdAt: new Date().toISOString(),
    history: [
      {
        action: 'Ticket Created',
        name: fullName || 'Anonymous',
        date: date || nowDate,
        time: time || nowTime,
      },
    ],
  };
  tickets.push(ticket);
  return ticket;
};

export const approveTicket = (id, approverName = 'Admin') => {
  const ticket = getTicketById(id);
  if (!ticket) return null;
  ticket.approvalStatus = 'approved';
  ticket.approvedAt = new Date().toISOString();
  if (!ticket.history) ticket.history = [];
  const { date, time } = getCurrentDateTime();
  ticket.history.push({
    action: 'Approved by Admin',
    name: approverName,
    date,
    time,
  });
  return ticket;
};

export const updateTicketStatus = (id, newStatus, updaterName = 'Admin') => {
  const ticket = getTicketById(id);
  if (!ticket) return null;
  ticket.status = newStatus;
  ticket.updatedAt = new Date().toISOString();
  if (!ticket.history) ticket.history = [];
  const { date, time } = getCurrentDateTime();
  ticket.history.push({
    action: `Status changed to ${newStatus}`,
    name: updaterName,
    date,
    time,
  });
  return ticket;
};

export const deleteTicket = (id) => {
  const index = tickets.findIndex((t) => t.id === Number(id));
  if (index === -1) return false;
  tickets.splice(index, 1);
  return true;
};
