export let items = [];
let nextId = 1;

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
