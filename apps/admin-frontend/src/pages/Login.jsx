// Staff login: mirrored layout (form left, map right) with gold "restricted" accents so it feels distinct from the student portal.
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ClipboardList, Megaphone, Users } from 'lucide-react';
import logo from '@shared/assets/cit-logo.png';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import CampusMapArt from '../components/CampusMapArt.jsx';

export default function Login() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.15fr]">
      {/* Form panel */}
      <section className="map-grid flex flex-col justify-center bg-surface px-6 py-10 sm:px-14 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-gray-200">
              <img src={logo} alt="CIT-U logo" className="h-10 w-10" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">CIT University</p>
              <p className="font-display text-xl font-bold text-maroon">Campus Locate</p>
            </div>
          </div>

          <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            <ShieldCheck size={13} /> Staff only
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-maroon">Admin sign in</h2>
          <p className="mt-2 text-sm text-gray-500">Sign in with your staff account to manage Campus Locate.</p>

          <form onSubmit={submit} className="mt-10 space-y-8">
            <div className="group">
              <label htmlFor="id" className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                {portal.idLabel.replace(/:$/, '')}
              </label>
              <div className="mt-1 flex items-center gap-3 border-b-2 border-gray-300 pb-2 transition-colors focus-within:border-gold">
                <Mail size={18} className="text-gray-400 transition-colors group-focus-within:text-gold" />
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
              <div className="mt-1 flex items-center gap-3 border-b-2 border-gray-300 pb-2 transition-colors focus-within:border-gold">
                <Lock size={18} className="text-gray-400 transition-colors group-focus-within:text-gold" />
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
                {busy ? 'Verifying access…' : 'Login'}
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
          <p className="mt-8 text-[11px] text-gray-400">Copyright © 2026 CIT-U Campus Locate · Admin</p>
        </div>
      </section>

      {/* Map panel */}
      <section className="roads relative hidden overflow-hidden bg-gradient-to-bl from-maroon-dark via-maroon to-maroon p-12 text-white border-l border-gold/40 lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 flex items-center justify-end gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-gold-light" /> Control room
        </div>

        <CampusMapArt className="pointer-events-none absolute left-1/2 top-1/2 w-[135%] max-w-none -translate-x-1/2 -translate-y-[48%] opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon-dark via-transparent to-maroon-dark/70" />

        <div className="relative z-10 max-w-lg">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-light/40 bg-gold-light/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-light backdrop-blur">
            <ShieldCheck size={14} className="text-gold-light" /> {portal.title}
          </p>
          <h1 className="font-display text-6xl font-extrabold leading-[0.95] tracking-tight xl:text-7xl">
            Keep the campus
            <br />
            <span className="text-gold-light">findable.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/80">{portal.tagline}</p>

          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-light"><ClipboardList size={17} /></span>
              Approve tickets with a full history log
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-light"><Megaphone size={17} /></span>
              Publish announcements and events
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-light"><Users size={17} /></span>
              Manage students and staff accounts
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
