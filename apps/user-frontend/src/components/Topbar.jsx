// User Topbar — with live notification bell dropdown.
import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, ChevronDown, LogOut, HeartHandshake, Search, Megaphone, X } from 'lucide-react';
import profileDefault from '@shared/assets/profile-placeholder.png';
import { useAuth } from '../context/AuthContext.jsx';
import { portal } from '../config/portalConfig.js';
import ThemeToggle from './ThemeToggle.jsx';
import {
  getUserNotifications,
  markUserNotifRead,
  markAllUserNotifsRead,
} from '@shared/src/notificationStore.js';

const TYPE_ICON = {
  consultation_confirmed: <HeartHandshake size={15} className="text-emerald-600" />,
  consultation_declined:  <HeartHandshake size={15} className="text-red-500" />,
  consultation_cancelled: <HeartHandshake size={15} className="text-amber-600" />,
  lost_item_match:        <Search size={15} className="text-blue-500" />,
  announcement_posted:    <Megaphone size={15} className="text-maroon" />,
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const menuRef = useRef(null);
  const bellRef = useRef(null);

  const studentId = user?.id;

  const refreshNotifs = useCallback(() => {
    if (studentId) setNotifs(getUserNotifications(studentId));
  }, [studentId]);

  // Poll for new notifications every 3 seconds
  useEffect(() => {
    refreshNotifs();
    const t = setInterval(refreshNotifs, 3000);
    window.addEventListener('focus', refreshNotifs);
    return () => { clearInterval(t); window.removeEventListener('focus', refreshNotifs); };
  }, [refreshNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  function handleBellOpen() {
    setBellOpen((v) => !v);
    setMenuOpen(false);
  }

  function handleMarkRead(id) {
    markUserNotifRead(studentId, id);
    refreshNotifs();
  }

  function handleMarkAllRead() {
    markAllUserNotifsRead(studentId);
    refreshNotifs();
  }

  return (
    <header className="relative z-40 mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          <span className="h-px w-6 bg-gold" />
          Student portal · {today}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-maroon sm:text-4xl">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 p-1.5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-black/60">
        <ThemeToggle />

        {/* Bell button */}
        <div className={`relative ${bellOpen ? 'z-50' : ''}`} ref={bellRef}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={handleBellOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-gray-900">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            {unread === 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-300 ring-2 ring-white dark:bg-gray-600 dark:ring-gray-900" />
            )}
          </button>

          {bellOpen && (
            <div className="fade-in absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#1a1a1e]">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Notifications {unread > 0 && <span className="ml-1 rounded-full bg-maroon px-1.5 py-0.5 text-[10px] text-white">{unread} new</span>}
                </p>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-maroon hover:underline dark:text-gold">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/60">
                {notifs.length === 0 ? (
                  <li className="px-4 py-8 text-center text-xs text-gray-400">No notifications yet.</li>
                ) : (
                  notifs.map((n) => (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${!n.read ? 'bg-maroon-light/30 dark:bg-maroon/20' : ''}`}
                    >
                      <span className="mt-0.5 shrink-0">{TYPE_ICON[n.type] || <Bell size={15} className="text-gray-400" />}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${n.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{n.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{n.body}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="shrink-0 text-[10px] font-semibold text-maroon hover:underline dark:text-gold"
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className={`relative ${menuOpen ? 'z-50' : ''}`} ref={menuRef}>
          <button
            type="button"
            onClick={() => { setMenuOpen(!menuOpen); setBellOpen(false); }}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <img
              src={user?.avatar || profileDefault}
              alt=""
              className="h-8 w-8 rounded-full border border-gray-200 object-cover dark:border-gray-700"
            />
            <span className="hidden text-xs leading-tight sm:block">
              <span className="block max-w-[150px] truncate font-semibold text-gray-900 dark:text-gray-100">{user?.name}</span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400">{user?.loginId}</span>
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="fade-in absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-[#1a1a1e]">
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Student · {user?.loginId}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-maroon transition-colors hover:bg-maroon-light dark:text-gold dark:hover:bg-white/5"
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
