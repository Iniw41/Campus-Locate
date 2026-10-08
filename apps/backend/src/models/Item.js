export let items = [
  {
    id: 1,
    name: 'Blue Hydroflask',
    description: 'Found near the library',
    status: 'LOST',
    reportedBy: 'Juan Dela Cruz',
    history: [
      {
        name: 'Juan Dela Cruz',
        date: new Date().toLocaleDateString(),
        time: '09:00:00 AM',
        action: 'Reported'
      }
    ]
  },
  {
    id: 2,
    name: 'MacBook Charger',
    description: 'Left in room 402',
    status: 'FOUND',
    reportedBy: 'Campus Admin',
    history: [
      {
        name: 'Campus Admin',
        date: new Date().toLocaleDateString(),
        time: '11:30:00 AM',
        action: 'Reported'
      },
      {
        name: 'Campus Admin',
        date: new Date().toLocaleDateString(),
        time: '01:15:00 PM',
        action: 'Status updated to FOUND'
      }
    ]
  }
];
let nextId = 3;

export const createItem = (itemData) => {
  const now = new Date();
  const newItem = { 
    id: nextId++, 
    ...itemData,
    history: [{
      name: itemData.reportedBy,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      action: 'Reported'
    }]
  };
  items.push(newItem);
  return newItem;
};

export const getAllItems = () => items;

export const getItemById = (id) => items.find(i => i.id === parseInt(id));

export const updateItemStatus = (id, newStatus, actorName) => {
  const item = getItemById(id);
  if (item) {
    const now = new Date();
    item.status = newStatus;
    item.history.push({
      name: actorName,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      action: `Status updated to ${newStatus}`
    });
    return item;
  }
  return null;
};
