// Top bar: notifications bell + profile menu (name, ID, logout).
import { useState } from 'react';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import profileDefault from '@shared/assets/profile-placeholder.png';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="flex h-[72px] items-center justify-end gap-6 border-t-2 border-gray-700 bg-white px-6">
      {/* Theme toggle + notifications */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button aria-label="Notifications" className="rounded-full bg-black p-2 text-white"><Bell size={18} fill="currentColor" /></button>
      </div>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left" aria-expanded={open}>
          <img src={user?.avatar || profileDefault} alt="" className="h-11 w-11 rounded-full object-cover" />
          <span className="text-sm leading-tight">
            <span className="block font-semibold">{user?.name}</span>
            <span className="block text-gray-600">{user?.loginId}</span>
          </span>
          <ChevronDown size={16} />
        </button>
        {open && (
          <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/5">
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-maroon hover:bg-maroon-light"><LogOut size={16} /> Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}
