import { auth } from '../services/apiClient.js';

export function useAuth() {
  const token = auth.getToken();
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { /* ignore */ }
  const isStaff = Boolean(token) && user?.role === 'staff';
  function logout() {
    auth.clearToken();
    localStorage.removeItem('user');
    // main.jsx ใช้ HashRouter จึงเปลี่ยน hash แล้วรีโหลด
    window.location.hash = '#/login';
    window.location.reload();
  }
  return { token, user, isStaff, logout };
}