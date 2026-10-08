// Tiny fetch wrapper pointed at the shared backend. Attaches the JWT automatically.
import { portal } from '../config/portalConfig.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(portal.tokenKey);
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}
