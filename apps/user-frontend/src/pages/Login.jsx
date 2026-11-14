// Student login: a wayfinding "map" panel on the left, a clean underline-style form on the right.
import { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, MapPin, Search, Megaphone, CalendarDays } from 'lucide-react';
import logo from '@shared/assets/cit-logo.png';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import CampusMapArt from '../components/CampusMapArt.jsx';

const FEATURES = [
  {
    tag: 'Lost & Found',
    icon: Search,
    headline: (
      <>
        Lost it?
        <br />
        Let&apos;s <span className="text-gold-light">locate</span> it.
      </>
    ),
    description: 'Report misplaced belongings in seconds, search campus recovery tickets, and track the status of your items in real time.',
    badge: 'Item Recovery',
  },
  {
    tag: 'Announcements',
    icon: Megaphone,
    headline: (
      <>
        Stay informed,
        <br />
        never <span className="text-gold-light">miss</span> an update.
      </>
    ),
    description: 'Get immediate official university notices, departmental advisories, and facility announcements from staff.',
    badge: 'Campus Bulletins',
  },
  {
    tag: 'Campus Events',
    icon: CalendarDays,
    headline: (
      <>
        Wildcat life,
        <br />
        happening <span className="text-gold-light">daily</span>.
      </>
    ),
    description: 'Discover upcoming collegiate festivals, org gatherings, academic symposiums, and sports tournaments across CIT-U.',
    badge: 'Activities & Assemblies',
  },
  {
    tag: 'Campus Navigation',
    icon: MapPin,
    headline: (
      <>
        Find your way,
        <br />
        reach <span className="text-gold-light">every</span> hall.
      </>
    ),
    description: 'Interactive building directories and room locator to get to classes, faculty offices, and laboratories on time.',
    badge: 'Interactive Directory',
  },
];

export default function Login() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Auto-switch features every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(id.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const current = FEATURES[activeFeature];
  const CurrentIcon = current.icon;

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.15fr_1fr]">
      {/* Dynamic rotating map panel */}
      <section className="roads relative hidden overflow-hidden bg-gradient-to-br from-maroon via-maroon to-maroon-dark p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-2xl bg-white p-2 shadow-lg transition-transform hover:scale-105">
            <img src={logo} alt="CIT-U logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">CIT University</p>
            <p className="font-display text-lg font-bold">Campus Locate</p>
          </div>
        </div>

        <CampusMapArt className="pointer-events-none absolute left-1/2 top-1/2 w-[135%] max-w-none -translate-x-1/2 -translate-y-[48%] opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon-dark via-transparent to-maroon/60" />

        <div className="relative z-10 max-w-lg">
          {/* Active badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light backdrop-blur">
              <CurrentIcon size={13} className="text-gold-light" />
              {current.badge}
            </span>
          </div>

          {/* Rotating content */}
          <div key={activeFeature} className="fade-in min-h-[210px]">
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
              {current.headline}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85">
              {current.description}
            </p>
          </div>

          {/* Feature switcher & indicators */}
          <div className="mt-8 flex flex-col gap-3">
            {/* Progress indicators */}
            <div className="flex items-center gap-2">
              {FEATURES.map((f, i) => (
                <button
                  key={f.tag}
                  type="button"
                  onClick={() => setActiveFeature(i)}
                  aria-label={`Switch to ${f.tag}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeFeature
                      ? 'w-10 bg-gold-light shadow-[0_0_8px_rgba(242,230,184,0.8)]'
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                0{activeFeature + 1} / 0{FEATURES.length}
              </span>
            </div>

            {/* Quick switcher chips */}
            <ul className="flex flex-wrap gap-2 pt-2 text-xs font-semibold">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const isCurrent = i === activeFeature;
                return (
                  <li key={f.tag}>
                    <button
                      type="button"
                      onClick={() => setActiveFeature(i)}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-300 backdrop-blur ${
                        isCurrent
                          ? 'border border-gold-light/60 bg-white/25 text-white shadow-lg ring-2 ring-gold-light/30'
                          : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      <Icon size={14} className={isCurrent ? 'text-gold-light' : 'text-white/60'} />
                      {f.tag}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="map-grid flex flex-col justify-center bg-surface px-6 py-10 sm:px-14 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Compact brand for small screens (map panel is hidden) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="CIT-U logo" className="h-12 w-12" />
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">CIT University</p>
              <p className="font-display text-xl font-bold text-maroon">Campus Locate</p>
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Welcome back</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-maroon">Sign in</h2>
          <p className="mt-2 text-sm text-gray-500">For students or applicants with an existing account.</p>

          <form onSubmit={submit} className="mt-10 space-y-8">
            <div className="group">
              <label htmlFor="id" className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                {portal.idLabel.replace(/:$/, '')}
              </label>
              <div className="mt-1 flex items-center gap-3 border-b-2 border-gray-300 pb-2 transition-colors focus-within:border-maroon">
                <User size={18} className="text-gray-400 transition-colors group-focus-within:text-maroon" />
                <input
                  id="id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder={portal.idPlaceholder}
                  required
                  autoComplete="username"
                  className="w-full bg-transparent text-base outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="pw" className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Password
              </label>
              <div className="mt-1 flex items-center gap-3 border-b-2 border-gray-300 pb-2 transition-colors focus-within:border-maroon">
                <Lock size={18} className="text-gray-400 transition-colors group-focus-within:text-maroon" />
                <input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent text-base outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="text-gray-400 transition-colors hover:text-maroon"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border-l-4 border-maroon bg-maroon-light px-4 py-3 text-sm font-medium text-maroon">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={busy}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-maroon px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {busy ? 'Signing in…' : 'Login'}
                {!busy && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setId('');
                  setPassword('');
                  setError('');
                }}
                className="w-full rounded-full py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-maroon"
              >
                Clear entries
              </button>
            </div>
          </form>

          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-5 text-sm">
            <p className="text-gray-600">{portal.switchPortal.text}</p>
            <a
              href={portal.switchPortal.url}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold text-maroon hover:underline"
            >
              {portal.switchPortal.label} <ArrowRight size={14} />
            </a>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-gray-500">
            Forgot password?{' '}
            <a href="mailto:admin.campuslocate@cit.edu" className="font-semibold text-maroon hover:underline">
              Click here
            </a>
            <br />
            For inquiries, email{' '}
            <a href="mailto:admin.campuslocate@cit.edu" className="font-semibold text-maroon hover:underline">
              admin.campuslocate@cit.edu
            </a>
          </p>
          <p className="mt-8 text-[11px] text-gray-400">Copyright © 2026 CIT-U Campus Locate</p>
        </div>
      </section>
    </div>
  );
}
