import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  setApproval,
  deleteEvent,
} from '../models/Event.js';
import { parseCommon, EVENT_TYPES } from '../services/postValidation.js';

const parse = (body) => {
  const fields = parseCommon(body, { requireVenue: true, requireDuration: true });
  const organizer = (body.organizer || '').trim();
  if (!organizer) {
    const e = new Error('Organizer (office, organization or department) is required.');
    e.status = 400;
    throw e;
  }
  const eventType = EVENT_TYPES.includes(body.eventType) ? body.eventType : 'Campus';
  return { fields, organizer, eventType };
};

// Students see approved events plus their own submissions (so they can track pending/rejected ones).
export const listUserEvents = (req, res) => {
  const visible = getAllEvents().filter((e) => e.approvalStatus === 'approved' || e.createdBy === req.user.id);
  res.json({ events: visible });
};

export const getUserEvent = (req, res) => {
  const e = getEventById(req.params.id);
  if (!e || (e.approvalStatus !== 'approved' && e.createdBy !== req.user.id)) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  res.json({ event: e });
};

// Student submission → always pending.
export const submitEvent = (req, res, next) => {
  try {
    const { fields, organizer, eventType } = parse(req.body);
    const event = createEvent(fields, {
      eventType,
      organizer,
      approvalStatus: 'pending',
      createdBy: req.user.id,
      creatorName: req.user.name,
      creatorRole: req.user.role,
    });
    res.status(201).json({ event, message: 'Event submitted! It will appear in Events once an admin approves it.' });
  } catch (e) {
    next(e);
  }
};

/* ---------- Admin ---------- */
export const listAllEvents = (req, res) => res.json({ events: getAllEvents() });

export const getAnyEvent = (req, res) => {
  const e = getEventById(req.params.id);
  if (!e) return res.status(404).json({ message: 'Event not found.' });
  res.json({ event: e });
};

// Admin posts are published immediately.
export const addEvent = (req, res, next) => {
  try {
    const { fields, organizer, eventType } = parse(req.body);
    const event = createEvent(fields, {
      eventType,
      organizer,
      approvalStatus: 'approved',
      createdBy: req.user.id,
      creatorName: req.user.name,
      creatorRole: 'admin',
    });
    res.status(201).json({ event, message: 'Event posted.' });
  } catch (e) {
    next(e);
  }
};

export const editEvent = (req, res, next) => {
  try {
    const { fields, organizer, eventType } = parse(req.body);
    const updated = updateEvent(req.params.id, fields, { organizer, eventType }, req.user.name);
    if (!updated) return res.status(404).json({ message: 'Event not found.' });
    res.json({ event: updated, message: 'Event updated.' });
  } catch (e) {
    next(e);
  }
};

export const approveEvent = (req, res) => {
  const e = setApproval(req.params.id, 'approved', req.user.name);
  if (!e) return res.status(404).json({ message: 'Event not found.' });
  res.json({ event: e, message: 'Event approved. It is now visible to everyone.' });
};

export const rejectEvent = (req, res) => {
  const e = setApproval(req.params.id, 'rejected', req.user.name);
  if (!e) return res.status(404).json({ message: 'Event not found.' });
  res.json({ event: e, message: 'Event rejected.' });
};

export const removeEvent = (req, res) => {
  if (!deleteEvent(req.params.id)) return res.status(404).json({ message: 'Event not found.' });
  res.json({ message: 'Event deleted.', id: Number(req.params.id) });
};
