// Login page, deliberately mirrors the WITS student portal so students feel at home.
import { useState } from 'react';
import logo from '@shared/assets/cit-logo.png';
import backdrop from '@shared/assets/login-backdrop.png';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';

export default function Login() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(id.trim(), password); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 pt-16">
      <div className="mb-4 flex items-center gap-3 text-maroon">
        <img src={logo} alt="CIT-U logo" className="h-24 w-24" />
        <div className="text-xl font-medium leading-tight"><p>CIT University</p><p>Campus Locate</p></div>
      </div>

      <div className="relative grid w-full max-w-[970px] overflow-hidden rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgba(0,0,0,0.18)] md:grid-cols-[1.45fr_1fr] md:gap-10">
        <img src={backdrop} alt="" className="pointer-events-none absolute -left-10 top-0 h-full w-[60%] object-cover opacity-20" />

        {/* Left panel */}
        <section className="relative flex min-h-[380px] flex-col justify-end rounded-2xl border border-gray-200 p-8">
          <h1 className="text-5xl font-medium text-maroon">CAMPUS LOCATE</h1>
          <p className="text-xl font-medium text-gray-600">{portal.title}</p>
          <p className="mt-6 max-w-md text-sm">{portal.tagline}</p>
          <p className="mt-6 text-sm">{portal.switchPortal.text}</p>
          <a href={portal.switchPortal.url} className="btn-maroon mt-2 block text-center text-lg">{portal.switchPortal.label}</a>
        </section>

        {/* Login form */}
        <form onSubmit={submit} className="relative mt-8 flex flex-col text-sm md:mt-0 md:justify-center">
          <p className="mb-2">Sign in with your staff account to manage Campus Locate.</p>
          <label htmlFor="id" className="font-semibold">{portal.idLabel}</label>
          <input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder={portal.idPlaceholder} required autoComplete="username" className="mb-4 mt-1 rounded-md border border-gray-300 bg-field px-3 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
          <label htmlFor="pw" className="font-semibold">Password:</label>
          <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-1 rounded-md border border-gray-300 bg-field px-3 py-2.5 outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
          {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
          <div className="mt-8 flex justify-between">
            <button type="button" onClick={() => { setId(''); setPassword(''); setError(''); }} className="btn-maroon text-xs">Clear entries</button>
            <button type="submit" disabled={busy} className="btn-maroon text-xs">{busy ? 'Signing in…' : 'Login'}</button>
          </div>
          <p className="mt-4">Forgot Password? <a href="mailto:admin.campuslocate@cit.edu" className="text-blue-500">Click here</a></p>
          <p className="mt-8 text-center">For inquiries, email us at <br /><a href="mailto:admin.campuslocate@cit.edu" className="text-blue-500">admin.campuslocate@cit.edu</a></p>
        </form>
      </div>
      <p className="mt-16 pb-6 text-xs text-gray-400">Copyright © 2026 CIT-U Campus Locate</p>
    </div>
  );
}
