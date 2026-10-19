import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/loanService.js';
import { auth } from '../services/apiClient.js';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const result = await login(email, password);
      auth.setToken(result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      nav('/');
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>เข้าสู่ระบบเจ้าหน้าที่</h1>
      <form onSubmit={onSubmit}>
        <label>อีเมล
          <input type="email" value={email}
            onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>รหัสผ่าน
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p role="alert" className="error">{error}</p>}
        <button disabled={loading}>{loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
      </form>
    </main>
  );
}   