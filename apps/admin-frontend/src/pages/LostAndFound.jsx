// Admin Lost & Found — a triage board.
//  • Kanban columns: Needs approval → Lost → Found → Closed
//  • Click a card to open a slide-in drawer with details, History Log and admin controls
//  • "New ticket" opens the same step-by-step drawer students use (staff tickets are auto-approved)
import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import {
  Trash2,
  CheckCircle2,
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  User,
  X,
  History,
  AlertCircle,
  Camera,
  SearchX,
  HandHeart,
  Inbox,
} from 'lucide-react';

const STATUSES = ['Lost', 'Found', 'Claimed', 'Resolved', 'Returned'];

const statusBadgeStyles = {
  Lost: 'bg-maroon-light text-maroon border border-maroon/20',
  Found: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Claimed: 'bg-blue-100 text-blue-800 border border-blue-200',
  Resolved: 'bg-purple-100 text-purple-800 border border-purple-200',
  Returned: 'bg-teal-100 text-teal-800 border border-teal-200',
};

const COLUMNS = [
  { key: 'pending', title: 'Needs approval', dot: 'bg-amber-500', bar: 'border-amber-400', edge: 'border-l-amber-400', match: (t) => t.approvalStatus === 'pending' },
  { key: 'Lost', title: 'Lost', dot: 'bg-maroon', bar: 'border-maroon', edge: 'border-l-maroon', match: (t) => t.approvalStatus !== 'pending' && t.status === 'Lost' },
  { key: 'Found', title: 'Found', dot: 'bg-emerald-600', bar: 'border-emerald-600', edge: 'border-l-emerald-600', match: (t) => t.approvalStatus !== 'pending' && t.status === 'Found' },
  { key: 'closed', title: 'Closed', dot: 'bg-gray-400', bar: 'border-gray-400', edge: 'border-l-gray-400', match: (t) => t.approvalStatus !== 'pending' && ['Claimed', 'Resolved', 'Returned'].includes(t.status) },
];

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-field px-3.5 py-2.5 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20';

const parseName = (fullName = '') => {
  if (!fullName) return { lastName: '', firstName: '' };
  if (fullName.includes(',')) {
    const [last, ...first] = fullName.split(',');
    return { lastName: last.trim(), firstName: first.join(',').trim() };
  }
  const parts = fullName.trim().split(' ');
  if (parts.length > 1) {
    const last = parts.pop();
    return { lastName: last, firstName: parts.join(' ') };
  }
  return { lastName: fullName, firstName: '' };
};

function fmtTime(t = '') {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

const reporterOf = (t) => (t.lastName ? `${t.lastName}, ${t.firstName}` : t.name);

function Pill({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        statusBadgeStyles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
}

function PendingPill() {
  return (
    <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
      Pending approval
    </span>
  );
}

/* ---------- History Log (timeline) ---------- */
function HistoryLog({ history }) {
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
        <History size={14} className="text-maroon" /> History Log
      </h3>
      {history && history.length > 0 ? (
        <ol className="relative space-y-5 border-l-2 border-gray-200 pl-6">
          {history.map((log, i) => {
            const latest = i === history.length - 1;
            return (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#1e1e22] ${
                    latest ? 'bg-maroon ring-4 ring-maroon/20' : 'bg-gray-300'
                  }`}
                />
                <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-600">
                  by <span className="font-medium">{log.name}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {log.date} · {log.time}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs italic text-gray-400">No history recorded yet.</p>
      )}
    </section>
  );
}

function Step({ n, title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-3 font-display text-base font-bold text-gray-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-xs text-white">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
      {children}
    </label>
  );
}

export default function LostAndFound() {
  const { user } = useAuth();
  const initialName = parseName(user?.name);

  const emptyForm = {
    lastName: initialName.lastName,
    firstName: initialName.firstName,
    status: 'Lost',
    lastFound: '',
    date: '',
    time: '',
    item: '',
    description: '',
    image: '',
  };

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(emptyForm);

  const apiEndpoint = portal.key === 'admin' ? '/admin/lost-and-found' : '/user/lost-and-found';

  useEffect(() => {
    let mounted = true;
    async function fetchTickets() {
      try {
        setLoading(true);
        const data = await api(apiEndpoint);
        if (mounted) setTickets(Array.isArray(data) ? data : data.tickets || []);
      } catch (err) {
        if (mounted) setLoadError(err.message || 'Failed to load tickets.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchTickets();
    return () => {
      mounted = false;
    };
  }, [apiEndpoint]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (addOpen) setAddOpen(false);
      else setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addOpen]);

  /* ----- admin actions (unchanged behaviour: logs who did it via updatedBy) ----- */
  const handleApproveTicket = async (ticketId) => {
    try {
      const res = await api(`/admin/lost-and-found/${ticketId}/approve`, {
        method: 'PATCH',
        body: { updatedBy: user?.name || 'Admin' },
      });
      const updated = res.ticket || res;
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, ...updated, approvalStatus: 'approved' } : t)));
    } catch (err) {
      alert(err.message || 'Failed to approve ticket.');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await api(`/admin/lost-and-found/${ticketId}/status`, {
        method: 'PATCH',
        body: { status: newStatus, updatedBy: user?.name || 'Admin' },
      });
      const updated = res.ticket || res;
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, ...updated, status: updated.status } : t)));
    } catch (err) {
      alert(err.message || 'Failed to update ticket status.');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    try {
      await api(`/admin/lost-and-found/${ticketId}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      if (selectedId === ticketId) setSelectedId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete ticket.');
    }
  };

  /* ----- add ticket ----- */
  const openAdd = () => {
    setSelectedId(null);
    setFormError('');
    setSuccessMessage('');
    setAddOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (
      !form.lastName.trim() ||
      !form.firstName.trim() ||
      !form.lastFound.trim() ||
      !form.date ||
      !form.time ||
      !form.item.trim() ||
      !form.description.trim()
    ) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api(apiEndpoint, {
        method: 'POST',
        body: {
          lastName: form.lastName.trim(),
          firstName: form.firstName.trim(),
          name: `${form.lastName.trim()}, ${form.firstName.trim()}`,
          status: form.status,
          lastFound: form.lastFound.trim(),
          date: form.date,
          time: form.time,
          item: form.item.trim(),
          description: form.description.trim(),
          image: form.image || undefined,
        },
      });

      const newTicket = res.ticket || res;
      setTickets((prev) => [newTicket, ...prev]);
      setSuccessMessage('Ticket added and auto-approved for campus display.');
      setForm(emptyForm);

      setTimeout(() => {
        setAddOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.item.toLowerCase().includes(q) ||
        t.lastFound?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  const selected = tickets.find((t) => t.id === selectedId) || null;
  const selectedPending = selected?.approvalStatus === 'pending';

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          <strong className="font-semibold text-gray-900">{tickets.length}</strong> tickets ·{' '}
          <span className="text-gray-500">click a card to open its history log</span>
        </p>
        <div className="flex items-center gap-3 sm:w-[28rem]">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, reporter, place…"
              aria-label="Search tickets"
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark"
          >
            <Plus size={17} /> New ticket
          </button>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl border-l-4 border-maroon bg-maroon-light px-4 py-3 text-sm font-medium text-maroon">
          <AlertCircle size={16} /> {loadError}
        </p>
      )}

      {/* Board */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-[2rem] border border-gray-200 bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-gray-500">Loading tickets…</p>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {COLUMNS.map((col) => {
            const items = filtered.filter(col.match);
            return (
              <section
                key={col.key}
                aria-label={col.title}
                className="flex min-h-[220px] w-[300px] shrink-0 snap-start flex-col rounded-[1.75rem] bg-white/70 p-3 backdrop-blur lg:w-auto"
              >
                <header className={`mb-3 flex items-center justify-between border-b-2 ${col.bar} px-2 pb-3`}>
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-gray-900">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dot} ${col.key === 'pending' && items.length ? 'animate-pulse' : ''}`} />
                    {col.title}
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">{items.length}</span>
                </header>

                {items.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-10 text-center text-xs text-gray-400">
                    <Inbox size={22} /> Nothing here
                  </div>
                ) : (
                  <ul className="stagger space-y-3">
                    {items.map((t) => {
                      const pending = t.approvalStatus === 'pending';
                      return (
                        <li key={t.id}>
                          <article
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(t.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedId(t.id);
                              }
                            }}
                            className={`group cursor-pointer rounded-2xl border border-l-4 border-gray-200 ${col.edge} bg-white p-3.5 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-maroon ${
                              t.id === selectedId ? 'ring-2 ring-maroon' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              {t.image ? (
                                <img src={t.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                              ) : (
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-maroon-light text-maroon">
                                  <MapPin size={20} />
                                </span>
                              )}
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-maroon">{t.item}</h3>
                                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-600">
                                  <User size={11} className="shrink-0 text-gray-400" /> {reporterOf(t)}
                                </p>
                                <p className="flex items-center gap-1 truncate text-[11px] text-gray-500">
                                  <MapPin size={11} className="shrink-0 text-maroon" /> {t.lastFound}
                                </p>
                              </div>
                            </div>

                            <div
                              className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <span className="text-[11px] text-gray-400">
                                {t.date} · {fmtTime(t.time)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {pending ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTicket(t.id)}
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                                  >
                                    <CheckCircle2 size={12} /> Approve
                                  </button>
                                ) : (
                                  <select
                                    value={t.status}
                                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                    aria-label={`Status for ${t.item}`}
                                    className="rounded-full border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-800 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                                  >
                                    {STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTicket(t.id)}
                                  title={pending ? 'Reject / Delete' : 'Delete'}
                                  aria-label={`Delete ${t.item}`}
                                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Ticket details">
          <button type="button" aria-label="Close details" className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <div className="drawer-panel relative ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="roads flex items-start justify-between bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedPending && <PendingPill />}
                  <Pill status={selected.status} />
                </div>
                <h2 className="font-display text-2xl font-bold leading-tight">{selected.item}</h2>
                <p className="mt-1 text-xs text-white/75">Ticket #{selected.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close details"
                className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {selected.image && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <img src={selected.image} alt={selected.item} className="max-h-64 w-full object-contain" />
                </div>
              )}

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Reporter</dt>
                    <dd className="font-semibold text-gray-900">{reporterOf(selected)}</dd>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <MapPin size={16} className="text-maroon" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last found (location)</dt>
                    <dd className="font-semibold text-gray-900">{selected.lastFound}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</dt>
                    <dd className="font-semibold text-gray-900">{selected.date}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <Clock size={16} className="text-gray-400" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</dt>
                    <dd className="font-semibold text-gray-900">{fmtTime(selected.time)}</dd>
                  </div>
                </div>
              </dl>

              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{selected.description}</p>
              </section>

              <HistoryLog history={selected.history} />
            </div>

            {/* Admin controls */}
            <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Admin controls</p>
              <div className="flex flex-wrap items-center gap-3">
                {selectedPending ? (
                  <button
                    type="button"
                    onClick={() => handleApproveTicket(selected.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={16} /> Approve ticket
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <label htmlFor="drawer-status" className="text-xs font-semibold text-gray-700">
                      Status
                    </label>
                    <select
                      id="drawer-status"
                      value={selected.status}
                      onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                      className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteTicket(selected.id)}
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                >
                  <Trash2 size={15} /> {selectedPending ? 'Reject / Delete' : 'Delete ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New ticket drawer */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Add ticket">
          <button type="button" aria-label="Close form" className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <form onSubmit={handleSubmit} className="drawer-panel relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="roads flex items-start justify-between bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light">Staff entry</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Add ticket</h2>
                <p className="mt-1 text-xs text-white/75">Tickets you add are approved automatically.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                aria-label="Close form"
                className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <Step n={1} title="Ticket type">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'Lost', title: 'Lost item', hint: 'Owner is looking', Icon: SearchX, on: 'border-maroon bg-maroon text-white' },
                    { v: 'Found', title: 'Found item', hint: 'Turned in to staff', Icon: HandHeart, on: 'border-emerald-700 bg-emerald-700 text-white' },
                  ].map(({ v, title, hint, Icon, on }) => {
                    const active = form.status === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setForm((f) => ({ ...f, status: v }))}
                        className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
                          active ? `${on} shadow-lg` : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-maroon/40'
                        }`}
                      >
                        <Icon size={22} />
                        <span className="text-sm font-bold leading-tight">{title}</span>
                        <span className={`text-[11px] ${active ? 'text-white/80' : 'text-gray-500'}`}>{hint}</span>
                      </button>
                    );
                  })}
                </div>
              </Step>

              <Step n={2} title="The item">
                <div>
                  <Label htmlFor="admin-item">Item *</Label>
                  <input id="admin-item" type="text" required value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} placeholder="e.g. Scientific Calculator, Umbrella" className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="admin-desc">Description *</Label>
                  <textarea id="admin-desc" rows={3} required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Item description and condition…" className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="admin-image">Photo (optional)</Label>
                  {form.image ? (
                    <div className="relative inline-block">
                      <img src={form.image} alt="Upload preview" className="h-28 w-28 rounded-2xl border border-gray-200 object-cover shadow-sm" />
                      <button
                        type="button"
                        title="Remove image"
                        aria-label="Remove image"
                        onClick={() => {
                          setForm((f) => ({ ...f, image: '' }));
                          const input = document.getElementById('admin-image');
                          if (input) input.value = '';
                        }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="admin-image"
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 transition-colors hover:border-maroon hover:text-maroon"
                    >
                      <Camera size={22} /> Click to add a photo
                    </label>
                  )}
                  <input id="admin-image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                </div>
              </Step>

              <Step n={3} title="Where & when">
                <div>
                  <Label htmlFor="admin-location">Last found (location) *</Label>
                  <input id="admin-location" type="text" required value={form.lastFound} onChange={(e) => setForm((f) => ({ ...f, lastFound: e.target.value }))} placeholder="e.g. Library 3rd Floor" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="admin-date">Date *</Label>
                    <input id="admin-date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <Label htmlFor="admin-time">Time *</Label>
                    <input id="admin-time" type="time" required value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </Step>

              <Step n={4} title="Reporter">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="admin-last">Last name *</Label>
                    <input id="admin-last" type="text" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="e.g. Dela Cruz" className={inputCls} />
                  </div>
                  <div>
                    <Label htmlFor="admin-first">First name *</Label>
                    <input id="admin-first" type="text" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="e.g. Juan A." className={inputCls} />
                  </div>
                </div>
              </Step>
            </div>

            <div className="space-y-3 border-t border-gray-200 bg-white p-4">
              {formError && (
                <p role="alert" className="flex items-center gap-2 rounded-xl border-l-4 border-maroon bg-maroon-light px-3 py-2 text-xs font-medium text-maroon">
                  <AlertCircle size={14} /> {formError}
                </p>
              )}
              {successMessage && (
                <p className="flex items-center gap-2 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 size={14} /> {successMessage}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:bg-maroon-dark disabled:opacity-60">
                  {submitting ? 'Saving ticket…' : 'Publish ticket'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
