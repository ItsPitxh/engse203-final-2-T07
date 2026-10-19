import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLoan, updateLoanStatus, deleteLoan } from '../services/loanService.js';
import { useAuth } from '../hooks/useAuth.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';

const ALL_STATUSES = ['requested', 'borrowed', 'returned', 'overdue'];

export default function LoanDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isStaff } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    getLoan(id).then(setLoan).catch(setError).finally(() => setLoading(false));
  }, [id]);

  async function onStatusChange(newStatus) {
    try {
      const updated = await updateLoanStatus(id, newStatus);
      setLoan(updated);
    } catch (err) { alert(err.message); }
  }

  async function onDelete() {
    if (!confirm(`ลบคำขอยืม ${id}?`)) return;
    try { await deleteLoan(id); nav('/'); }
    catch (err) { alert(err.message); }
  }

  if (loading) return <LoadingState />;
  if (error) {
    const notFound = error.status === 404 || /ไม่พบ/.test(error.message || '');
    return <ErrorState message={notFound ? 'ไม่พบรายการ' : error.message} />;
  }
  if (!loan) return <p>ไม่พบรายการ</p>;

  return (
    <main>
      <h1>คำขอยืม {loan.id}</h1>
      <dl>
        <dt>ผู้ยืม</dt><dd>{loan.borrowerName}</dd>
        <dt>อุปกรณ์</dt><dd>{loan.equipmentName} ({loan.equipmentLocation})</dd>
        <dt>จำนวน</dt><dd>{loan.quantity}</dd>
        <dt>วันยืม</dt><dd>{loan.borrowDate}</dd>
        <dt>วันกำหนดคืน</dt><dd>{loan.returnDate}</dd>
        <dt>วัตถุประสงค์</dt><dd>{loan.purpose}</dd>
        <dt>สถานะ</dt><dd>{loan.status}</dd>
      </dl>

      {isStaff && (
        <section className="staff-actions">
          <h2>การจัดการ (เจ้าหน้าที่)</h2>
          {ALL_STATUSES.filter(s => s !== loan.status).map(s => (
            <button key={s} onClick={() => onStatusChange(s)}>เปลี่ยนเป็น {s}</button>
          ))}
          <button onClick={onDelete} className="danger">ลบคำขอยืม</button>
        </section>
      )}
    </main>
  );
}