// Slide-in, step-by-step form for creating/editing an announcement or an event.
import { useState, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, Plus, Camera } from 'lucide-react';
import { prepareImage } from '@shared/src/image.js';
import {
  OFFICES,
  EVENT_TYPES,
  ANNOUNCEMENT_CATEGORIES,
  toMinutes,
  fromMinutes,
} from '@shared/src/schedule.js';

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-field px-3.5 py-2.5 text-sm outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20';

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

const blank = (kind) => ({
  title: '',
  description: '',
  source: '',
  category: 'General',
  organizer: '',
  eventType: 'Campus',
  date: '',
  time: '',
  durationValue: '',
  durationUnit: kind === 'event' ? 'hours' : 'minutes',
  venue: '',
  audienceType: 'everyone',
  audienceTargets: [],
  image: '',
});

function fromPost(post) {
  const { value, unit } = fromMinutes(post.durationMinutes);
  return {
    title: post.title,
    description: post.description,
    source: post.source || '',
    category: post.category || 'General',
    organizer: post.organizer || '',
    eventType: post.eventType || 'Campus',
    date: post.date,
    time: post.time,
    durationValue: value,
    durationUnit: unit,
    venue: post.venue || '',
    audienceType: post.audienceType || 'everyone',
    audienceTargets: post.audienceTargets || [],
    image: post.image || '',
  };
}

/**
 * Props: kind ('announcement' | 'event'), post (when editing), subtitle, submitLabel,
 * onSubmit(body) -> Promise<string | void> (resolve with a success message), onClose.
 */
export default function PostFormDrawer({ kind, post, subtitle, submitLabel, onSubmit, onClose }) {
  const isEvent = kind === 'event';
  const [form, setForm] = useState(post ? fromPost(post) : blank(kind));
  const [targetInput, setTargetInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setImageBusy(true);
    try {
      const image = await prepareImage(file);
      setForm((f) => ({ ...f, image }));
    } catch (err) {
      setError(err.message || 'Could not add that picture.');
    } finally {
      setImageBusy(false);
      e.target.value = ''; // lets the same file be picked again after removing it
    }
  };

  const addTargets = () => {
    const incoming = targetInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (!incoming.length) return;
    setForm((f) => ({ ...f, audienceTargets: [...new Set([...f.audienceTargets, ...incoming])] }));
    setTargetInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pendingTargets = targetInput.split(',').map((s) => s.trim()).filter(Boolean);
    const targets = [...new Set([...form.audienceTargets, ...pendingTargets])];

    if (!form.title.trim() || !form.description.trim() || !form.date || !form.time) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isEvent && (!form.organizer.trim() || !form.venue.trim())) {
      setError('Organizer and venue are required for events.');
      return;
    }
    if (!isEvent && !form.source.trim()) {
      setError('Please choose the source office.');
      return;
    }
    const durationMinutes = toMinutes(form.durationValue, form.durationUnit);
    if (isEvent && durationMinutes <= 0) {
      setError('Please set how long the event will run.');
      return;
    }
    if (form.audienceType === 'specific' && targets.length === 0) {
      setError('Add at least one person or group, or switch to Everyone.');
      return;
    }

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      durationMinutes,
      venue: form.venue.trim(),
      audienceType: form.audienceType,
      audienceTargets: form.audienceType === 'specific' ? targets : [],
      image: form.image || null,
      ...(isEvent
        ? { organizer: form.organizer.trim(), eventType: form.eventType }
        : { source: form.source.trim(), category: form.category }),
    };

    setSubmitting(true);
    try {
      const message = await onSubmit(body);
      setSuccess(message || 'Saved.');
      setTimeout(onClose, 1400);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const noun = isEvent ? 'event' : 'announcement';

  return (
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-label={`${post ? 'Edit' : 'New'} ${noun}`}>
      <button type="button" aria-label="Close form" className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="drawer-panel relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="roads flex items-start justify-between bg-gradient-to-br from-maroon to-maroon-dark p-6 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light">
              {isEvent ? 'Event' : 'Announcement'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">{post ? `Edit ${noun}` : `New ${noun}`}</h2>
            {subtitle && <p className="mt-1 text-xs text-white/75">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <Step n={1} title="The basics">
            <div>
              <Label htmlFor="post-title">Title *</Label>
              <input id="post-title" type="text" required value={form.title} onChange={set('title')} placeholder={isEvent ? 'e.g. Intramurals Opening Ceremony' : 'e.g. Enrollment extended until Friday'} className={inputCls} />
            </div>
            <div>
              <Label htmlFor="post-desc">Description *</Label>
              <textarea id="post-desc" rows={4} required value={form.description} onChange={set('description')} placeholder={isEvent ? 'What is the event about?' : 'Write the announcement…'} className={inputCls} />
            </div>

            {isEvent ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="post-type">Event type</Label>
                  <select id="post-type" value={form.eventType} onChange={set('eventType')} className={inputCls}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="post-organizer">Organizer *</Label>
                  <input id="post-organizer" type="text" required value={form.organizer} onChange={set('organizer')} placeholder="Org / office / dept." className={inputCls} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="post-source">Source office *</Label>
                  <select id="post-source" required value={form.source} onChange={set('source')} className={inputCls}>
                    <option value="" disabled>Select office…</option>
                    {OFFICES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="post-category">Category</Label>
                  <select id="post-category" value={form.category} onChange={set('category')} className={inputCls}>
                    {ANNOUNCEMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c === 'Sports' ? 'Sports announcement' : 'General'}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="post-image">{isEvent ? 'Poster or photo (optional)' : 'Picture (optional)'}</Label>
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="Selected picture preview" className="max-h-56 w-full rounded-2xl border border-gray-200 bg-gray-50 object-contain shadow-sm" />
                  <button
                    type="button"
                    title="Remove picture"
                    aria-label="Remove picture"
                    onClick={() => setForm((f) => ({ ...f, image: '' }))}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                  >
                    <X size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-maroon hover:underline"
                  >
                    Replace picture
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="post-image"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 transition-colors hover:border-maroon hover:text-maroon"
                >
                  {imageBusy ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
                  ) : (
                    <Camera size={22} />
                  )}
                  {imageBusy ? 'Preparing picture…' : 'Tap to add a picture'}
                  <span className="text-[11px] text-gray-400">A poster, flyer or photo helps people understand the {noun} at a glance.</span>
                </label>
              )}
              <input ref={fileRef} id="post-image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            </div>
          </Step>

          <Step n={2} title="Date, time & venue">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="post-date">Date *</Label>
                <input id="post-date" type="date" required value={form.date} onChange={set('date')} className={inputCls} />
              </div>
              <div>
                <Label htmlFor="post-time">Time *</Label>
                <input id="post-time" type="time" required value={form.time} onChange={set('time')} className={inputCls} />
              </div>
            </div>
            <div>
              <Label htmlFor="post-duration">Duration {isEvent ? '*' : '(optional)'}</Label>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input id="post-duration" type="number" min="0" step="any" value={form.durationValue} onChange={set('durationValue')} placeholder={isEvent ? 'e.g. 3' : 'Leave empty for all day'} className={inputCls} />
                <select aria-label="Duration unit" value={form.durationUnit} onChange={set('durationUnit')} className={inputCls}>
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="post-venue">Venue {isEvent ? '*' : '(optional)'}</Label>
              <input id="post-venue" type="text" required={isEvent} value={form.venue} onChange={set('venue')} placeholder="e.g. University Gymnasium" className={inputCls} />
            </div>
          </Step>

          <Step n={3} title="Who is it for?">
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'everyone', title: 'Everyone', hint: 'All students & staff' },
                { v: 'specific', title: 'Specific people', hint: 'Groups or individuals' },
              ].map(({ v, title, hint }) => {
                const active = form.audienceType === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForm((f) => ({ ...f, audienceType: v }))}
                    className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all ${
                      active ? 'border-maroon bg-maroon text-white shadow-lg' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-maroon/40'
                    }`}
                  >
                    <span className="text-sm font-bold leading-tight">{title}</span>
                    <span className={`text-[11px] ${active ? 'text-white/80' : 'text-gray-500'}`}>{hint}</span>
                  </button>
                );
              })}
            </div>

            {form.audienceType === 'specific' && (
              <div className="space-y-2">
                <Label htmlFor="post-targets">Add people or groups</Label>
                <div className="flex gap-2">
                  <input
                    id="post-targets"
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTargets();
                      }
                    }}
                    placeholder="e.g. BSIT 2nd year, Faculty, Juan Dela Cruz"
                    className={inputCls}
                  />
                  <button type="button" onClick={addTargets} aria-label="Add" className="shrink-0 rounded-xl bg-maroon px-3 text-white transition-colors hover:bg-maroon-dark">
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">Press Enter or use commas to add several at once.</p>
                {form.audienceTargets.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {form.audienceTargets.map((t) => (
                      <li key={t} className="flex items-center gap-1 rounded-full bg-maroon-light py-1 pl-3 pr-1.5 text-xs font-semibold text-maroon">
                        {t}
                        <button
                          type="button"
                          aria-label={`Remove ${t}`}
                          onClick={() => setForm((f) => ({ ...f, audienceTargets: f.audienceTargets.filter((x) => x !== t) }))}
                          className="rounded-full p-0.5 transition-colors hover:bg-maroon/20"
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Step>
        </div>

        <div className="space-y-3 border-t border-gray-200 bg-white p-4">
          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border-l-4 border-maroon bg-maroon-light px-3 py-2 text-xs font-medium text-maroon">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 size={14} /> {success}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" disabled={submitting || imageBusy || !!success} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:bg-maroon-dark disabled:opacity-60">
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
