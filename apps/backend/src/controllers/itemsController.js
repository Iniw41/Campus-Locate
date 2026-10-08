import { createItem, getAllItems, getItemById, updateItemStatus } from '../models/Item.js';

export const reportItem = (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const actorName = req.user ? req.user.name : 'Student';
    
    const newItem = createItem({
      name,
      description,
      status: status || 'LOST',
      reportedBy: actorName
    });

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const listItems = (req, res, next) => {
  try {
    const items = getAllItems();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const getItemHistory = (req, res, next) => {
  try {
    const { id } = req.params;
    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    // Return just the history array which contains name, date, time
    res.json(item.history);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const actorName = req.user ? req.user.name : 'Campus Admin';

    const updatedItem = updateItemStatus(id, status, actorName);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};
