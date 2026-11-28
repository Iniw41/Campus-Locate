// Shared validation/normalisation for Announcements and Events.
// Both posts carry: title, description, date, time, duration (minutes), venue, audience, optional image.
export const EVENT_TYPES = ['Campus', 'Organizational', 'Academic', 'Sports', 'Cultural', 'Other'];
export const ANNOUNCEMENT_CATEGORIES = ['General', 'Sports'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Optional picture, sent as a base64 data URL (same approach as Lost & Found).
const IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
export const MAX_IMAGE_CHARS = 5 * 1024 * 1024; // roughly 3.7 MB of actual image data

const parseImage = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !IMAGE_RE.test(value)) throw fail('The picture must be a PNG, JPG, WEBP or GIF image.');
  if (value.length > MAX_IMAGE_CHARS) throw fail('The picture is too large. Please use one under 3 MB.');
  return value;
};

const fail = (message) => {
  const e = new Error(message);
  e.status = 400;
  return e;
};

// Returns the fields common to both post kinds, or throws a 400 error.
export function parseCommon(body = {}, { requireVenue, requireDuration }) {
  const title = str(body.title);
  const description = str(body.description);
  const date = str(body.date);
  const time = str(body.time);
  const venue = str(body.venue);

  if (!title) throw fail('Title is required.');
  if (!description) throw fail('Description is required.');
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) throw fail('A valid date is required.');
  if (!TIME_RE.test(time)) throw fail('A valid time is required.');
  if (requireVenue && !venue) throw fail('Venue is required.');

  const durationMinutes = Math.round(Number(body.durationMinutes ?? 0));
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) throw fail('Duration must be a positive number.');
  if (requireDuration && durationMinutes <= 0) throw fail('Duration is required.');

  // Audience: everyone, or a list of specific groups/individuals.
  const audienceType = body.audienceType === 'specific' ? 'specific' : 'everyone';
  let audienceTargets = [];
  if (audienceType === 'specific') {
    const raw = Array.isArray(body.audienceTargets) ? body.audienceTargets : [];
    audienceTargets = [...new Set(raw.map(str).filter(Boolean))].slice(0, 30);
    if (audienceTargets.length === 0) throw fail('Add at least one person or group for a specific audience.');
  }

  const image = parseImage(body.image);

  return { title, description, date, time, venue, durationMinutes, audienceType, audienceTargets, image };
}

export const nowStamp = () => {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

export const logEntry = (action, name) => ({ action, name: name || 'Admin', ...nowStamp() });
