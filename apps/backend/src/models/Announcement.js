// In-memory Announcements. Admin-only authoring; every announcement is public to signed-in users.
import { logEntry } from '../services/postValidation.js';

export const announcements = [];
let nextId = 1;

export const getAllAnnouncements = () => announcements.slice().reverse();
export const getAnnouncementById = (id) => announcements.find((a) => a.id === Number(id));

export const createAnnouncement = (fields, { source, category, createdBy, creatorName }) => {
  const announcement = {
    id: nextId++,
    ...fields,
    source, // issuing office, e.g. "Registrar's Office"
    category, // 'General' | 'Sports'
    createdBy,
    createdAt: new Date().toISOString(),
    history: [logEntry('Announcement posted', creatorName)],
  };
  announcements.push(announcement);
  return announcement;
};

export const updateAnnouncement = (id, fields, extra, editorName) => {
  const a = getAnnouncementById(id);
  if (!a) return null;
  Object.assign(a, fields, extra, { updatedAt: new Date().toISOString() });
  a.history.push(logEntry('Announcement edited', editorName));
  return a;
};

export const deleteAnnouncement = (id) => {
  const i = announcements.findIndex((a) => a.id === Number(id));
  if (i === -1) return false;
  announcements.splice(i, 1);
  return true;
};
