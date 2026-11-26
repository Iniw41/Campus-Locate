import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../models/Announcement.js';
import { parseCommon, ANNOUNCEMENT_CATEGORIES } from '../services/postValidation.js';

const parse = (body) => {
  const fields = parseCommon(body, { requireVenue: false, requireDuration: false });
  const source = (body.source || '').trim();
  if (!source) {
    const e = new Error('Source office is required.');
    e.status = 400;
    throw e;
  }
  const category = ANNOUNCEMENT_CATEGORIES.includes(body.category) ? body.category : 'General';
  return { fields, source, category };
};

// Everyone signed in can read announcements.
export const listAnnouncements = (req, res) => res.json({ announcements: getAllAnnouncements() });

export const getAnnouncement = (req, res) => {
  const a = getAnnouncementById(req.params.id);
  if (!a) return res.status(404).json({ message: 'Announcement not found.' });
  res.json({ announcement: a });
};

// Admin only (mounted under /admin).
export const addAnnouncement = (req, res, next) => {
  try {
    const { fields, source, category } = parse(req.body);
    const announcement = createAnnouncement(fields, {
      source,
      category,
      createdBy: req.user.id,
      creatorName: req.user.name,
    });
    res.status(201).json({ announcement, message: 'Announcement posted.' });
  } catch (e) {
    next(e);
  }
};

export const editAnnouncement = (req, res, next) => {
  try {
    const { fields, source, category } = parse(req.body);
    const updated = updateAnnouncement(req.params.id, fields, { source, category }, req.user.name);
    if (!updated) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ announcement: updated, message: 'Announcement updated.' });
  } catch (e) {
    next(e);
  }
};

export const removeAnnouncement = (req, res) => {
  if (!deleteAnnouncement(req.params.id)) return res.status(404).json({ message: 'Announcement not found.' });
  res.json({ message: 'Announcement deleted.', id: Number(req.params.id) });
};
