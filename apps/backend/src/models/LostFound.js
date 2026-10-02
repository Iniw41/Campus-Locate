// In-memory Lost and Found storage.
export const tickets = [];

let nextId = 1;

export const getAllTickets = () => tickets.slice().reverse();

export const getTicketById = (id) => tickets.find((t) => t.id === Number(id));

export const createTicket = ({ name, status, lastFound, date, time, item, description, image, createdBy }) => {
  const ticket = {
    id: nextId++,
    name,
    status: status === 'Found' ? 'Found' : 'Lost',
    lastFound,
    date,
    time,
    item,
    description,
    image: image || null,
    createdBy: createdBy || null,
    createdAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  return ticket;
};

export const updateTicketStatus = (id, newStatus) => {
  const ticket = getTicketById(id);
  if (!ticket) return null;
  ticket.status = newStatus;
  ticket.updatedAt = new Date().toISOString();
  return ticket;
};

export const deleteTicket = (id) => {
  const index = tickets.findIndex((t) => t.id === Number(id));
  if (index === -1) return false;
  tickets.splice(index, 1);
  return true;
};

