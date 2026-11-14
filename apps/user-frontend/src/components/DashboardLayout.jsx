// Shell for every signed-in page: wayfinding rail + floating header + page content (<Outlet />).
// Pages sit directly on the campus-map canvas (no big white wrapper card).
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { portal } from '../config/portalConfig.js';

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const current = portal.nav.find((n) => n.path === pathname)?.label || portal.nav[0].label;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="map-grid flex min-w-0 flex-1 flex-col bg-surface">
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-10 lg:px-10 lg:pt-8">
          <Topbar title={current} />
          <div key={pathname} className="rise-in">
            <Outlet />
          </div>
          <p className="mt-10 text-center text-[11px] text-gray-400">Copyright © 2026 CIT-U Campus Locate</p>
        </main>
      </div>
    </div>
  );
}
