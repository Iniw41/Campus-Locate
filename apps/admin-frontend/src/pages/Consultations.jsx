// Admin Consultations: inspect requests grouped by schedule slot, compare exact booking timestamps
// ("who booked first") and student reasons/concerns. Confirm, complete, or cancel with reason.
// Admin does NOT reschedule — cancellation notifies the student to rebook.
import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  X,
  History,
  MessageSquareText,
  Check,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '@shared/src/schedule.js';
import {
  CONSULTATION_OFFICES,
  CONSULTATION_SLOTS,
  CONSULTATION_STATUS_META,
  fmtBookedAt,
  fmtBookedTimeOnly,
  getSlotLabel,
} from '@shared/src/consultations.js';
import {
  getAdminConsultationsWithQueue,
  cancelByAdmin,
  resetDemoConsultations,
  syncConsultationsFromDevBridge,
  updateAdminConsultationStatus,
} from '@shared/src/consultationStore.js';
import { syncAdminNotificationsFromConsultations } from '@shared/src/notificationStore.js';

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-field px-3.5 py-2.5 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20';

const TABS = [
  { key: 'pending', label: 'Needs Review' },
  { key: 'conflicts', label: 'Slot Conflicts' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'all', label: 'All Requests' },
];

function StatusPill({ status }) {
  const meta = CONSULTATION_STATUS_META[status] || CONSULTATION_STATUS_META.pending;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.pill}`}>
      {meta.label}
    </span>
  );
}

export default function Consultations() {
  const { user } = useAuth();
  const staffName = user?.name || 'Campus Admin';

  const [tab, setTab] = useState('pending');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [autoDeclineConflicts, setAutoDeclineConflicts] = useState(true);
  // Cancel-with-reason panel
  const [showCancelPanel, setShowCancelPanel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const changed = await syncConsultationsFromDevBridge();
      if (active && changed) setVersion((v) => v + 1);
      syncAdminNotificationsFromConsultations();
    };
    sync();
    const timer = setInterval(sync, 2000);
    window.addEventListener('focus', sync);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const allItems = useMemo(
    () => getAdminConsultationsWithQueue(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const counts = useMemo(() => {
    const pending = allItems.filter((i) => i.status === 'pending').length;
    const confirmed = allItems.filter((i) => i.status === 'confirmed').length;
    const completed = allItems.filter((i) => i.status === 'completed').length;
    const conflictKeys = new Set(
      allItems
        .filter((i) => i.status === 'pending' && i.slotCompetingCount > 1)
        .map((i) => `${i.officeId}|${i.date}|${i.time}`)
    );
    return { pending, confirmed, completed, conflicts: conflictKeys.size };
  }, [allItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (officeFilter !== 'all' && item.officeId !== officeFilter) return false;
      if (tab === 'pending' && item.status !== 'pending') return false;
      if (tab === 'conflicts' && !(item.status === 'pending' && item.slotCompetingCount > 1)) return false;
      if (tab === 'confirmed' && item.status !== 'confirmed') return false;
      if (!q) return true;
      return (
        item.studentName.toLowerCase().includes(q) ||
        item.studentLoginId.toLowerCase().includes(q) ||
        item.reasonCategory.toLowerCase().includes(q) ||
        item.concern.toLowerCase().includes(q)
      );
    });
  }, [allItems, tab, officeFilter, query]);

  // Group by slot
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const key = `${item.officeId}|${item.date}|${item.time}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          officeId: item.officeId,
          officeName: item.officeName,
          officeLocation: item.officeLocation,
          date: item.date,
          time: item.time,
          items: [],
        });
      }
      map.get(key).items.push(item);
    }
    for (const g of map.values()) {
      g.items.sort((a, b) => new Date(a.bookedAt) - new Date(b.bookedAt));
    }
    return [...map.values()].sort((a, b) => {
      const aFirst = a.items[0]?.bookedAt || '';
      const bFirst = b.items[0]?.bookedAt || '';
      return new Date(bFirst) - new Date(aFirst);
    });
  }, [filtered]);

  const selected = useMemo(() => allItems.find((i) => i.id === selectedId) || null, [allItems, selectedId]);

  const competingForSelected = useMemo(() => {
    if (!selected) return [];
    return allItems.filter(
      (i) =>
        i.id !== selected.id &&
        i.officeId === selected.officeId &&
        i.date === selected.date &&
        i.time === selected.time &&
        ['pending', 'confirmed'].includes(i.status)
    );
  }, [allItems, selected]);

  function openDrawer(item) {
    setSelectedId(item.id);
    setAdminNote(item.adminNote || '');
    setShowCancelPanel(false);
    setCancelReason('');
    setFeedback({ type: '', text: '' });
  }

  function flash(type, text) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  }

  function handleStatusChange(id, status, opts = {}) {
    try {
      const { record, declinedCount } = updateAdminConsultationStatus(
        id,
        { status, adminNote: opts.adminNote ?? adminNote, autoDeclineConflicts: opts.autoDeclineConflicts ?? false },
        staffName
      );
      setVersion((v) => v + 1);
      if (status === 'confirmed') {
        flash(
          'success',
          declinedCount > 0
            ? `Confirmed! ${declinedCount} competing request(s) auto-declined.`
            : `Booking confirmed for ${record.studentName}.`
        );
      } else if (status === 'declined') {
        flash('info', `Request declined.`);
      } else if (status === 'completed') {
        flash('success', `Consultation marked as completed.`);
      }
      if (['declined', 'completed'].includes(status)) setSelectedId(null);
    } catch (err) {
      flash('error', err.message);
    }
  }

  function handleCancelByAdmin(e) {
    e.preventDefault();
    if (!cancelReason.trim()) {
      flash('error', 'Please enter a cancellation reason so the student knows why.');
      return;
    }
    try {
      cancelByAdmin(selected.id, cancelReason.trim(), staffName);
      setVersion((v) => v + 1);
      flash('success', 'Booking cancelled. Student has been notified to rebook.');
      setSelectedId(null);
      setShowCancelPanel(false);
      setCancelReason('');
    } catch (err) {
      flash('error', err.message);
    }
  }

  function handleReset() {
    resetDemoConsultations();
    setVersion((v) => v + 1);
    setSelectedId(null);
    flash('info', 'Demo data has been reset.');
  }

  return (
    <div className="space-y-6">
      {/* Ops summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Needs Review', value: counts.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Slot Conflicts', value: counts.conflicts, color: 'text-red-700 bg-red-50 border-red-200' },
          { label: 'Confirmed', value: counts.confirmed, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'Completed', value: counts.completed, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-4 ${color}`}>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-xs font-semibold opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t.key ? 'bg-maroon text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
              {t.key === 'pending' && counts.pending > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm outline-none"
        >
          <option value="all">All Offices</option>
          {CONSULTATION_OFFICES.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>

        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search student, reason…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-xs shadow-sm outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20 w-56"
          />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-maroon hover:text-maroon"
        >
          <RotateCcw size={13} /> Reset Demo
        </button>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center text-sm text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
          No consultation requests match the current filter.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const pendingInGroup = group.items.filter((i) => i.status === 'pending');
            const hasConflict = pendingInGroup.length > 1;
            const confirmedItem = group.items.find((i) => i.status === 'confirmed');

            return (
              <section
                key={group.key}
                className={`overflow-hidden rounded-[2rem] border bg-white shadow-sm ${
                  hasConflict ? 'border-amber-300 ring-1 ring-amber-200 dark:border-amber-800 dark:ring-amber-900/50' : 'border-gray-200'
                }`}
              >
                {/* Schedule slot header */}
                <div
                  className={`flex flex-col gap-2 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    hasConflict
                      ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-gray-900">{group.officeName}</h3>
                      {hasConflict && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                          <AlertTriangle size={12} /> {pendingInGroup.length} Competing Requests — Compare Booked Times
                        </span>
                      )}
                      {confirmedItem && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <Check size={12} /> Confirmed: {confirmedItem.studentName}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-maroon" /> {group.officeLocation}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                        <Calendar size={12} className="text-maroon" /> {fmtDate(group.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-maroon">
                        <Clock size={12} /> {getSlotLabel(group.time)}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-gray-500">
                    Sorted earliest booked first
                  </p>
                </div>

                {/* Requests inside this schedule slot */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => {
                    const isFirstInQueue = item.queuePosition === 1 && ['pending', 'confirmed'].includes(item.status);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 p-5 transition-colors hover:bg-gray-50/70 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.queuePosition && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                                  isFirstInQueue
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                #{item.queuePosition} {isFirstInQueue ? '· Booked First' : 'in Queue'}
                              </span>
                            )}
                            <StatusPill status={item.status} />
                            <span className="inline-flex items-center gap-1 rounded-full bg-maroon-light px-2.5 py-0.5 text-[11px] font-semibold text-maroon">
                              <Clock size={11} /> Booked at {fmtBookedAt(item.bookedAt)}
                            </span>
                          </div>

                          <div>
                            <p className="text-base font-bold text-gray-900">
                              {item.studentName}{' '}
                              <span className="text-xs font-medium text-gray-500">({item.studentLoginId})</span>
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-maroon">
                              Reason: {item.reasonCategory}
                              {item.departmentDetail ? ` · ${item.departmentDetail}` : ''}
                            </p>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs leading-relaxed text-gray-700">
                            <span className="mr-1.5 inline-flex items-center gap-1 font-bold uppercase tracking-wider text-gray-500">
                              <MessageSquareText size={12} /> Concern:
                            </span>
                            {item.concern}
                          </div>

                          {item.adminNote && (
                            <p className="text-xs text-gray-600">
                              <strong className="text-gold">Staff Note:</strong> {item.adminNote}
                            </p>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {item.status === 'pending' && !item.slotHasConfirmed && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(item.id, 'confirmed', {
                                  adminNote: item.adminNote || '',
                                  autoDeclineConflicts: item.slotCompetingCount > 1,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                            >
                              <CheckCircle2 size={14} />
                              {item.slotCompetingCount > 1 ? 'Confirm & Decline Others' : 'Confirm'}
                            </button>
                          )}

                          {item.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'completed')}
                              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                              <Check size={14} /> Mark Completed
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDrawer(item)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:border-maroon hover:text-maroon"
                          >
                            Review Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Slide-in detail & decision drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Review consultation">
          <button
            type="button"
            aria-label="Close review drawer"
            className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <div className="drawer-panel relative ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="roads flex items-start justify-between bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <StatusPill status={selected.status} />
                  {selected.queuePosition && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-light">
                      #{selected.queuePosition} in slot queue
                    </span>
                  )}
                </div>
                <h2 className="font-display text-2xl font-bold leading-tight">{selected.studentName}</h2>
                <p className="mt-0.5 text-xs text-white/80">
                  ID: {selected.studentLoginId} · {selected.officeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close drawer"
                className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              >
                <X size={18} />
              </button>
            </div>

            {feedback.text && (
              <div
                className={`px-6 py-3 text-xs font-semibold ${
                  feedback.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Requested Schedule</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{fmtDate(selected.date)}</dd>
                  <dd className="text-gray-600">{getSlotLabel(selected.time)}</dd>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Exact Time Booked</dt>
                  <dd className="mt-1 font-semibold text-maroon">{fmtBookedAt(selected.bookedAt)}</dd>
                </div>
                <div className="col-span-2 rounded-2xl bg-gray-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Topic / Reason</dt>
                  <dd className="mt-1 font-semibold text-gray-900">
                    {selected.reasonCategory}
                    {selected.departmentDetail ? ` · ${selected.departmentDetail}` : ''}
                  </dd>
                </div>
              </dl>

              <section>
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  Student Concern / Reason
                </h3>
                <p className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                  {selected.concern}
                </p>
              </section>

              {competingForSelected.length > 0 && (
                <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    <Users size={14} /> Competing Bookings on This Exact Slot ({competingForSelected.length})
                  </h3>
                  <ul className="mt-2.5 space-y-2 text-xs">
                    {competingForSelected.map((other) => {
                      const earlier = new Date(other.bookedAt) < new Date(selected.bookedAt);
                      return (
                        <li
                          key={other.id}
                          className="flex items-start justify-between gap-2 rounded-xl bg-white/80 p-2.5 dark:bg-black/20"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900">
                              {other.studentName}{' '}
                              <span className="font-normal text-gray-500">({other.status})</span>
                            </p>
                            <p className="truncate text-gray-600">{other.reasonCategory}: {other.concern}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              earlier ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {fmtBookedTimeOnly(other.bookedAt)} {earlier ? '(Earlier)' : '(Later)'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {selected.status === 'pending' && !selected.slotHasConfirmed && (
                    <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium text-amber-950 dark:text-amber-200">
                      <input
                        type="checkbox"
                        checked={autoDeclineConflicts}
                        onChange={(e) => setAutoDeclineConflicts(e.target.checked)}
                        className="mt-0.5 accent-maroon"
                      />
                      <span>Automatically decline the other pending request(s) on this slot when confirming</span>
                    </label>
                  )}
                </section>
              )}

              <section>
                <label htmlFor="admin-note" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  Staff Note / Room Assignment (visible to student)
                </label>
                <textarea
                  id="admin-note"
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Proceed to NGE Rm 204…"
                  className={inputCls}
                />
              </section>

              {/* Cancel with reason panel */}
              {showCancelPanel && (
                <form onSubmit={handleCancelByAdmin} className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
                    <Ban size={14} /> Cancel Booking — Student Will Rebook
                  </h4>
                  <p className="text-xs text-red-600">
                    The student will receive a notification with your reason and a prompt to reschedule.
                  </p>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-red-700">
                      Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Faculty unavailable on this date, please choose another slot."
                      required
                      className="w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowCancelPanel(false); setCancelReason(''); }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Cancel Booking & Notify Student
                    </button>
                  </div>
                </form>
              )}

              {/* History log */}
              {selected.history?.length > 0 && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    <History size={14} className="text-maroon" /> Activity Log
                  </h3>
                  <ol className="relative space-y-4 border-l-2 border-gray-200 pl-5">
                    {selected.history.map((log, idx) => (
                      <li key={idx} className="relative">
                        <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white bg-maroon dark:border-[#1e1e22]" />
                        <p className="text-xs font-semibold text-gray-900">{log.action}</p>
                        <p className="text-[11px] text-gray-500">
                          by {log.name} · {log.date} · {log.time}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {selected.status === 'pending' && (
                  <button
                    type="button"
                    disabled={selected.slotHasConfirmed}
                    onClick={() =>
                      handleStatusChange(selected.id, 'confirmed', {
                        adminNote,
                        autoDeclineConflicts,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Confirm Booking
                  </button>
                )}

                {selected.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selected.id, 'completed', { adminNote })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Check size={14} /> Mark Completed
                  </button>
                )}

                {['pending', 'confirmed'].includes(selected.status) && !showCancelPanel && (
                  <button
                    type="button"
                    onClick={() => setShowCancelPanel(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Ban size={14} /> Cancel Booking
                  </button>
                )}
              </div>

              {['pending', 'confirmed'].includes(selected.status) && (
                <button
                  type="button"
                  onClick={() => handleStatusChange(selected.id, 'declined', { adminNote })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-700"
                >
                  <XCircle size={14} /> Decline
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
