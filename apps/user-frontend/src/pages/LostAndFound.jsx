// Student Lost & Found — a bulletin board.
//  • Ticket-stub cards (date stub + perforated edge) instead of plain cards
//  • Sticky detail panel with a timeline History Log (bottom sheet on mobile)
//  • "Report an item" opens a numbered, step-by-step slide-in drawer
import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  User,
  X,
  History,
  AlertCircle,
  CheckCircle2,
  Camera,
  SearchX,
  HandHeart,
} from 'lucide-react';

const statusBadgeStyles = {
  Lost: 'bg-maroon-light text-maroon border border-maroon/20',
  Found: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Claimed: 'bg-blue-100 text-blue-800 border border-blue-200',
  Resolved: 'bg-purple-100 text-purple-800 border border-purple-200',
  Returned: 'bg-teal-100 text-teal-800 border border-teal-200',
};

const stubTone = {
  Lost: { bg: 'bg-maroon-light', num: 'text-maroon' },
  Found: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', num: 'text-emerald-700 dark:text-emerald-400' },
  Claimed: { bg: 'bg-blue-50 dark:bg-blue-950/40', num: 'text-blue-700 dark:text-blue-400' },
  Resolved: { bg: 'bg-purple-50 dark:bg-purple-950/40', num: 'text-purple-700 dark:text-purple-400' },
  Returned: { bg: 'bg-teal-50 dark:bg-teal-950/40', num: 'text-teal-700 dark:text-teal-400' },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'Lost', label: 'Lost' },
  { key: 'Found', label: 'Found' },
  { key: 'my', label: 'My reports' },
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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

function dayMonth(dateStr = '') {
  const [, m, d] = dateStr.split('-');
  if (!m || !d) return { day: '--', mon: '' };
  return { day: String(Number(d)), mon: MONTHS[Number(m) - 1] || '' };
}

function fmtTime(t = '') {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

function Pill({ status, className = '' }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        statusBadgeStyles[status] || 'bg-gray-100 text-gray-800'
      } ${className}`}
    >
      {status}
    </span>
  );
}

function PendingPill({ children = 'Pending approval' }) {
  return (
    <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
      {children}
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

/* ---------- Ticket detail panel ---------- */
function TicketDetail({ ticket, onClose }) {
  const pending = ticket.approvalStatus === 'pending';
  const reporter = ticket.lastName ? `${ticket.lastName}, ${ticket.firstName}` : ticket.name;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg">
      <div className="map-grid relative h-52 bg-maroon-light">
        {ticket.image ? (
          <img src={ticket.image} alt={ticket.item} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-maroon/50">
            <MapPin size={44} />
            <span className="text-xs font-semibold">No photo provided</span>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          {pending && <PendingPill>Pending admin approval</PendingPill>}
          <Pill status={ticket.status} className="shadow-sm" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition-colors hover:bg-white hover:text-maroon"
        >
          <X size={17} />
        </button>
      </div>

      <div className="space-y-6 p-6">
        <h2 className="font-display text-3xl font-bold leading-tight text-gray-900">{ticket.item}</h2>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
            <User size={16} className="text-gray-400" />
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Reporter</dt>
              <dd className="font-semibold text-gray-900">{reporter}</dd>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
            <MapPin size={16} className="text-maroon" />
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last found (location)</dt>
              <dd className="font-semibold text-gray-900">{ticket.lastFound}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</dt>
              <dd className="font-semibold text-gray-900">{ticket.date}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
            <Clock size={16} className="text-gray-400" />
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</dt>
              <dd className="font-semibold text-gray-900">{fmtTime(ticket.time)}</dd>
            </div>
          </div>
        </dl>

        <section>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Description</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{ticket.description}</p>
        </section>

        <HistoryLog history={ticket.history} />

        {pending && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            ⏳ This ticket is waiting for admin approval before other students can see it.
          </p>
        )}
      </div>
    </article>
  );
}

/* ---------- Numbered step wrapper for the drawer form ---------- */
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
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

  // Esc closes whatever is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) setDrawerOpen(false);
      else setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const isMine = (t) =>
    (user?.id && t.createdBy === user.id) ||
    (user?.name && t.name?.toLowerCase().includes(user.name.toLowerCase()));

  const counts = useMemo(
    () => ({
      all: tickets.length,
      Lost: tickets.filter((t) => t.status === 'Lost').length,
      Found: tickets.filter((t) => t.status === 'Found').length,
      my: tickets.filter(isMine).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickets, user]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tickets.filter((t) => {
      const matches =
        t.item.toLowerCase().includes(q) ||
        t.lastFound?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q);
      if (!matches) return false;
      if (activeTab === 'Lost') return t.status === 'Lost';
      if (activeTab === 'Found') return t.status === 'Found';
      if (activeTab === 'my') return isMine(t);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, searchQuery, activeTab, user]);

  const selected = tickets.find((t) => t.id === selectedId) || null;
  const tabIndex = TABS.findIndex((t) => t.key === activeTab);

  const openDrawer = () => {
    setFormError('');
    setSuccessMessage('');
    setDrawerOpen(true);
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
      setSuccessMessage(res.message || 'Ticket submitted successfully! It will appear once approved by an admin.');
      setForm(emptyForm);

      setTimeout(() => {
        setDrawerOpen(false);
        setSuccessMessage('');
        setSelectedId(newTicket.id);
      }, 1600);
    } catch (err) {
      setFormError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="tablist"
          aria-label="Filter tickets"
          className="relative grid w-full grid-cols-4 rounded-full border border-gray-200 bg-white p-1 shadow-sm xl:w-[460px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-maroon shadow transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${tabIndex * 100}%)` }}
          />
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={`relative z-10 rounded-full px-2 py-2 text-xs font-semibold transition-colors ${
                  active ? 'text-white' : 'text-gray-600 hover:text-maroon'
                }`}
              >
                {tab.label} <span className="ml-0.5 opacity-70">{counts[tab.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 items-center gap-3 xl:max-w-xl">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item, place or keyword…"
              aria-label="Search tickets"
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            />
          </div>
          <button
            type="button"
            onClick={openDrawer}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark"
          >
            <Plus size={17} /> <span className="hidden sm:inline">Report an item</span>
            <span className="sm:hidden">Report</span>
          </button>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl border-l-4 border-maroon bg-maroon-light px-4 py-3 text-sm font-medium text-maroon">
          <AlertCircle size={16} /> {loadError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Board */}
        <section aria-label="Tickets">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-[2rem] border border-gray-200 bg-white">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
              <p className="mt-3 text-sm font-medium text-gray-500">Loading the board…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-300 bg-white/70 p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon-light text-maroon">
                <SearchX size={28} />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-gray-900">Nothing here yet</h3>
              <p className="mt-1 max-w-xs text-sm text-gray-500">
                {searchQuery ? `No tickets match “${searchQuery}”.` : 'No items under this filter. Be the first to post one.'}
              </p>
              <button
                type="button"
                onClick={openDrawer}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-maroon-dark"
              >
                <Plus size={16} /> Report an item
              </button>
            </div>
          ) : (
            <ul className="stagger space-y-4">
              {filtered.map((t) => {
                const tone = stubTone[t.status] || { bg: 'bg-gray-100', num: 'text-gray-700' };
                const { day, mon } = dayMonth(t.date);
                const active = t.id === selectedId;
                const pending = t.approvalStatus === 'pending';
                return (
                  <li key={t.id} className="stub-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      aria-pressed={active}
                      className="stub flex w-full overflow-hidden rounded-2xl bg-white text-left"
                    >
                      <div className={`flex w-[92px] shrink-0 flex-col items-center justify-center gap-0.5 py-5 ${tone.bg}`}>
                        <span className={`font-display text-4xl font-extrabold leading-none ${tone.num}`}>{day}</span>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-gray-500">{mon}</span>
                        <span className="mt-2 text-[11px] font-semibold text-gray-600">{fmtTime(t.time)}</span>
                      </div>

                      <div
                        className={`min-w-0 flex-1 border-l-2 border-dashed border-gray-300 p-4 pl-5 transition-colors ${
                          active ? 'bg-maroon-light/50' : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className={`min-w-0 truncate font-display text-lg font-bold ${active ? 'text-maroon' : 'text-gray-900'}`}>
                            {t.item}
                          </h3>
                          {pending ? <PendingPill /> : <Pill status={t.status} />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{t.description}</p>
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <MapPin size={13} className="shrink-0 text-maroon" /> <span className="truncate">{t.lastFound}</span>
                        </p>
                      </div>

                      {t.image && <img src={t.image} alt="" className="hidden w-24 shrink-0 object-cover sm:block" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Detail panel (desktop) */}
        <aside className="hidden lg:block" aria-label="Ticket details">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[2rem]">
            {selected ? (
              <TicketDetail key={selected.id} ticket={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-300 bg-white/70 p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon-light text-maroon">
                  <MapPin size={28} />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-gray-900">Pick a ticket</h3>
                <p className="mt-1 max-w-[240px] text-sm text-gray-500">
                  Select any ticket to see the photo, details and its full history log.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Detail sheet (mobile / tablet) */}
      {selected && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Ticket details">
          <button type="button" aria-label="Close details" className="fade-in absolute inset-0 bg-black/50" onClick={() => setSelectedId(null)} />
          <div className="sheet-panel absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[2rem] bg-surface">
            <TicketDetail key={selected.id} ticket={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      {/* Report drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Report an item">
          <button type="button" aria-label="Close form" className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="drawer-panel relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="roads flex items-start justify-between bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light">New ticket</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Report an item</h2>
                <p className="mt-1 text-xs text-white/75">Four quick steps. Admins approve it before others see it.</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close form"
                className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <Step n={1} title="What happened?">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'Lost', title: 'I lost something', hint: 'Help me find it', Icon: SearchX, on: 'border-maroon bg-maroon text-white' },
                    { v: 'Found', title: 'I found something', hint: 'Help me return it', Icon: HandHeart, on: 'border-emerald-700 bg-emerald-700 text-white' },
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
                  <Label htmlFor="report-item">Item *</Label>
                  <input id="report-item" type="text" required value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} placeholder="e.g. Scientific Calculator, Umbrella" className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="report-desc">Description *</Label>
                  <textarea id="report-desc" rows={3} required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Color, brand, stickers, scratches or any marks…" className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="report-image">Photo (optional)</Label>
                  {form.image ? (
                    <div className="relative inline-block">
                      <img src={form.image} alt="Upload preview" className="h-28 w-28 rounded-2xl border border-gray-200 object-cover shadow-sm" />
                      <button
                        type="button"
                        title="Remove image"
                        aria-label="Remove image"
                        onClick={() => {
                          setForm((f) => ({ ...f, image: '' }));
                          const input = document.getElementById('report-image');
                          if (input) input.value = '';
                        }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="report-image"
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 transition-colors hover:border-maroon hover:text-maroon"
                    >
                      <Camera size={22} /> Tap to add a photo
                    </label>
                  )}
                  <input id="report-image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                </div>
              </Step>

              <Step n={3} title="Where & when">
                <div>
                  <Label htmlFor="report-location">Last found (location) *</Label>
                  <input id="report-location" type="text" required value={form.lastFound} onChange={(e) => setForm((f) => ({ ...f, lastFound: e.target.value }))} placeholder="e.g. Library 3rd Floor, Main Canteen" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="report-date">Date *</Label>
                    <input id="report-date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <Label htmlFor="report-time">Time *</Label>
                    <input id="report-time" type="time" required value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </Step>

              <Step n={4} title="Your details">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="report-last">Last name *</Label>
                    <input id="report-last" type="text" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="e.g. Dela Cruz" className={inputCls} />
                  </div>
                  <div>
                    <Label htmlFor="report-first">First name *</Label>
                    <input id="report-first" type="text" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="e.g. Juan A." className={inputCls} />
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
                <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:bg-maroon-dark disabled:opacity-60">
                  {submitting ? 'Saving ticket…' : 'Submit ticket'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
