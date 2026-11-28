// Floating header: page title on the left, a glass "control pill" (theme, alerts, profile) on the right.
import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import profileDefault from '@shared/assets/profile-placeholder.png';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const admin = portal.key === 'admin';

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            Staff console · {today}
          </span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-maroon sm:text-4xl">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 p-1.5 shadow-sm backdrop-blur">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-maroon ring-2 ring-white" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-left transition-colors hover:bg-gray-100"
          >
            <img
              src={user?.avatar || profileDefault}
              alt=""
              className="h-8 w-8 rounded-full border border-gray-200 object-cover"
            />
            <span className="hidden text-xs leading-tight sm:block">
              <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                {user?.name}
                <span className="rounded bg-maroon px-1.5 py-0.2 text-[9px] font-bold text-white">STAFF</span>
              </span>
              <span className="block text-[11px] text-gray-500">{user?.loginId}</span>
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="fade-in absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gold/30 bg-white p-2 shadow-2xl">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="truncate text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] font-medium text-gold-dark">Administrator · {user?.loginId}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-maroon transition-colors hover:bg-maroon-light"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
