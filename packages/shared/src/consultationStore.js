// Frontend-only consultation persistence (localStorage) with realistic seeded requests.
// Keeps `apps/backend` untouched while supporting full schedule checking, booking,
// competing-slot queue ordering (by exact bookedAt timestamp), and staff confirmation.
import {
  CONSULTATION_OFFICES,
  CONSULTATION_SLOTS,
  getOfficeById,
  nextWeekdayYmd,
  toYmd,
} from './consultations.js';
import {
  notifyStudentConfirmed,
  notifyStudentDeclined,
  notifyStudentCancelledByAdmin,
} from './notificationStore.js';

const STORAGE_KEY = 'campuslocate_consultations_v1';

function nowStamp() {
  const d = new Date();
  return {
    date: toYmd(d),
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

function buildSeedData() {
  const today = nextWeekdayYmd(new Date());
  const d = new Date(`${today}T00:00:00`);
  const makeBookedAt = (h, m, s) => {
    const t = new Date(d);
    t.setHours(h, m, s, 0);
    return t.toISOString();
  };

  return [
    {
      id: 1,
      officeId: 'faculty',
      officeName: 'Department Faculty Rooms / Offices',
      officeLocation: 'Academic Building, NGE/ST Building, & RTL Building',
      date: today,
      time: '09:00',
      reasonCategory: 'Thesis / Capstone Advising',
      concern: 'Need feedback on our Chapter 3 system architecture and database ERD before Friday panel check.',
      departmentDetail: 'CCS · Capstone 2 · Prof. Villanueva',
      studentId: 1,
      studentLoginId: '25-0001-001',
      studentName: 'Dela Cruz, Juan A.',
      status: 'pending',
      adminNote: '',
      bookedAt: makeBookedAt(7, 42, 11),
      reviewedBy: null,
      reviewedAt: null,
      history: [{ action: 'Consultation Requested', name: 'Dela Cruz, Juan A.', date: today, time: '07:42:11 AM' }],
    },
    {
      id: 2,
      officeId: 'faculty',
      officeName: 'Department Faculty Rooms / Offices',
      officeLocation: 'Academic Building, NGE/ST Building, & RTL Building',
      date: today,
      time: '09:00',
      reasonCategory: 'Grade Inquiry',
      concern: 'Would like to verify my midterm laboratory rubric breakdown for CS301.',
      departmentDetail: 'CCS · CS301 · Prof. Villanueva',
      studentId: 102,
      studentLoginId: '24-0184-220',
      studentName: 'Reyes, Maria Clara',
      status: 'pending',
      adminNote: '',
      bookedAt: makeBookedAt(7, 58, 46),
      reviewedBy: null,
      reviewedAt: null,
      history: [{ action: 'Consultation Requested', name: 'Reyes, Maria Clara', date: today, time: '07:58:46 AM' }],
    },
    {
      id: 3,
      officeId: 'guidance',
      officeName: 'Guidance Center',
      officeLocation: 'RTL / Main Building',
      date: today,
      time: '14:00',
      reasonCategory: 'Mental Health & Stress Support',
      concern: 'Requesting a confidential session to manage academic burnout and exam anxiety.',
      departmentDetail: '',
      studentId: 103,
      studentLoginId: '23-0412-099',
      studentName: 'Lim, Joshua P.',
      status: 'pending',
      adminNote: '',
      bookedAt: makeBookedAt(8, 10, 5),
      reviewedBy: null,
      reviewedAt: null,
      history: [{ action: 'Consultation Requested', name: 'Lim, Joshua P.', date: today, time: '08:10:05 AM' }],
    },
    {
      id: 4,
      officeId: 'guidance',
      officeName: 'Guidance Center',
      officeLocation: 'RTL / Main Building',
      date: today,
      time: '14:00',
      reasonCategory: 'Academic / Career Guidance',
      concern: 'Seeking guidance on study load planning and elective choices for next semester.',
      departmentDetail: '',
      studentId: 104,
      studentLoginId: '25-0290-114',
      studentName: 'Bautista, Angela M.',
      status: 'pending',
      adminNote: '',
      bookedAt: makeBookedAt(8, 29, 33),
      reviewedBy: null,
      reviewedAt: null,
      history: [{ action: 'Consultation Requested', name: 'Bautista, Angela M.', date: today, time: '08:29:33 AM' }],
    },
    {
      id: 5,
      officeId: 'clinic',
      officeName: 'Medical-Dental Clinic',
      officeLocation: 'RTL / Main Building',
      date: today,
      time: '10:00',
      reasonCategory: 'Health Clearance',
      concern: 'Medical clearance check and signature required for OJT deployment.',
      departmentDetail: 'Medical Clearance',
      studentId: 105,
      studentLoginId: '24-0077-315',
      studentName: 'Villanueva, Carlo R.',
      status: 'confirmed',
      adminNote: 'Confirmed — please bring your student ID and medical form to Clinic Desk 1.',
      bookedAt: makeBookedAt(7, 15, 22),
      reviewedBy: 'Campus Admin',
      reviewedAt: makeBookedAt(7, 30, 0),
      history: [
        { action: 'Consultation Requested', name: 'Villanueva, Carlo R.', date: today, time: '07:15:22 AM' },
        { action: 'Confirmed by Staff', name: 'Campus Admin', date: today, time: '07:30:00 AM' },
      ],
    },
    {
      id: 6,
      officeId: 'tic',
      officeName: 'Teknoy Ikigai Center (TIC)',
      officeLocation: 'CIT-U Campus (TIC)',
      date: today,
      time: '15:00',
      reasonCategory: 'Career Coaching',
      concern: 'Resume review and mentorship preparation for upcoming software engineering internships.',
      departmentDetail: 'BSIT · 3rd Year',
      studentId: 1,
      studentLoginId: '25-0001-001',
      studentName: 'Dela Cruz, Juan A.',
      status: 'pending',
      adminNote: '',
      bookedAt: makeBookedAt(8, 5, 19),
      reviewedBy: null,
      reviewedAt: null,
      history: [{ action: 'Consultation Requested', name: 'Dela Cruz, Juan A.', date: today, time: '08:05:19 AM' }],
    },
  ];
}

export function loadConsultations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback to seeded data */
  }
  const seeded = buildSeedData();
  saveConsultations(seeded, { syncDev: false });
  return seeded;
}

export function saveConsultations(list, { syncDev = true } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore storage quota errors */
  }
  if (syncDev && typeof fetch === 'function') {
    fetch('/__consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultations: list }),
    }).catch(() => {});
  }
}

export async function syncConsultationsFromDevBridge() {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch('/__consultations');
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return null;
    const data = await res.json();
    if (Array.isArray(data.consultations)) {
      const nextJson = JSON.stringify(data.consultations);
      const prevJson = localStorage.getItem(STORAGE_KEY);
      if (nextJson !== prevJson) {
        localStorage.setItem(STORAGE_KEY, nextJson);
        return true;
      }
      return false;
    }
    // First-time dev initialization: publish local seeded list to shared dev store.
    const current = loadConsultations();
    await fetch('/__consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultations: current }),
    });
    return false;
  } catch {
    return null;
  }
}

export function resetDemoConsultations() {
  const seeded = buildSeedData();
  saveConsultations(seeded, { syncDev: false });
  return seeded;
}

export function getSlotAvailability(officeId, date, viewerStudentId = null) {
  const all = loadConsultations();
  const dayBookings = all.filter(
    (c) => c.officeId === officeId && c.date === date && !['declined', 'cancelled'].includes(c.status)
  );

  return CONSULTATION_SLOTS.map(({ time, label }) => {
    const slotBookings = dayBookings
      .filter((c) => c.time === time)
      .sort((a, b) => new Date(a.bookedAt) - new Date(b.bookedAt));

    const confirmed = slotBookings.find((c) => c.status === 'confirmed' || c.status === 'completed');
    const pendingList = slotBookings.filter((c) => c.status === 'pending');
    const myBooking = viewerStudentId
      ? slotBookings.find((c) => c.studentId === viewerStudentId) || null
      : null;

    let slotStatus = 'available';
    if (confirmed) slotStatus = 'booked';
    else if (pendingList.length > 0) slotStatus = 'pending';

    return {
      time,
      label,
      slotStatus,
      pendingCount: pendingList.length,
      confirmedCount: confirmed ? 1 : 0,
      myBookingId: myBooking?.id || null,
      myBookingStatus: myBooking?.status || null,
      firstBookedAt: pendingList[0]?.bookedAt || confirmed?.bookedAt || null,
    };
  });
}

export function getUserConsultations(studentId) {
  return loadConsultations()
    .filter((c) => c.studentId === studentId)
    .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
}

export function createConsultationRequest({
  officeId,
  date,
  time,
  reasonCategory,
  concern,
  departmentDetail,
  student,
}) {
  const office = getOfficeById(officeId);
  if (!office) throw new Error('Please choose a valid consultation office.');
  if (!date) throw new Error('Please choose a consultation date.');
  if (!CONSULTATION_SLOTS.some((s) => s.time === time)) {
    throw new Error('Please choose an available time slot.');
  }
  const cleanReason = (reasonCategory || '').trim();
  const cleanConcern = (concern || '').trim();
  if (!cleanReason) throw new Error('Please select a reason for your consultation.');
  if (!cleanConcern) throw new Error('Please describe your concern or reason.');

  const all = loadConsultations();
  const confirmed = all.find(
    (c) =>
      c.officeId === officeId &&
      c.date === date &&
      c.time === time &&
      ['confirmed', 'completed'].includes(c.status)
  );
  if (confirmed) {
    throw new Error('This schedule is already booked and confirmed. Please pick another available time.');
  }

  const dup = all.find(
    (c) =>
      c.studentId === student.id &&
      c.officeId === officeId &&
      c.date === date &&
      c.time === time &&
      ['pending', 'confirmed'].includes(c.status)
  );
  if (dup) {
    throw new Error('You already have an active request for this office and time slot.');
  }

  const nextId = all.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const bookedAt = new Date().toISOString();
  const { date: nowDate, time: nowTime } = nowStamp();

  const record = {
    id: nextId,
    officeId: office.id,
    officeName: office.name,
    officeLocation: office.location,
    date,
    time,
    reasonCategory: cleanReason,
    concern: cleanConcern,
    departmentDetail: (departmentDetail || '').trim(),
    studentId: student.id,
    studentLoginId: student.loginId || 'Student',
    studentName: student.name || 'Student',
    status: 'pending',
    adminNote: '',
    bookedAt,
    reviewedBy: null,
    reviewedAt: null,
    history: [
      {
        action: 'Consultation Requested',
        name: student.name || 'Student',
        date: nowDate,
        time: nowTime,
      },
    ],
  };

  saveConsultations([...all, record]);
  return record;
}

export function cancelUserConsultation(id, studentName = 'Student') {
  const all = loadConsultations();
  const target = all.find((c) => c.id === Number(id));
  if (!target) throw new Error('Consultation request not found.');
  if (!['pending', 'confirmed'].includes(target.status)) {
    throw new Error('Only pending or confirmed consultations can be cancelled.');
  }
  const { date: nowDate, time: nowTime } = nowStamp();
  target.status = 'cancelled';
  target.reviewedAt = new Date().toISOString();
  target.history = [
    ...(target.history || []),
    { action: 'Cancelled by Student', name: studentName, date: nowDate, time: nowTime },
  ];
  saveConsultations(all);
  return target;
}

// --- Admin queue + conflict helpers ---

export function getAdminConsultationsWithQueue() {
  const all = loadConsultations();
  const activeBySlot = new Map();

  for (const item of all) {
    if (!['pending', 'confirmed'].includes(item.status)) continue;
    const key = `${item.officeId}|${item.date}|${item.time}`;
    if (!activeBySlot.has(key)) activeBySlot.set(key, []);
    activeBySlot.get(key).push(item);
  }

  const queuePosById = new Map();
  const competingCountById = new Map();
  const slotHasConfirmedById = new Map();

  for (const group of activeBySlot.values()) {
    group.sort((a, b) => new Date(a.bookedAt) - new Date(b.bookedAt));
    const hasConfirmed = group.some((g) => g.status === 'confirmed');
    group.forEach((g, idx) => {
      queuePosById.set(g.id, idx + 1);
      competingCountById.set(g.id, group.length);
      slotHasConfirmedById.set(g.id, hasConfirmed);
    });
  }

  return all
    .slice()
    .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))
    .map((item) => ({
      ...item,
      queuePosition: queuePosById.get(item.id) || null,
      slotCompetingCount: competingCountById.get(item.id) || 0,
      slotHasConfirmed: slotHasConfirmedById.get(item.id) || false,
    }));
}

export function updateAdminConsultationStatus(
  id,
  { status, adminNote = '', autoDeclineConflicts = false },
  staffName = 'Campus Admin'
) {
  const all = loadConsultations();
  const record = all.find((c) => c.id === Number(id));
  if (!record) throw new Error('Consultation request not found.');

  if (status === 'confirmed') {
    const alreadyConfirmed = all.find(
      (c) =>
        c.id !== record.id &&
        c.officeId === record.officeId &&
        c.date === record.date &&
        c.time === record.time &&
        ['confirmed', 'completed'].includes(c.status)
    );
    if (alreadyConfirmed) {
      throw new Error(
        `Slot already confirmed for ${alreadyConfirmed.studentName}. Decline or reschedule that booking first.`
      );
    }
  }

  const { date: nowDate, time: nowTime } = nowStamp();
  record.status = status;
  if (adminNote !== undefined) record.adminNote = adminNote.trim();
  record.reviewedBy = staffName;
  record.reviewedAt = new Date().toISOString();

  const labelMap = {
    confirmed: 'Confirmed by Staff',
    completed: 'Marked Completed',
    declined: 'Declined by Staff',
    pending: 'Returned to Pending',
  };
  record.history = [
    ...(record.history || []),
    { action: labelMap[status] || `Status updated to ${status}`, name: staffName, date: nowDate, time: nowTime },
  ];

  // Push student notification for status changes
  if (status === 'confirmed') notifyStudentConfirmed(record.studentId, record);
  if (status === 'declined')  notifyStudentDeclined(record.studentId, record);

  let declinedCount = 0;
  if (status === 'confirmed' && autoDeclineConflicts) {
    for (const other of all) {
      if (
        other.id !== record.id &&
        other.officeId === record.officeId &&
        other.date === record.date &&
        other.time === record.time &&
        other.status === 'pending'
      ) {
        other.status = 'declined';
        other.adminNote =
          other.adminNote ||
          'An earlier or prioritized booking was confirmed for this schedule. Please book another open slot.';
        other.reviewedBy = staffName;
        other.reviewedAt = new Date().toISOString();
        other.history = [
          ...(other.history || []),
          {
            action: 'Declined (Slot Confirmed for Another Request)',
            name: staffName,
            date: nowDate,
            time: nowTime,
          },
        ];
        notifyStudentDeclined(other.studentId, other);
        declinedCount += 1;
      }
    }
  }

  // Push student notification after all changes settled
  if (status === 'confirmed') notifyStudentConfirmed(record.studentId, record);
  if (status === 'declined')  notifyStudentDeclined(record.studentId, record);

  saveConsultations(all);
  return { record, declinedCount };
}

/** Admin cancels a booking with a written reason — student should rebook. */
export function cancelByAdmin(id, reason = '', staffName = 'Campus Admin') {
  const all = loadConsultations();
  const record = all.find((c) => c.id === Number(id));
  if (!record) throw new Error('Consultation request not found.');
  if (!['pending', 'confirmed'].includes(record.status)) {
    throw new Error('Only pending or confirmed consultations can be cancelled.');
  }
  const cleanReason = (reason || '').trim() || 'No reason provided.';
  const { date: nowDate, time: nowTime } = nowStamp();
  record.status = 'cancelled';
  record.adminNote = `Consultation cancelled. Reason: ${cleanReason} Please submit a new booking.`;
  record.reviewedBy = staffName;
  record.reviewedAt = new Date().toISOString();
  record.history = [
    ...(record.history || []),
    { action: `Cancelled by Staff — ${cleanReason}`, name: staffName, date: nowDate, time: nowTime },
  ];
  notifyStudentCancelledByAdmin(record.studentId, record, cleanReason);
  saveConsultations(all);
  return record;
}

export function rescheduleAdminConsultation() {
  throw new Error('Rescheduling is disabled. Use cancelByAdmin instead — the student will rebook.');
}

export { CONSULTATION_OFFICES, CONSULTATION_SLOTS };
