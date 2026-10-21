import { apiFetch, auth } from './apiClient.js';

export function listLoans({ status, q } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const qs = params.toString();
  return apiFetch(`/api/loans${qs ? '?' + qs : ''}`);
}

export function getLoan(id) {
  return apiFetch(`/api/loans/${id}`);
}

export function createLoan(input) {
  return apiFetch('/api/loans', { method: 'POST', body: JSON.stringify(input) });
}

export function updateLoanStatus(id, status) {
  return apiFetch(`/api/loans/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export function deleteLoan(id) {
  return apiFetch(`/api/loans/${id}`, { method: 'DELETE' });
}

export function listEquipment() {
  return apiFetch('/api/equipment');
}

export async function login(email, password) {
  const result = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // save token ที่ชั้น service — ให้ผู้เรียกไม่ต้องรู้วิธีเก็บ
  // รองรับทั้ง { token } และ { accessToken } (เผื่อเปลี่ยนรูป API ภายหลัง)
  const token = result?.token ?? result?.accessToken;
  if (token) auth.setToken(token);
  return result;
}

export function logout() {
  auth.clearToken();
}