// Shared notification store — localStorage only, no backend.
// Generates notifications from consultations (and stubs for lost items / announcements).
// Each portal reads its own notification list keyed by portal + user id.

const KEY_USER   = (uid) => `campuslocate_notifs_user_${uid}`;
const KEY_ADMIN  = 'campuslocate_notifs_admin';
const CONSULT_KEY = 'campuslocate_consultations_v1';

/* ─── helpers ─────────────────────────────────────────────────── */
function loadJson(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
function nowIso() { return new Date().toISOString(); }

/* ─── student notification types ──────────────────────────────── */
// type: 'consultation_confirmed' | 'consultation_declined' | 'consultation_cancelled'
//       | 'lost_item_match' | 'announcement_posted'

/* ─── admin notification types ────────────────────────────────── */
// type: 'new_consultation' | 'slot_conflict' | 'new_lost_item' | 'pending_reminder'

/* ════════════════════════════════════════════════════════════════
   STUDENT SIDE
   ════════════════════════════════════════════════════════════════ */

export function getUserNotifications(studentId) {
  if (!studentId) return [];
  return loadJson(KEY_USER(studentId));
}

export function markUserNotifRead(studentId, notifId) {
  const list = loadJson(KEY_USER(studentId));
  const item = list.find((n) => n.id === notifId);
  if (item) { item.read = true; saveJson(KEY_USER(studentId), list); }
}

export function markAllUserNotifsRead(studentId) {
  const list = loadJson(KEY_USER(studentId)).map((n) => ({ ...n, read: true }));
  saveJson(KEY_USER(studentId), list);
}

export function clearUserNotifs(studentId) {
  saveJson(KEY_USER(studentId), []);
}

/** Push a notification to a student. Called from consultationStore after status change. */
export function pushUserNotif(studentId, notif) {
  if (!studentId) return;
  const list = loadJson(KEY_USER(studentId));
  list.unshift({ id: Date.now() + Math.random(), read: false, createdAt: nowIso(), ...notif });
  // keep last 60
  saveJson(KEY_USER(studentId), list.slice(0, 60));
}

/* ════════════════════════════════════════════════════════════════
   ADMIN SIDE
   ════════════════════════════════════════════════════════════════ */

export function getAdminNotifications() {
  return loadJson(KEY_ADMIN);
}

export function markAdminNotifRead(notifId) {
  const list = loadJson(KEY_ADMIN);
  const item = list.find((n) => n.id === notifId);
  if (item) { item.read = true; saveJson(KEY_ADMIN, list); }
}

export function markAllAdminNotifsRead() {
  const list = loadJson(KEY_ADMIN).map((n) => ({ ...n, read: true }));
  saveJson(KEY_ADMIN, list);
}

export function clearAdminNotifs() {
  saveJson(KEY_ADMIN, []);
}

/** Push a notification to admin queue. */
export function pushAdminNotif(notif) {
  const list = loadJson(KEY_ADMIN);
  list.unshift({ id: Date.now() + Math.random(), read: false, createdAt: nowIso(), ...notif });
  saveJson(KEY_ADMIN, list.slice(0, 60));
}

/* ════════════════════════════════════════════════════════════════
   AUTO-GENERATE from consultations for admin (new + conflicts)
   Called by admin Consultations page on each sync tick.
   We track which consultation IDs we've already notified about
   so we don't double-push.
   ════════════════════════════════════════════════════════════════ */

const SEEN_KEY = 'campuslocate_notifs_admin_seen';

function loadSeen() { return new Set(loadJson(SEEN_KEY, [])); }
function saveSeen(set) { saveJson(SEEN_KEY, [...set].slice(-400)); }

export function syncAdminNotificationsFromConsultations() {
  const consultations = loadJson(CONSULT_KEY, []);
  const seen = loadSeen();
  const added = [];

  for (const c of consultations) {
    // --- New consultation request ---
    const newKey = `new_${c.id}`;
    if (!seen.has(newKey)) {
      seen.add(newKey);
      pushAdminNotif({
        type: 'new_consultation',
        title: 'New Consultation Request',
        body: `${c.studentName} booked ${c.officeName} at ${c.time?.replace(':','') === '0800' ? '8:00 AM' : formatTime(c.time)} on ${c.date}.`,
        meta: { consultationId: c.id, studentName: c.studentName, officeId: c.officeId },
      });
      added.push(newKey);
    }
  }

  // --- Slot conflicts (pending slots with 2+ students) ---
  const slotMap = new Map();
  for (const c of consultations) {
    if (c.status !== 'pending') continue;
    const key = `${c.officeId}|${c.date}|${c.time}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key).push(c);
  }
  for (const [slotKey, group] of slotMap.entries()) {
    if (group.length < 2) continue;
    const conflictKey = `conflict_${slotKey}`;
    if (!seen.has(conflictKey)) {
      seen.add(conflictKey);
      const [office, date, time] = slotKey.split('|');
      pushAdminNotif({
        type: 'slot_conflict',
        title: 'Slot Conflict Detected',
        body: `${group.length} students are competing for ${group[0].officeName} at ${formatTime(time)} on ${date}. Review who booked first.`,
        meta: { officeId: office, date, time },
      });
      added.push(conflictKey);
    }
  }

  // --- Pending reminder: requests older than 1 hour ---
  for (const c of consultations) {
    if (c.status !== 'pending') continue;
    const reminderKey = `remind_${c.id}`;
    if (!seen.has(reminderKey)) {
      const age = Date.now() - new Date(c.bookedAt).getTime();
      if (age > 60 * 60 * 1000) {
        seen.add(reminderKey);
        pushAdminNotif({
          type: 'pending_reminder',
          title: 'Pending Review Reminder',
          body: `${c.studentName}'s request for ${c.officeName} has been waiting for over 1 hour.`,
          meta: { consultationId: c.id },
        });
        added.push(reminderKey);
      }
    }
  }

  if (added.length > 0) saveSeen(seen);
  return added.length;
}

/* ════════════════════════════════════════════════════════════════
   MANUAL PUSH helpers (called from consultationStore on save)
   ════════════════════════════════════════════════════════════════ */

/** Student: consultation confirmed */
export function notifyStudentConfirmed(studentId, consultation) {
  pushUserNotif(studentId, {
    type: 'consultation_confirmed',
    title: 'Consultation Confirmed ✅',
    body: `Your booking at ${consultation.officeName} on ${consultation.date} at ${formatTime(consultation.time)} has been confirmed.${consultation.adminNote ? ' Staff note: ' + consultation.adminNote : ''}`,
    meta: { consultationId: consultation.id },
  });
}

/** Student: consultation declined by admin */
export function notifyStudentDeclined(studentId, consultation) {
  pushUserNotif(studentId, {
    type: 'consultation_declined',
    title: 'Consultation Declined ❌',
    body: `Your booking at ${consultation.officeName} on ${consultation.date} was declined.${consultation.adminNote ? ' Reason: ' + consultation.adminNote : ''}`,
    meta: { consultationId: consultation.id },
  });
}

/** Student: consultation cancelled by admin (with custom reason → please reschedule) */
export function notifyStudentCancelledByAdmin(studentId, consultation, reason) {
  pushUserNotif(studentId, {
    type: 'consultation_cancelled',
    title: 'Consultation Cancelled — Please Reschedule',
    body: `Your booking at ${consultation.officeName} on ${consultation.date} at ${formatTime(consultation.time)} was cancelled by staff. Reason: ${reason || 'No reason provided.'} Please submit a new booking.`,
    meta: { consultationId: consultation.id },
  });
}

/** Admin: new lost item report (call this from lost-items page when student submits) */
export function notifyAdminNewLostItem(itemName, studentName) {
  pushAdminNotif({
    type: 'new_lost_item',
    title: 'New Lost Item Report',
    body: `${studentName} reported a lost "${itemName}". Review under Lost & Found.`,
    meta: {},
  });
}

/** Student: lost item match found */
export function notifyStudentLostItemMatch(studentId, itemName) {
  pushUserNotif(studentId, {
    type: 'lost_item_match',
    title: 'Lost Item Match Found 🔍',
    body: `An item matching your report for "${itemName}" may have been found. Check Lost & Found for details.`,
    meta: {},
  });
}

/** Student: new announcement */
export function notifyStudentAnnouncement(studentId, title) {
  pushUserNotif(studentId, {
    type: 'announcement_posted',
    title: 'New Announcement 📢',
    body: title,
    meta: {},
  });
}

/* ─── format helpers ───────────────────────────────────────────── */
function formatTime(time24 = '') {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = mStr || '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}
