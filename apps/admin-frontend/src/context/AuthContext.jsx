// Holds the signed-in user for this portal. Add permissions/roles helpers here later.
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { portal } from '../config/portalConfig.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(portal.tokenKey));

  // Restore the session on page load.
  useEffect(() => {
    if (!localStorage.getItem(portal.tokenKey)) return;
    api(portal.meEndpoint).then((d) => setUser(d.user)).catch(() => localStorage.removeItem(portal.tokenKey)).finally(() => setLoading(false));
  }, []);

  const login = async (id, password) => {
    const data = await api(portal.loginEndpoint, { method: 'POST', body: { id, password } });
    localStorage.setItem(portal.tokenKey, data.token);
    setUser(data.user);
  };
  const logout = () => { localStorage.removeItem(portal.tokenKey); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
