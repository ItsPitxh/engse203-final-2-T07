/**
 * ตัวกลางสำหรับคุยกับ API — ที่เดียวที่เรียก fetch()
 * ทุกฟังก์ชันใน loanService เรียกผ่านตรงนี้
 */

// dev: ยิงไป API ที่ localhost · production: same origin (Render เสิร์ฟทั้งคู่) ยกเว้นตั้ง VITE_API_BASE_URL
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:3001' : '');
const TOKEN_KEY = 'loans-token';
const USER_KEY = 'user';

/** จัดการ token + user ใน localStorage */
export const auth = {
  getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
  },
  setUser(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* ignore */ }
  },
  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
  },
};

/** error ที่รู้ว่ามาจาก API พร้อม status ที่ได้กลับมา */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function parseError(response) {
  try {
    const body = await response.json();
    return {
      message: body.error ?? `คำขอไม่สำเร็จ (${response.status})`,
      details: body.details,
    };
  } catch {
    return { message: `คำขอไม่สำเร็จ (${response.status})` };
  }
}

/** 401 = token ไม่มี/หมดอายุ/ไม่ถูกต้อง → ล้าง token แล้วพาไปหน้า login (HashRouter) */
function handleUnauthorized(path, hadToken) {
  const isLoginCall = path.startsWith('/api/auth/login');
  if (isLoginCall) return; // รหัสผิดตอน login: ให้หน้า login แสดง error เอง
  if (hadToken) auth.clearToken();
  if (typeof window !== 'undefined' && !window.location.hash.startsWith('#/login')) {
    window.location.hash = '#/login';
  }
}

/**
 * เรียก API แล้วคืนข้อมูลที่ parse แล้ว
 * - อ่าน token เองทุกครั้งแล้วแนบ Authorization: Bearer <token>
 * - 2xx → คืนข้อมูล (204 คืน null)
 * - 401 → ล้าง token + ไปหน้า login แล้วโยน ApiError
 * - 4xx/5xx อื่น → โยน ApiError พร้อม status
 * - ต่อ API ไม่ได้ → ApiError status 0
 */
export async function apiFetch(path, options = {}) {
  const token = auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่าเปิด API แล้วหรือยัง', 0);
  }

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized(path, Boolean(token));
    const { message, details } = await parseError(response);
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) return null;
  return response.json();
}