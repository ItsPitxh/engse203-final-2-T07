import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLoans } from '../services/loanService.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';

const STATUSES = ['', 'requested', 'borrowed', 'returned', 'overdue'];

export default function LoansListPage() {
  const [loans, setLoans] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    listLoans({ status: status || undefined })
      .then(setLoans).catch(setError).finally(() => setLoading(false));
  }, [status]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <main>
      <h1>รายการคำขอยืมอุปกรณ์</h1>
      <label>กรองสถานะ:
        <select value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'ทั้งหมด'}</option>)}
        </select>
      </label>
      {loans.length === 0 ? <p>ไม่มีคำขอยืมในสถานะนี้</p> : (
        <ul className="loans-list">
          {loans.map(l => (
            <li key={l.id}>
              <Link to={`/loans/${l.id}`}>
                <strong>{l.id}</strong> · {l.equipmentName} × {l.quantity}
                <span className={`badge badge-${l.status}`}>{l.status}</span>
                <br />ผู้ยืม: {l.borrowerName} · ยืม {l.borrowDate} · คืน {l.returnDate}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}   