// In-memory Events. Admin posts are auto-approved; student posts stay 'pending' until an admin approves them.
import { logEntry } from '../services/postValidation.js';

export const events = [];
let nextId = 1;

export const getAllEvents = () => events.slice().reverse();
export const getEventById = (id) => events.find((e) => e.id === Number(id));

export const createEvent = (fields, { eventType, organizer, approvalStatus, createdBy, creatorName, creatorRole }) => {
  const event = {
    id: nextId++,
    ...fields,
    eventType, // Campus | Organizational | Academic | Sports | Cultural | Other
    organizer, // organization / office / department hosting it
    approvalStatus, // 'pending' | 'approved' | 'rejected'
    createdBy,
    createdByName: creatorName,
    createdByRole: creatorRole,
    createdAt: new Date().toISOString(),
    history: [logEntry(creatorRole === 'admin' ? 'Event posted' : 'Event submitted for approval', creatorName)],
  };
  events.push(event);
  return event;
};

export const updateEvent = (id, fields, extra, editorName) => {
  const e = getEventById(id);
  if (!e) return null;
  Object.assign(e, fields, extra, { updatedAt: new Date().toISOString() });
  e.history.push(logEntry('Event edited', editorName));
  return e;
};

export const setApproval = (id, approvalStatus, adminName) => {
  const e = getEventById(id);
  if (!e) return null;
  e.approvalStatus = approvalStatus;
  e.reviewedAt = new Date().toISOString();
  e.reviewedBy = adminName;
  e.history.push(logEntry(approvalStatus === 'approved' ? 'Approved by Admin' : 'Rejected by Admin', adminName));
  return e;
};

export const deleteEvent = (id) => {
  const i = events.findIndex((e) => e.id === Number(id));
  if (i === -1) return false;
  events.splice(i, 1);
  return true;
};
