// Live teller queue shown on both dashboards (student + admin): who is waiting, and what each teller is processing.
// Data is the hardcoded simulation in ../ticketQueue.js, so both portals always show the same thing.
import { useEffect, useMemo, useState } from 'react';
import { Ticket, Hourglass, Users, Inbox } from 'lucide-react';
import { getQueueSnapshot, formatWait, QUEUE_CONFIG } from '../ticketQueue.js';

const SHOWN_IN_QUEUE = 12;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const left = (ms) => (ms < 60000 ? '< 1m left' : `${Math.ceil(ms / 60000)}m left`);

function Stat({ label, value, note, hot }) {
  return (
    <div className={`p-5 ${hot ? 'bg-gold-soft dark:bg-gold/10' : ''}`}>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{label}</h3>
      <p className={`mt-2 whitespace-nowrap font-display text-3xl font-extrabold leading-none tabular-nums sm:text-4xl ${hot ? 'text-maroon' : 'text-gray-900'}`}>{value}</p>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{note}</p>
    </div>
  );
}

function TellerCard({ teller }) {
  const full = teller.busy === QUEUE_CONFIG.seatsPerTeller;
  const badge = full
    ? 'bg-maroon text-white'
    : teller.busy === 0
      ? 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300'
      : 'bg-gold-light text-gold dark:bg-gold/20 dark:text-gold-light';
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-700">{teller.name}</h4>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${badge}`}>
          {teller.busy}/{QUEUE_CONFIG.seatsPerTeller}
        </span>
      </div>
      <ul className="space-y-1.5">
        {teller.seats.map((t, i) =>
          t ? (
            <li key={t.id} className="relative overflow-hidden rounded-xl bg-white px-2.5 pb-2 pt-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-extrabold tabular-nums text-maroon">{t.number}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-gray-600">{t.type}</span>
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-gray-500 dark:text-gray-400">{left(t.remainingMs)}</span>
              </div>
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-maroon/15">
                <span className="block h-full bg-maroon transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, t.progress * 100)}%` }} />
              </span>
            </li>
          ) : (
            <li key={`open-${i}`} className="rounded-xl border border-dashed border-gray-300 px-2.5 py-1.5 text-[11px] text-gray-400">
              Open seat
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default function TicketQueueBoard({ className = '' }) {
  const now = useNow(1000);
  const snap = useMemo(() => getQueueSnapshot(now), [now]);
  const { stats, waiting, tellers, capacity } = snap;
  const shown = waiting.slice(0, SHOWN_IN_QUEUE);

  return (
    <section className={`rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon text-white">
            <Ticket size={20} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">Teller queue</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {QUEUE_CONFIG.tellers} tellers · up to {QUEUE_CONFIG.seatsPerTeller} tickets each at the same time · first come, first served
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live · {new Date(now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>

      {!snap.open && (
        <p className="mb-4 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-gray-700 dark:bg-gold/10">
          The tellers are outside service hours ({snap.hoursLabel}). Anything still in line below is being finished up.
        </p>
      )}

      <div className="mb-5 grid grid-cols-2 divide-x divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 md:grid-cols-4 md:divide-y-0">
        <Stat label="In queue" value={stats.waiting} note={stats.waiting ? 'waiting for a free seat' : 'no one is waiting'} hot={stats.waiting > 0} />
        <Stat label="Processing" value={`${stats.processing}/${capacity}`} note="seats in use right now" />
        <Stat label="Next up" value={stats.nextUp || '—'} note={stats.nextUp ? (waiting[0].waitMs < 60000 ? 'any moment now' : `in ${formatWait(waiting[0].waitMs)}`) : 'a seat is open'} />
        <Stat label="Served today" value={stats.served} note="tickets completed" />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Waiting line */}
        <div className="lg:col-span-5">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            <Hourglass size={14} /> In queue
          </h3>
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 py-10 text-center dark:bg-emerald-500/10">
              <Inbox size={26} className="text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">No one is waiting</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">A teller has a free seat for you.</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {shown.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 ${
                    t.position === 1 ? 'border-gold/40 bg-gold-soft dark:bg-gold/10' : 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold tabular-nums text-gray-500 shadow-sm dark:text-gray-400">
                    {t.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-extrabold tabular-nums text-gray-900">{t.number}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{t.type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold tabular-nums text-gray-700">{formatWait(t.waitMs)}</p>
                    <p className="text-[10px] text-gray-400">est. wait</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {waiting.length > SHOWN_IN_QUEUE && (
            <p className="mt-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">+{waiting.length - SHOWN_IN_QUEUE} more waiting</p>
          )}
        </div>

        {/* Being processed */}
        <div className="lg:col-span-7">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            <Users size={14} /> Being processed
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {tellers.map((teller) => (
              <TellerCard key={teller.id} teller={teller} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
