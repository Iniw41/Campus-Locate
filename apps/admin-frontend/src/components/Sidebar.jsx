// Navigation: a slim maroon "wayfinding rail" on desktop, a floating dock on mobile.
// Items are driven by portal.nav, so new features show up automatically.
import { NavLink } from 'react-router-dom';
import { Home, Map, Search, Megaphone, CalendarDays, Users, ClipboardList, LogOut } from 'lucide-react';
import logo from '@shared/assets/cit-logo.png';
import { portal } from '../config/portalConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

const icons = {
  home: Home,
  map: Map,
  search: Search,
  megaphone: Megaphone,
  calendar: CalendarDays,
  users: Users,
  tickets: ClipboardList,
};

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <>
      {/* Desktop rail — CIT-U Maroon & Gold */}
      <aside
        className="roads sticky top-0 z-30 hidden h-screen w-[92px] shrink-0 flex-col items-center self-start border-r-2 border-gold/70 bg-gradient-to-b from-maroon to-maroon-dark py-6 text-white shadow-xl md:flex"
      >
        <div className="flex flex-col items-center">
          <div className="rounded-2xl bg-white p-2 shadow-lg ring-4 ring-white/10 transition-transform hover:scale-105">
            <img src={logo} alt="CIT-U Campus Locate" className="h-10 w-10 object-contain" />
          </div>
          <span className="mt-2 rounded-full border border-gold-light/50 bg-gold/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-gold-light">
            STAFF
          </span>
        </div>

        <nav aria-label="Main" className="mt-8">
          <ul className="flex flex-col items-center gap-2.5">
            {portal.nav.map(({ label, path, icon }) => {
              const Icon = icons[icon] || Home;
              return (
                <li key={path}>
                  <NavLink
                    to={path}
                    end
                    aria-label={label}
                    className={({ isActive }) =>
                      `group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-maroon shadow-lg'
                          : 'text-white/70 hover:bg-white/15 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute -left-[22px] h-7 w-1.5 rounded-r-full bg-gold-light" />
                        )}
                        <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                        <span className="pointer-events-none absolute left-full z-50 ml-4 -translate-x-1 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-all group-hover:translate-x-0 group-hover:opacity-100">
                          {label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions: logout & decor */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out of staff console"
            className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 text-white/80 transition-all duration-200 hover:border-white/40 hover:bg-white/20 hover:text-white hover:shadow-lg"
          >
            <LogOut size={19} />
            <span className="pointer-events-none absolute left-full z-50 ml-4 -translate-x-1 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-all group-hover:translate-x-0 group-hover:opacity-100">
              Log out (Staff)
            </span>
          </button>

          <p className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/40 [writing-mode:vertical-rl]">
            Campus Locate
          </p>
          <span className="h-2 w-2 rounded-full bg-gold-light" />
        </div>
      </aside>

      {/* Mobile dock */}
      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl border border-gold/40 bg-maroon px-2 py-2 shadow-2xl ring-1 ring-white/10 md:hidden"
      >
        {portal.nav.map(({ label, path, icon }) => {
          const Icon = icons[icon] || Home;
          return (
            <NavLink
              key={path}
              to={path}
              end
              aria-label={label}
              className={({ isActive }) =>
                `flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                  isActive ? 'bg-white text-maroon shadow-md' : 'text-white/75'
                }`
              }
            >
              <Icon size={20} />
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/80 transition-all hover:bg-white/20"
        >
          <LogOut size={20} />
        </button>
      </nav>
    </>
  );
}
