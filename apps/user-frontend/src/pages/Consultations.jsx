// Student Consultations: browse CIT-U consultation offices, inspect live slot availability,
// submit a consultation request with reason/concern, and track personal booking status.
import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  HeartHandshake,
  Compass,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Send,
  XCircle,
  Lock,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '@shared/src/schedule.js';
import {
  CONSULTATION_OFFICES,
  CONSULTATION_STATUS_META,
  fmtBookedAt,
  getOfficeById,
  getSlotLabel,
  isWeekendYmd,
  nextWeekdayYmd,
  todayYmd,
} from '@shared/src/consultations.js';
import {
  cancelUserConsultation,
  createConsultationRequest,
  getSlotAvailability,
  getUserConsultations,
  syncConsultationsFromDevBridge,
} from '@shared/src/consultationStore.js';

const OFFICE_ICONS = {
  faculty: GraduationCap,
  guidance: HeartHandshake,
  tic: Compass,
  clinic: Stethoscope,
};

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-field px-3.5 py-2.5 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20';

const REQUEST_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'closed', label: 'History' },
];

export default function Consultations() {
  const { user } = useAuth();
  const studentId = user?.id || 1;

  const [officeId, setOfficeId] = useState(CONSULTATION_OFFICES[0].id);
  const [date, setDate] = useState(() => nextWeekdayYmd(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [reasonCategory, setReasonCategory] = useState(CONSULTATION_OFFICES[0].reasons[0]);
  const [departmentDetail, setDepartmentDetail] = useState('');
  const [concern, setConcern] = useState('');
  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const changed = await syncConsultationsFromDevBridge();
      if (active && changed) setVersion((v) => v + 1);
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

  const selectedOffice = useMemo(() => getOfficeById(officeId) || CONSULTATION_OFFICES[0], [officeId]);

  const slots = useMemo(
    () => getSlotAvailability(officeId, date, studentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [officeId, date, studentId, version]
  );

  const myRequests = useMemo(
    () => getUserConsultations(studentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studentId, version]
  );

  const filteredRequests = useMemo(() => {
    if (filter === 'active') return myRequests.filter((r) => ['pending', 'confirmed'].includes(r.status));
    if (filter === 'confirmed') return myRequests.filter((r) => r.status === 'confirmed');
    if (filter === 'closed') return myRequests.filter((r) => ['completed', 'declined', 'cancelled'].includes(r.status));
    return myRequests;
  }, [myRequests, filter]);

  const selectedSlotInfo = useMemo(
    () => slots.find((s) => s.time === selectedTime) || null,
    [slots, selectedTime]
  );

  const handleSelectOffice = (nextOffice) => {
    setOfficeId(nextOffice.id);
    setSelectedTime('');
    setReasonCategory(nextOffice.reasons[0]);
    setDepartmentDetail('');
    setFeedback({ type: '', text: '' });
  };

  const handleDateChange = (nextDate) => {
    setDate(nextDate);
    setSelectedTime('');
    setFeedback({ type: '', text: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      const created = createConsultationRequest({
        officeId,
        date,
        time: selectedTime,
        reasonCategory,
        concern,
        departmentDetail,
        student: {
          id: studentId,
          loginId: user?.loginId || '25-0001-001',
          name: user?.name || 'Student',
        },
      });
      setVersion((v) => v + 1);
      setSelectedTime('');
      setConcern('');
      setDepartmentDetail('');
      setFeedback({
        type: 'success',
        text: `Request submitted for ${selectedOffice.shortName} on ${fmtDate(created.date)} (${getSlotLabel(
          created.time
        )}). Booked at ${fmtBookedAt(created.bookedAt)}.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleCancel = (id) => {
    try {
      cancelUserConsultation(id, user?.name || 'Student');
      setVersion((v) => v + 1);
      setFeedback({ type: 'success', text: 'Your consultation request has been cancelled.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const weekend = isWeekendYmd(date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="roads relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light">
              CIT-U Student Support
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Book a Consultation
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Choose an office, check which time schedules are open or already requested, and submit your concern.
              Staff review requests in order of booking time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gold-light">My Active Requests</p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                {myRequests.filter((r) => ['pending', 'confirmed'].includes(r.status)).length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gold-light">Confirmed</p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                {myRequests.filter((r) => r.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {feedback.text && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
            }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: 3-step booking flow */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
          {/* Step 1: Offices */}
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">Step 1</p>
                <h3 className="font-display text-xl font-bold text-gray-900">Select Consultation Office</h3>
              </div>
              <span className="text-xs text-gray-500">4 CIT-U offices</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {CONSULTATION_OFFICES.map((office) => {
                const Icon = OFFICE_ICONS[office.id] || MapPin;
                const active = office.id === officeId;
                return (
                  <button
                    key={office.id}
                    type="button"
                    onClick={() => handleSelectOffice(office)}
                    className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${active
                        ? 'border-maroon bg-maroon-light/60 ring-2 ring-maroon/20'
                        : 'border-gray-200 bg-gray-50 hover:border-maroon/40'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-maroon text-white' : 'bg-white text-maroon shadow-sm'
                          }`}
                      >
                        <Icon size={19} />
                      </span>
                      {active && (
                        <span className="rounded-full bg-maroon px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-3 font-display text-base font-bold text-gray-900">{office.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-maroon">
                      <MapPin size={12} className="shrink-0" /> {office.location}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">{office.purpose}</p>
                    <p className="mt-auto pt-3 flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                      <Clock size={12} /> {office.hours}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Check availability & pick time */}
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">Step 2</p>
                <h3 className="font-display text-xl font-bold text-gray-900">
                  Check Available Schedules
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Live schedule for <strong className="text-gray-800">{selectedOffice.shortName}</strong>
                </p>
              </div>
              <div className="w-full sm:w-52">
                <label htmlFor="consult-date" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Consultation Date
                </label>
                <div className="relative">
                  <input
                    id="consult-date"
                    type="date"
                    min={todayYmd()}
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {weekend && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <span className="flex items-center gap-2">
                  <Info size={15} className="shrink-0" />
                  Selected date is a weekend. Campus offices normally operate Monday–Friday.
                </span>
                <button
                  type="button"
                  onClick={() => handleDateChange(nextWeekdayYmd(new Date(`${date}T00:00:00`)))}
                  className="shrink-0 rounded-full bg-amber-200/70 px-3 py-1 font-bold text-amber-900 hover:bg-amber-300/70 dark:bg-amber-900/60 dark:text-amber-100"
                >
                  Next weekday
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="mb-3 flex flex-wrap gap-3 text-[11px] font-semibold text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Requested (Pending queue)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> Booked (Confirmed)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-maroon" /> Selected / Yours
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {slots.map((slot) => {
                const isConfirmedTaken = slot.slotStatus === 'booked';
                const isMine = Boolean(slot.myBookingId);
                const disabled = isConfirmedTaken || isMine;
                const isSelected = selectedTime === slot.time;

                let statusBadge = (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    Open
                  </span>
                );
                if (isMine) {
                  statusBadge = (
                    <span className="rounded-full bg-maroon-light px-2 py-0.5 text-[10px] font-bold uppercase text-maroon">
                      Your {slot.myBookingStatus}
                    </span>
                  );
                } else if (isConfirmedTaken) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-700">
                      <Lock size={10} /> Booked
                    </span>
                  );
                } else if (slot.slotStatus === 'pending') {
                  statusBadge = (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      {slot.pendingCount} requested
                    </span>
                  );
                }

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition-all ${disabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-65'
                        : isSelected
                          ? 'border-maroon bg-maroon text-white shadow-md'
                          : slot.slotStatus === 'pending'
                            ? 'border-amber-300 bg-amber-50/60 hover:border-maroon dark:border-amber-800 dark:bg-amber-950/20'
                            : 'border-gray-200 bg-gray-50 hover:border-maroon/50 hover:bg-maroon-light/30'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className={isSelected ? 'text-gold-light' : 'text-maroon'} />
                      <span className="text-sm font-semibold">{slot.label}</span>
                    </div>
                    {!isSelected ? (
                      statusBadge
                    ) : (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Picked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedSlotInfo?.slotStatus === 'pending' && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Note: <strong>{selectedSlotInfo.pendingCount}</strong> student request(s) already exist for{' '}
                <strong>{selectedSlotInfo.label}</strong>. You can still submit a request, or choose an{' '}
                <strong>Open</strong> slot for no queue.
              </p>
            )}
          </section>

          {/* Step 3: Reason & concern */}
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">Step 3</p>
            <h3 className="font-display text-xl font-bold text-gray-900">Your Reason & Concern</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Only you and authorized office staff can view your consultation details.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Consultation Topic
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedOffice.reasons.map((reason) => {
                    const active = reasonCategory === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setReasonCategory(reason)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${active
                            ? 'bg-maroon text-white shadow-sm'
                            : 'border border-gray-200 bg-gray-50 text-gray-700 hover:border-maroon/40'
                          }`}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="consult-detail" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {selectedOffice.detailLabel}
                </label>
                <input
                  id="consult-detail"
                  type="text"
                  value={departmentDetail}
                  onChange={(e) => setDepartmentDetail(e.target.value)}
                  placeholder={selectedOffice.detailPlaceholder}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="consult-concern" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Describe Your Concern / Reason *
                </label>
                <textarea
                  id="consult-concern"
                  rows={3}
                  required
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder="Briefly explain what you need help with so staff can prepare or prioritize your schedule..."
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-600">
                  <p className="font-semibold text-gray-900">{selectedOffice.shortName}</p>
                  <p>
                    {fmtDate(date)} ·{' '}
                    <span className="font-semibold text-maroon">
                      {selectedTime ? getSlotLabel(selectedTime) : 'Pick a time slot in Step 2'}
                    </span>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!selectedTime}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} /> Submit Request
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* Right: My requests */}
        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-xl font-bold text-gray-900">My Consultations</h3>
                <p className="text-xs text-gray-500">Private to your account ({user?.loginId || 'Student'})</p>
              </div>
              <span className="rounded-full bg-maroon-light px-3 py-1 text-xs font-bold text-maroon">
                {myRequests.length} total
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {REQUEST_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filter === f.key
                      ? 'bg-maroon text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  No consultation requests in this view yet.
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const meta = CONSULTATION_STATUS_META[req.status] || CONSULTATION_STATUS_META.pending;
                  const canCancel = ['pending', 'confirmed'].includes(req.status);
                  return (
                    <article
                      key={req.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.pill}`}>
                            {meta.label}
                          </span>
                          <h4 className="mt-2 font-display text-base font-bold text-gray-900">
                            {req.officeName}
                          </h4>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} className="shrink-0 text-maroon" /> {req.officeLocation}
                          </p>
                        </div>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(req.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-transparent dark:text-red-300"
                          >
                            <XCircle size={12} /> Cancel
                          </button>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white p-3 text-xs">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Schedule</p>
                          <p className="mt-0.5 flex items-center gap-1 font-semibold text-gray-900">
                            <Calendar size={12} className="text-maroon" /> {fmtDate(req.date)}
                          </p>
                          <p className="mt-0.5 text-gray-600">{getSlotLabel(req.time)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Booked At</p>
                          <p className="mt-0.5 font-medium text-gray-700">{fmtBookedAt(req.bookedAt)}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs">
                        <p className="font-semibold text-gray-800">{req.reasonCategory}</p>
                        {req.departmentDetail && (
                          <p className="text-[11px] text-gray-500">{req.departmentDetail}</p>
                        )}
                        <p className="mt-1 text-gray-600">{req.concern}</p>
                      </div>

                      {req.adminNote && (
                        <div className="mt-3 rounded-xl border border-gold/40 bg-gold-soft px-3 py-2 text-xs text-gray-800">
                          <span className="font-bold text-gold">Staff Note: </span>
                          {req.adminNote}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
