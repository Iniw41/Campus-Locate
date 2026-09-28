// App entry: routing for this portal. Nav items come from config/portalConfig.js.
import { Routes, Route, Navigate } from 'react-router-dom';
import { portal } from './config/portalConfig.js';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

// Register real pages here as features get built, e.g. { '/navigation': CampusMap }.
// Any nav item without an entry shows the "coming soon" placeholder.
const pages = {
  '/': Dashboard,
};

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><DashboardLayout /></Protected>}>
        {portal.nav.map((item) => {
          const Page = pages[item.path] || (() => <ComingSoon title={item.label} />);
          return <Route key={item.path} path={item.path} element={<Page />} />;
        })}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
