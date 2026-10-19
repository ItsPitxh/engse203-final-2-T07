import { auth } from '../services/apiClient.js';

export function useAuth() {
  const token = auth.getToken();
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { /* ignore */ }
  const isStaff = Boolean(token) && user?.role === 'staff';
  function logout() {
    auth.clearToken();
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return { token, user, isStaff, logout };
}