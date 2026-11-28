// Building blocks shared by the Announcements and Events pages (pills + the read-only detail drawer).
import { X, Calendar, Clock, Timer, MapPin, Users, Building2, Tag, History } from 'lucide-react';
import { timeStatus, fmtDate, fmtRange, fmtDuration, audienceLabel } from '@shared/src/schedule.js';

const TIME_STYLES = {
  upcoming: 'bg-blue-100 text-blue-800 border border-blue-200',
  ongoing: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  finished: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const pillBase = 'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider';

export function TimePill({ post, className = '' }) {
  const s = timeStatus(post);
  return <span className={`${pillBase} ${TIME_STYLES[s]} ${className}`}>{s}</span>;
}

export function SportsPill() {
  return <span className={`${pillBase} border border-gold/30 bg-gold-soft text-gold`}>Sports</span>;
}

export function ApprovalPill({ status }) {
  if (status === 'pending')
    return <span className={`${pillBase} border border-amber-300 bg-amber-100 text-amber-800`}>Pending approval</span>;
  if (status === 'rejected')
    return <span className={`${pillBase} border border-red-200 bg-red-100 text-red-700`}>Rejected</span>;
  return null;
}

function Info({ Icon, label, children, wide, iconClass = 'text-gray-400' }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-gray-50 p-3 ${wide ? 'col-span-2' : ''}`}>
      <Icon size={16} className={`shrink-0 ${iconClass}`} />
      <div className="min-w-0">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
        <dd className="break-words font-semibold text-gray-900">{children}</dd>
      </div>
    </div>
  );
}

function HistoryLog({ history }) {
  if (!history?.length) return null;
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
        <History size={14} className="text-maroon" /> History Log
      </h3>
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
    </section>
  );
}

// kind: 'announcement' | 'event'. `footer` is where admin controls go. `notice` is an optional banner (e.g. "waiting for approval").
export function PostDetailDrawer({ post, kind, onClose, footer, notice, showHistory = false }) {
  const isEvent = kind === 'event';
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={isEvent ? 'Event details' : 'Announcement details'}>
      <button type="button" aria-label="Close details" className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-panel relative ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="roads flex items-start justify-between bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {isEvent && <ApprovalPill status={post.approvalStatus} />}
              <TimePill post={post} />
              {!isEvent && post.category === 'Sports' && <SportsPill />}
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight">{post.title}</h2>
            <p className="mt-1 text-xs text-white/75">
              {isEvent ? `Hosted by ${post.organizer}` : `From ${post.source}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {notice && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {notice}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <Info Icon={Calendar} label="Date" wide>{fmtDate(post.date)}</Info>
            <Info Icon={Clock} label="Time">{fmtRange(post)}</Info>
            <Info Icon={Timer} label="Duration">{fmtDuration(post.durationMinutes)}</Info>
            <Info Icon={MapPin} label="Venue" wide iconClass="text-maroon">{post.venue || 'Not specified'}</Info>
            <Info Icon={Users} label="For who" wide>{audienceLabel(post)}</Info>
            {isEvent ? (
              <>
                <Info Icon={Building2} label="Organizer">{post.organizer}</Info>
                <Info Icon={Tag} label="Event type">{post.eventType}</Info>
              </>
            ) : (
              <>
                <Info Icon={Building2} label="Source office">{post.source}</Info>
                <Info Icon={Tag} label="Category">{post.category}</Info>
              </>
            )}
          </dl>

          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{post.description}</p>
          </section>

          {showHistory && <HistoryLog history={post.history} />}
        </div>

        {footer}
      </div>
    </div>
  );
}
