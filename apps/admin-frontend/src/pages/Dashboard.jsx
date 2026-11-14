// Admin home: a "control room" — one ops strip with live counters, the approval queue,
// a recent-activity feed built from every ticket's history log, and module shortcuts.
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Home,
  Map,
  Search,
  Megaphone,
  CalendarDays,
  Users,
  ClipboardList,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';

const icons = { home: Home, map: Map, search: Search, megaphone: Megaphone, calendar: CalendarDays, users: Users, tickets: ClipboardList };
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function dayMonth(dateStr = '') {
  const [, m, d] = dateStr.split('-');
  if (!m || !d) return { day: '--', mon: '' };
  return { day: String(Number(d)), mon: MONTHS[Number(m) - 1] || '' };
}

const stamp = (log) => {
  const t = Date.parse(`${log.date} ${log.time}`);
  return Number.isNaN(t) ? 0 : t;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api('/admin/lost-and-found');
        if (mounted) setTickets(Array.isArray(data) ? data : data.tickets || []);
      } catch {
        /* dashboard widgets fail quietly */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pending = useMemo(() => tickets.filter((t) => t.approvalStatus === 'pending'), [tickets]);
  const approved = useMemo(() => tickets.filter((t) => t.approvalStatus !== 'pending'), [tickets]);
  const openLost = approved.filter((t) => t.status === 'Lost').length;
  const awaitingClaim = approved.filter((t) => t.status === 'Found').length;

  const activity = useMemo(
    () =>
      tickets
        .flatMap((t) => (t.history || []).map((h) => ({ ...h, item: t.item })))
        .sort((a, b) => stamp(b) - stamp(a))
        .slice(0, 6),
    [tickets]
  );

  const num = (n) => (loading ? '–' : n);

  const cells = [
    { label: 'Total tickets', value: num(tickets.length), note: 'all time' },
    { label: 'Needs approval', value: num(pending.length), note: pending.length ? 'waiting on you' : 'queue is clear', hot: pending.length > 0 },
    { label: 'Open lost', value: num(openLost), note: 'looking for owners' },
    { label: 'Found items', value: num(awaitingClaim), note: 'awaiting a claim' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Welcome back, <strong className="text-gray-900">{user?.name || 'Administrator'}</strong>. Here is what needs your attention today.
      </p>

      {/* Ops strip */}
      <section className="stagger grid grid-cols-2 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm md:grid-cols-4">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={`relative border-gray-200 p-6 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} md:border-r md:last:border-r-0 ${
              c.hot ? 'bg-gold-soft' : ''
            }`}
          >
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              {c.hot && <span className="h-2 w-2 animate-pulse rounded-full bg-maroon" />}
              {c.label}
            </h2>
            <p className={`mt-3 font-display text-5xl font-extrabold leading-none ${c.hot ? 'text-maroon' : 'text-gray-900'}`}>{c.value}</p>
            <p className="mt-2 text-xs text-gray-500">{c.note}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Approval queue */}
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900">Approval queue</h2>
              <p className="text-xs text-gray-500">Student reports waiting for staff verification</p>
            </div>
            <Link to="/lost-and-found" className="inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:underline">
              Open tickets <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">Loading queue…</p>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 py-10 text-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">All clear</p>
              <p className="text-xs text-emerald-700">No tickets are waiting for approval.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pending.slice(0, 5).map((t) => {
                const { day, mon } = dayMonth(t.date);
                return (
                  <li key={t.id} className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-gold-soft/60 p-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="font-display text-xl font-bold leading-none text-maroon">{day}</span>
                      <span className="text-[9px] font-bold tracking-widest text-gray-500">{mon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{t.item}</p>
                      <p className="truncate text-xs text-gray-600">{t.name || `${t.lastName}, ${t.firstName}`}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                        <MapPin size={12} className="shrink-0 text-maroon" /> {t.lastFound}
                      </p>
                    </div>
                    <Link
                      to="/lost-and-found"
                      className="shrink-0 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-maroon-dark"
                    >
                      Review
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6 lg:col-span-5">
          {/* Recent activity */}
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-gray-900">Recent activity</h2>
            <p className="mb-5 text-xs text-gray-500">Pulled from every ticket&apos;s history log</p>
            {activity.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">{loading ? 'Loading…' : 'No activity yet.'}</p>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-gray-200 pl-5">
                {activity.map((a, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-maroon ring-2 ring-maroon/30" />
                    <p className="text-sm font-semibold text-gray-900">{a.action}</p>
                    <p className="text-xs text-gray-600">
                      {a.item} · by <span className="font-medium">{a.name}</span>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {a.date} · {a.time}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Modules */}
          <section className="rounded-[2rem] border border-gray-200 bg-white p-3 shadow-sm">
            <h2 className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Modules</h2>
            <ul>
              {portal.nav.slice(1).map(({ label, path, icon }) => {
                const Icon = icons[icon] || Home;
                return (
                  <li key={path}>
                    <Link
                      to={path}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-maroon-light/60"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-light text-maroon"><Icon size={18} /></span>
                      <span className="flex-1 text-sm font-semibold text-gray-900">{label}</span>
                      <ChevronRight size={16} className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-maroon" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
