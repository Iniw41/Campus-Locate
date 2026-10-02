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
