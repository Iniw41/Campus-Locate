// Shared constants and formatting helpers for CIT-U Consultation Offices.
export const CONSULTATION_OFFICES = [
  {
    id: 'faculty',
    name: 'Department Faculty Rooms / Offices',
    shortName: 'Faculty Rooms',
    location: 'Academic Building, NGE/ST Building, & RTL Building',
    hours: 'Mon–Fri · 8:00 AM – 5:00 PM',
    purpose: 'Subject-specific academic consultations, grade inquiries, thesis/capstone advising, and professor consultation hours.',
    detailLabel: 'Department, Subject, or Professor',
    detailPlaceholder: 'e.g. CCS · CS301 · Prof. Santos (optional)',
    reasons: [
      'Subject Consultation',
      'Grade Inquiry',
      'Thesis / Capstone Advising',
      'Professor Consultation Hours',
    ],
  },
  {
    id: 'guidance',
    name: 'Guidance Center',
    shortName: 'Guidance Center',
    location: 'RTL / Main Building',
    hours: 'Mon–Fri · 8:00 AM – 5:00 PM',
    purpose: 'Confidential personal counseling, mental health and stress support, psychological assessments, and academic/career guidance.',
    detailLabel: 'Preferred Counselor / Context (optional)',
    detailPlaceholder: 'Optional preference or confidential note',
    reasons: [
      'Confidential Personal Counseling',
      'Mental Health & Stress Support',
      'Psychological Assessment',
      'Academic / Career Guidance',
    ],
  },
  {
    id: 'tic',
    name: 'Teknoy Ikigai Center (TIC)',
    shortName: 'Teknoy Ikigai Center',
    location: 'CIT-U Campus (TIC)',
    hours: 'Mon–Fri · 8:00 AM – 5:00 PM',
    purpose: 'Career coaching, personal purpose and skill mapping, graduate readiness, and mentorship sessions.',
    detailLabel: 'Program / Year Level (optional)',
    detailPlaceholder: 'e.g. BSIT · 4th Year (optional)',
    reasons: [
      'Career Coaching',
      'Purpose & Skill Mapping',
      'Graduate Readiness',
      'Mentorship Session',
    ],
  },
  {
    id: 'clinic',
    name: 'Medical-Dental Clinic',
    shortName: 'Medical-Dental Clinic',
    location: 'RTL / Main Building',
    hours: 'Mon–Fri · 8:00 AM – 5:00 PM',
    purpose: 'Health and dental consultations, medical check-ups, first aid, and health clearances.',
    detailLabel: 'Visit Type / Note (optional)',
    detailPlaceholder: 'e.g. Medical or Dental (optional)',
    reasons: [
      'Health Consultation / Check-up',
      'Dental Consultation',
      'First Aid',
      'Health Clearance',
    ],
  },
];

// Hourly 1-hour blocks across campus consultation hours (excluding 12:00 PM lunch).
export const CONSULTATION_SLOTS = [
  { time: '08:00', label: '8:00 AM – 9:00 AM' },
  { time: '09:00', label: '9:00 AM – 10:00 AM' },
  { time: '10:00', label: '10:00 AM – 11:00 AM' },
  { time: '11:00', label: '11:00 AM – 12:00 PM' },
  { time: '13:00', label: '1:00 PM – 2:00 PM' },
  { time: '14:00', label: '2:00 PM – 3:00 PM' },
  { time: '15:00', label: '3:00 PM – 4:00 PM' },
  { time: '16:00', label: '4:00 PM – 5:00 PM' },
];

export const CONSULTATION_STATUS_META = {
  pending: {
    label: 'Pending review',
    pill: 'bg-amber-100 text-amber-800 border border-amber-300',
  },
  confirmed: {
    label: 'Confirmed',
    pill: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  completed: {
    label: 'Completed',
    pill: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  declined: {
    label: 'Declined',
    pill: 'bg-red-100 text-red-700 border border-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
};

export const getOfficeById = (id) => CONSULTATION_OFFICES.find((o) => o.id === id) || null;

export const getSlotLabel = (time) =>
  CONSULTATION_SLOTS.find((s) => s.time === time)?.label || time;

export function fmtBookedAt(iso = '') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function fmtBookedTimeOnly(iso = '') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const todayYmd = () => toYmd(new Date());

export function nextWeekdayYmd(base = new Date()) {
  const d = new Date(base);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return toYmd(d);
}

export function isWeekendYmd(ymd = '') {
  if (!ymd) return false;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
}
