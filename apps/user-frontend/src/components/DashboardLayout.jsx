// Shell for every signed-in page: sidebar + topbar + page content (<Outlet />).
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { portal } from '../config/portalConfig.js';

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const current = portal.nav.find((n) => n.path === pathname)?.label || 'Home';
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-surface p-4">
          <p className="mb-2 text-right text-lg">{current}</p>
          <div className="min-h-[calc(100vh-190px)] rounded-2xl bg-white p-6"><Outlet /></div>
          <p className="mt-3 text-center text-xs text-gray-400">Copyright © 2026 CIT-U Campus Locate</p>
        </main>
      </div>
    </div>
  );
}
