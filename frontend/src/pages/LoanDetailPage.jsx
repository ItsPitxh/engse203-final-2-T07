import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLoan, updateLoanStatus, deleteLoan } from '../services/loanService.js';
import { useAuth } from '../hooks/useAuth.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { STATUS_ORDER, statusLabel } from '../utils/loanStatus.js';

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

  let body;
  if (loading) {
    body = <LoadingState />;
  } else if (error) {
    const notFound = error.status === 404 || /ไม่พบ/.test(error.message || '');
    body = <ErrorState message={notFound ? 'ไม่พบรายการ' : error.message} />;
  } else if (!loan) {
    body = <p className="subtle-empty">ไม่พบรายการ</p>;
  } else {
    body = (
      <section className="panel detail-card">
        <dl>
          <div><dt>ผู้ยืม</dt><dd>{loan.borrowerName}</dd></div>
          <div><dt>อุปกรณ์</dt><dd>{loan.equipmentName} ({loan.equipmentLocation})</dd></div>
          <div><dt>จำนวน</dt><dd>{loan.quantity}</dd></div>
          <div><dt>วันยืม</dt><dd>{loan.borrowDate}</dd></div>
          <div><dt>วันกำหนดคืน</dt><dd>{loan.returnDate}</dd></div>
          <div><dt>วัตถุประสงค์</dt><dd>{loan.purpose}</dd></div>
          <div><dt>สถานะ</dt><dd><StatusBadge status={loan.status} /></dd></div>
        </dl>
        {isStaff && (
          <div className="actions">
            {STATUS_ORDER.filter(s => s !== loan.status).map(s => (
              <button key={s} type="button" className="button secondary"
                onClick={() => onStatusChange(s)}>
                เปลี่ยนเป็น {statusLabel(s)}
              </button>
            ))}
            <button type="button" className="button danger" onClick={onDelete}>
              ลบคำขอยืม
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">LOAN · DETAIL</p>
          <h1>คำขอยืม {id}</h1>
        </div>
        <Link className="button secondary inline" to="/">← กลับไปรายการ</Link>
      </div>
      {body}
    </>
  );
}