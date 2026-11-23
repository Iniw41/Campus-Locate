// Shared by both frontends: option lists + date/time helpers for Events and Announcements.
// Dates are stored as 'YYYY-MM-DD', times as 'HH:MM' (local), duration as minutes.

export const OFFICES = [
  "Office of the President",
  "Registrar's Office",
  'Student Affairs Office',
  'Admissions Office',
  'Guidance and Counseling Office',
  'Library',
  "Cashier / Finance Office",
  'Sports Development Office',
  'Campus Security',
  'Information Technology Office',
  'College / Department',
  'Other',
];

export const EVENT_TYPES = ['Campus', 'Organizational', 'Academic', 'Sports', 'Cultural', 'Other'];
export const ANNOUNCEMENT_CATEGORIES = ['General', 'Sports'];

const pad = (n) => String(n).padStart(2, '0');

export function startOf(post) {
  return new Date(`${post.date}T${post.time || '00:00'}:00`);
}

// A post with no duration (typical for announcements) lasts through the end of its date.
export function endOf(post) {
  const start = startOf(post);
  if (post.durationMinutes > 0) return new Date(start.getTime() + post.durationMinutes * 60000);
  return new Date(`${post.date}T23:59:59`);
}

export function timeStatus(post, now = new Date()) {
  if (!post?.date) return 'upcoming';
  if (now < startOf(post)) return 'upcoming';
  if (now <= endOf(post)) return 'ongoing';
  return 'finished';
}

// Does the post occupy the given calendar day ('YYYY-MM-DD')?
export function occursOn(post, day) {
  if (!day) return true;
  const dayStart = new Date(`${day}T00:00:00`);
  const dayEnd = new Date(`${day}T23:59:59`);
  return startOf(post) <= dayEnd && endOf(post) >= dayStart;
}

// Ongoing first, then upcoming (soonest first), then finished (most recent first).
export function compareBySchedule(a, b, now = new Date()) {
  const rank = { ongoing: 0, upcoming: 1, finished: 2 };
  const sa = timeStatus(a, now);
  const sb = timeStatus(b, now);
  if (sa !== sb) return rank[sa] - rank[sb];
  const diff = startOf(a) - startOf(b);
  return sa === 'finished' ? -diff : diff;
}

export function fmtTime(t = '') {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function fmtDate(d = '') {
  if (!d) return '';
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// "10:00 AM – 12:30 PM" (adds the end date when the post runs past midnight).
export function fmtRange(post) {
  const start = fmtTime(post.time);
  if (!(post.durationMinutes > 0)) return start;
  const end = endOf(post);
  const endTime = fmtTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
  const endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  return endDate === post.date ? `${start} – ${endTime}` : `${start} – ${fmtDate(endDate)}, ${endTime}`;
}

export function fmtDuration(minutes = 0) {
  if (!(minutes > 0)) return 'All day';
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  const parts = [];
  if (d) parts.push(`${d} day${d > 1 ? 's' : ''}`);
  if (h) parts.push(`${h} hr${h > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} min${m > 1 ? 's' : ''}`);
  return parts.join(' ');
}

export const UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 };
export const toMinutes = (value, unit) => Math.round(Number(value || 0) * (UNIT_MINUTES[unit] || 1));

// Pick the largest unit that divides evenly, for pre-filling the edit form.
export function fromMinutes(minutes = 0) {
  if (minutes > 0 && minutes % 1440 === 0) return { value: String(minutes / 1440), unit: 'days' };
  if (minutes > 0 && minutes % 60 === 0) return { value: String(minutes / 60), unit: 'hours' };
  return { value: minutes > 0 ? String(minutes) : '', unit: 'minutes' };
}

export const audienceLabel = (post) =>
  post.audienceType === 'specific' && post.audienceTargets?.length ? post.audienceTargets.join(', ') : 'Everyone';

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function dayMonth(dateStr = '') {
  const [, m, d] = dateStr.split('-');
  if (!m || !d) return { day: '--', mon: '' };
  return { day: String(Number(d)), mon: MONTHS[Number(m) - 1] || '' };
}
