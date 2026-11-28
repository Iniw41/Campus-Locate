// One board that powers Announcements and Events for both portals.
//  • Student portal: browse + filter; students can also submit events (admin approval required)
//  • Admin portal: post/edit/delete; approve or reject student event submissions
import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Clock,
  Users,
  Building2,
  AlertCircle,
  Inbox,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  CalendarX,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import {
  OFFICES,
  EVENT_TYPES,
  timeStatus,
  occursOn,
  compareBySchedule,
  fmtRange,
  dayMonth,
  audienceLabel,
} from '@shared/src/schedule.js';
import { TimePill, SportsPill, ApprovalPill, PostDetailDrawer } from './PostKit.jsx';
import PostFormDrawer from './PostFormDrawer.jsx';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'finished', label: 'Finished' },
];

const selectCls =
  'rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20';

const edgeByStatus = { upcoming: 'border-l-blue-400', ongoing: 'border-l-emerald-500', finished: 'border-l-gray-300' };

export default function PostBoard({ kind }) {
  const { user } = useAuth();
  const admin = portal.key === 'admin';
  const isEvent = kind === 'event';
  const noun = isEvent ? 'event' : 'announcement';
  const base = `${admin ? '/admin' : '/user'}/${isEvent ? 'events' : 'announcements'}`;
  const canCreate = admin || isEvent; // students may only submit events

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null); // null | { post? }
  const [, setTick] = useState(0);

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [day, setDay] = useState('');
  const [office, setOffice] = useState('all');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [scope, setScope] = useState(isEvent ? (admin ? 'published' : 'all') : 'all');

  // Re-evaluate upcoming/ongoing/finished every minute.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api(base);
        if (mounted) setPosts(data.events || data.announcements || []);
      } catch (err) {
        if (mounted) setLoadError(err.message || `Failed to load ${noun}s.`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [base, noun]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (form) setForm(null);
      else setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [form]);

  /* ---------- scopes (events only) ---------- */
  const isMine = (p) => user?.id && p.createdBy === user.id;
  const scopes = !isEvent
    ? []
    : admin
    ? [
        { key: 'published', label: 'Published', match: (p) => p.approvalStatus === 'approved' },
        { key: 'pending', label: 'Needs approval', match: (p) => p.approvalStatus === 'pending', alert: true },
        { key: 'rejected', label: 'Rejected', match: (p) => p.approvalStatus === 'rejected' },
      ]
    : [
        { key: 'all', label: 'All events', match: (p) => p.approvalStatus === 'approved' },
        { key: 'mine', label: 'My submissions', match: isMine },
      ];
  const activeScope = scopes.find((s) => s.key === scope);

  /* ---------- filtering ---------- */
  const officeOptions = useMemo(
    () => [...new Set([...OFFICES, ...posts.map((p) => p.source).filter(Boolean)])],
    [posts]
  );

  const filteredNoStatus = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeScope && !activeScope.match(p)) return false;
      if (day && !occursOn(p, day)) return false;
      if (!isEvent && office !== 'all' && p.source !== office) return false;
      if (!isEvent && category !== 'all' && p.category !== category) return false;
      if (isEvent && type !== 'all' && p.eventType !== type) return false;
      if (!q) return true;
      return [p.title, p.description, p.venue, p.source, p.organizer, audienceLabel(p)]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, search, day, office, category, type, scope, user]);

  const now = new Date();
  const counts = useMemo(() => {
    const c = { all: filteredNoStatus.length, upcoming: 0, ongoing: 0, finished: 0 };
    filteredNoStatus.forEach((p) => {
      c[timeStatus(p, now)] += 1;
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredNoStatus, now.getMinutes()]);

  const visible = useMemo(
    () =>
      filteredNoStatus
        .filter((p) => statusTab === 'all' || timeStatus(p, now) === statusTab)
        .sort((a, b) => compareBySchedule(a, b, now)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredNoStatus, statusTab, now.getMinutes()]
  );

  const pendingCount = isEvent && admin ? posts.filter((p) => p.approvalStatus === 'pending').length : 0;
  const hasFilters = day || office !== 'all' || category !== 'all' || type !== 'all' || search;
  const clearFilters = () => {
    setDay('');
    setOffice('all');
    setCategory('all');
    setType('all');
    setSearch('');
  };

  const selected = posts.find((p) => p.id === selectedId) || null;
  const tabIndex = STATUS_TABS.findIndex((t) => t.key === statusTab);

  /* ---------- actions ---------- */
  const handleSubmit = async (body) => {
    const editing = form?.post;
    const res = await api(editing ? `${base}/${editing.id}` : base, { method: editing ? 'PUT' : 'POST', body });
    const saved = res.event || res.announcement;
    setPosts((prev) => (editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]));
    if (!editing && isEvent && !admin) setScope('mine'); // so the student sees their pending submission
    return res.message;
  };

  const review = async (id, action) => {
    try {
      const res = await api(`${base}/${id}/${action}`, { method: 'PATCH' });
      setPosts((prev) => prev.map((p) => (p.id === id ? res.event : p)));
    } catch (err) {
      alert(err.message || `Failed to ${action} event.`);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete this ${noun}? This action cannot be undone.`)) return;
    try {
      await api(`${base}/${id}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      alert(err.message || `Failed to delete ${noun}.`);
    }
  };

  const openForm = (post) => {
    setSelectedId(null);
    setForm({ post });
  };

  /* ---------- drawer footer / notice ---------- */
  const adminFooter = (p) => (
    <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Admin controls</p>
      <div className="flex flex-wrap items-center gap-3">
        {isEvent && p.approvalStatus !== 'approved' && (
          <button
            type="button"
            onClick={() => review(p.id, 'approve')}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
          >
            <CheckCircle2 size={16} /> Approve
          </button>
        )}
        {isEvent && p.approvalStatus === 'pending' && (
          <button
            type="button"
            onClick={() => review(p.id, 'reject')}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <XCircle size={16} /> Reject
          </button>
        )}
        <button
          type="button"
          onClick={() => openForm(p)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-maroon hover:text-maroon"
        >
          <Pencil size={15} /> Edit
        </button>
        <button
          type="button"
          onClick={() => remove(p.id)}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </div>
  );

  const noticeFor = (p) => {
    if (!isEvent) return null;
    if (p.approvalStatus === 'pending')
      return admin
        ? `⏳ Submitted by ${p.createdByName || 'a student'}. It stays hidden from the Events page until you approve it.`
        : '⏳ This event is waiting for admin approval before other students can see it.';
    if (p.approvalStatus === 'rejected') return 'This event was not approved by the admin, so it is not shown on the Events page.';
    return null;
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="tablist"
          aria-label="Filter by schedule"
          className="relative grid w-full grid-cols-4 rounded-full border border-gray-200 bg-white p-1 shadow-sm xl:w-[460px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-maroon shadow transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${tabIndex * 100}%)` }}
          />
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusTab(tab.key)}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${noun}s…`}
              aria-label={`Search ${noun}s`}
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            />
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => openForm(null)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">{admin ? `New ${noun}` : 'Submit an event'}</span>
              <span className="sm:hidden">{admin ? 'New' : 'Submit'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {scopes.length > 0 && (
          <div role="tablist" aria-label="Event scope" className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            {scopes.map((s) => {
              const active = scope === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(s.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-maroon text-white shadow' : 'text-gray-600 hover:text-maroon'
                  }`}
                >
                  {s.label}
                  {s.alert && pendingCount > 0 && (
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'}`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
          Date
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            aria-label="Filter by date"
            className="bg-transparent text-xs font-semibold text-gray-800 outline-none"
          />
        </label>

        {isEvent ? (
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by event type" className={selectCls}>
            <option value="all">All event types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <>
            <select value={office} onChange={(e) => setOffice(e.target.value)} aria-label="Filter by source office" className={selectCls}>
              <option value="all">All offices</option>
              {officeOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <div role="group" aria-label="Category" className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              {[
                { k: 'all', l: 'All' },
                { k: 'General', l: 'General' },
                { k: 'Sports', l: 'Sports' },
              ].map(({ k, l }) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={category === k}
                  onClick={() => setCategory(k)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    category === k ? 'bg-maroon text-white shadow' : 'text-gray-600 hover:text-maroon'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="rounded-full px-3 py-1.5 text-xs font-semibold text-maroon transition-colors hover:bg-maroon-light">
            Clear filters
          </button>
        )}
      </div>

      {loadError && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl border-l-4 border-maroon bg-maroon-light px-4 py-3 text-sm font-medium text-maroon">
          <AlertCircle size={16} /> {loadError}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-[2rem] border border-gray-200 bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-gray-500">Loading {noun}s…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[2rem] border border-dashed border-gray-300 bg-white/70 py-16 text-center text-sm text-gray-500">
          {hasFilters || statusTab !== 'all' ? <CalendarX size={30} className="text-gray-400" /> : <Inbox size={30} className="text-gray-400" />}
          <p className="font-semibold text-gray-700">
            {hasFilters || statusTab !== 'all' ? `No ${noun}s match these filters.` : `No ${noun}s yet.`}
          </p>
          {!hasFilters && statusTab === 'all' && canCreate && (
            <p className="text-xs">
              {admin ? `Use “New ${noun}” to post the first one.` : 'Use “Submit an event” to suggest one.'}
            </p>
          )}
        </div>
      ) : (
        <ul className="stagger grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((p) => {
            const s = timeStatus(p, now);
            const { day: d, mon } = dayMonth(p.date);
            const nonApproved = isEvent && p.approvalStatus !== 'approved';
            return (
              <li key={p.id}>
                <article
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(p.id);
                    }
                  }}
                  className={`group flex h-full cursor-pointer flex-col rounded-2xl border border-l-4 border-gray-200 ${
                    nonApproved ? 'border-l-amber-400' : edgeByStatus[s]
                  } bg-white p-4 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-maroon ${
                    s === 'finished' && !nonApproved ? 'opacity-80' : ''
                  }`}
                >
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      loading="lazy"
                      className="mb-3 h-36 w-full rounded-xl border border-gray-100 object-cover"
                    />
                  )}
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-maroon-light">
                      <span className="font-display text-xl font-bold leading-none text-maroon">{d}</span>
                      <span className="text-[9px] font-bold tracking-widest text-gray-500">{mon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        {isEvent && <ApprovalPill status={p.approvalStatus} />}
                        <TimePill post={p} />
                        {!isEvent && p.category === 'Sports' && <SportsPill />}
                        {isEvent && p.eventType && (
                          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            {p.eventType}
                          </span>
                        )}
                      </div>
                      <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-maroon">{p.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600">{p.description}</p>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                    <li className="flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0 text-gray-400" /> {fmtRange(p)}
                    </li>
                    {p.venue && (
                      <li className="flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="shrink-0 text-maroon" /> {p.venue}
                      </li>
                    )}
                    <li className="flex items-center gap-1.5 truncate">
                      <Building2 size={12} className="shrink-0 text-gray-400" /> {isEvent ? p.organizer : p.source}
                    </li>
                    <li className="flex items-center gap-1.5 truncate">
                      <Users size={12} className="shrink-0 text-gray-400" /> {audienceLabel(p)}
                    </li>
                  </ul>

                  {admin && (
                    <div
                      className="mt-3 flex items-center justify-end gap-1.5 border-t border-gray-100 pt-2.5"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {isEvent && p.approvalStatus === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => review(p.id, 'approve')}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => review(p.id, 'reject')}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => openForm(p)}
                        title="Edit"
                        aria-label={`Edit ${p.title}`}
                        className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-maroon"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        title="Delete"
                        aria-label={`Delete ${p.title}`}
                        className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <PostDetailDrawer
          post={selected}
          kind={kind}
          onClose={() => setSelectedId(null)}
          notice={noticeFor(selected)}
          showHistory={admin || (isEvent && isMine(selected))}
          footer={admin ? adminFooter(selected) : null}
        />
      )}

      {form && (
        <PostFormDrawer
          kind={kind}
          post={form.post}
          subtitle={
            admin
              ? `Staff entry — ${noun}s you post are published right away.`
              : 'Your submission is reviewed by an admin before it appears in Events.'
          }
          submitLabel={form.post ? 'Save changes' : admin ? `Publish ${noun}` : 'Submit for approval'}
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
