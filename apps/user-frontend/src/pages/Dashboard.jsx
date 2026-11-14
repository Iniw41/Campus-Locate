// Student home: a "bento" grid — big greeting tile with the animated campus map, live board counters,
// the student's own reports, latest items and quick services.
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, Clock, MapPin, Search, Map, Megaphone, CalendarDays, HandHeart, Inbox } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import CampusMapArt from '../components/CampusMapArt.jsx';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function dayMonth(dateStr = '') {
  const [, m, d] = dateStr.split('-');
  if (!m || !d) return { day: '--', mon: '' };
  return { day: String(Number(d)), mon: MONTHS[Number(m) - 1] || '' };
}

const greeting = (h) => (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');

const pill = {
  Lost: 'bg-maroon-light text-maroon',
  Found: 'bg-emerald-100 text-emerald-800',
  Claimed: 'bg-blue-100 text-blue-800',
  Resolved: 'bg-purple-100 text-purple-800',
  Returned: 'bg-teal-100 text-teal-800',
};

const services = [
  { to: '/navigation', label: 'Campus Navigation', text: 'Rooms, offices and buildings', Icon: Map },
  { to: '/announcements', label: 'Announcements', text: 'Notices from the university', Icon: Megaphone },
  { to: '/events', label: 'Events', text: 'What is happening on campus', Icon: CalendarDays },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api('/user/lost-and-found');
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

  const raw = user?.name || '';
  const first = (raw.includes(',') ? raw.split(',')[1] : raw).trim().split(' ')[0] || 'Wildcat';

  const stats = useMemo(() => {
    const approved = tickets.filter((t) => t.approvalStatus !== 'pending');
    const mine = tickets.filter((t) => user?.id && t.createdBy === user.id);
    return {
      lost: approved.filter((t) => t.status === 'Lost').length,
      found: approved.filter((t) => t.status === 'Found').length,
      mine: mine.length,
      minePending: mine.filter((t) => t.approvalStatus === 'pending').length,
    };
  }, [tickets, user]);

  const total = stats.lost + stats.found;
  const lostPct = total ? Math.round((stats.lost / total) * 100) : 50;
  const recent = tickets.slice(0, 4);

  return (
    <div className="stagger grid grid-cols-1 gap-5 md:grid-cols-6">
      {/* Greeting + map */}
      <section className="roads relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-maroon to-maroon-dark p-7 text-white shadow-xl sm:p-9 md:col-span-4 md:row-span-2">
        <CampusMapArt className="pointer-events-none absolute -right-20 -top-2 w-[125%] max-w-none opacity-60 md:-right-28 md:w-[100%]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-maroon-dark via-maroon/70 to-transparent" />
        <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between gap-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-gold-light backdrop-blur">
              <Clock size={13} />
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">
              {greeting(now.getHours())},
              <br />
              <span className="text-gold-light">{first}.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
              Lost something on campus, or found something that is not yours? Put it on the board and let it find its way home.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/lost-and-found"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-maroon shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Plus size={16} /> Report an item
            </Link>
            <Link
              to="/lost-and-found"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Browse the board <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Board counters */}
      <Link
        to="/lost-and-found"
        className="group flex flex-col justify-between rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:col-span-2"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">On the board</h3>
          <ArrowUpRight size={18} className="text-gray-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-maroon" />
        </div>
        <div className="my-6 flex items-end gap-8">
          <div>
            <p className="font-display text-6xl font-extrabold leading-none text-maroon">{loading ? '–' : stats.lost}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">Looking for owners</p>
          </div>
          <div>
            <p className="font-display text-6xl font-extrabold leading-none text-emerald-700">{loading ? '–' : stats.found}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">Waiting to be claimed</p>
          </div>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-emerald-200" role="img" aria-label={`${lostPct}% lost, ${100 - lostPct}% found`}>
          <span className="bg-maroon transition-all duration-700" style={{ width: `${lostPct}%` }} />
        </div>
      </Link>

      {/* My reports */}
      <Link
        to="/lost-and-found"
        className="group flex flex-col justify-between rounded-[2rem] border border-gold/30 bg-gold-soft p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:col-span-2"
      >
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">My reports</h3>
        <div className="my-4 flex items-end gap-3">
          <p className="font-display text-6xl font-extrabold leading-none text-gray-900">{loading ? '–' : stats.mine}</p>
          <p className="pb-1 text-xs font-semibold text-gray-600">
            {stats.minePending > 0 ? `${stats.minePending} awaiting approval` : 'all approved'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-maroon">
          View my tickets <ArrowUpRight size={14} />
        </span>
      </Link>

      {/* Latest on the board */}
      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-gray-900">Latest on the board</h3>
          <Link to="/lost-and-found" className="text-xs font-semibold text-maroon hover:underline">
            See all
          </Link>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
            <Inbox size={26} className="text-gray-400" />
            Nothing reported yet.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {recent.map((t) => {
              const { day, mon } = dayMonth(t.date);
              return (
                <li key={t.id}>
                  <Link
                    to="/lost-and-found"
                    className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-maroon/30 hover:bg-maroon-light/50"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="font-display text-xl font-bold leading-none text-maroon">{day}</span>
                      <span className="text-[9px] font-bold tracking-widest text-gray-500">{mon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{t.item}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                        <MapPin size={12} className="shrink-0 text-maroon" /> {t.lastFound}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${pill[t.status] || 'bg-gray-100 text-gray-700'}`}>
                      {t.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Services */}
      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:col-span-3">
        <h3 className="mb-4 font-display text-lg font-bold text-gray-900">Campus services</h3>
        <ul className="space-y-2.5">
          <li>
            <Link
              to="/lost-and-found"
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-maroon/30 hover:bg-maroon-light/50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon text-white"><Search size={19} /></span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">Lost and Found</span>
                <span className="block text-xs text-gray-500">Report or recover belongings</span>
              </span>
              <ArrowUpRight size={16} className="text-gray-400 transition-colors group-hover:text-maroon" />
            </Link>
          </li>
          {services.map(({ to, label, text, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-maroon/30 hover:bg-maroon-light/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-light text-maroon"><Icon size={19} /></span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{label}</span>
                  <span className="block text-xs text-gray-500">{text}</span>
                </span>
                <span className="rounded-full bg-gold-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">Soon</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Honesty tip */}
      <section className="flex flex-col items-start gap-4 rounded-[2rem] bg-maroon-light p-6 sm:flex-row sm:items-center sm:justify-between md:col-span-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon text-white"><HandHeart size={22} /></span>
          <div>
            <h3 className="font-display text-lg font-bold text-maroon">Found something? Be a good Wildcat.</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-700">
              Post it on the board, then hand it to the nearest security post or the Student Affairs Office so its owner can pick it up.
            </p>
          </div>
        </div>
        <Link
          to="/lost-and-found"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-maroon px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-maroon-dark"
        >
          Report a found item <ArrowUpRight size={15} />
        </Link>
      </section>
    </div>
  );
}
