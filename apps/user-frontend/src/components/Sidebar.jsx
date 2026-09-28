// Left navigation. Items are driven by portal.nav.
import { NavLink } from 'react-router-dom';
import { Home, Map, Search, Megaphone, CalendarDays, Users, ClipboardList } from 'lucide-react';
import logo from '@shared/assets/cit-logo.png';
import { portal } from '../config/portalConfig.js';

const icons = { home: Home, map: Map, search: Search, megaphone: Megaphone, calendar: CalendarDays, users: Users, tickets: ClipboardList };

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-[280px] shrink-0 flex-col bg-white">
      <div className="flex h-[72px] items-center gap-3 px-4">
        <img src={logo} alt="CIT-U logo" className="h-14 w-14" />
        <div className="leading-tight text-maroon">
          <p className="text-sm font-semibold uppercase">CIT University</p>
          <p className="text-[15px] font-medium">Campus Locate</p>
        </div>
      </div>
      <nav className="mt-6 flex flex-col gap-1 px-4">
        {portal.nav.map(({ label, path, icon }) => {
          const Icon = icons[icon] || Home;
          return (
            <NavLink key={path} to={path} end className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-maroon-light text-maroon font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Icon size={20} /> {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
