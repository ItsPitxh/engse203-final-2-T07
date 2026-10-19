import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLoans } from '../services/loanService.js';
import { summarizeByStatus } from '../utils/loanSummary.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SummaryPanel from '../components/SummaryPanel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function LoansListPage() {
  const [summary, setSummary] = useState({});
  const [loans, setLoans] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // การ์ดสรุปนับจากทุกสถานะ (ไม่ขึ้นกับตัวกรอง)
  useEffect(() => {
    listLoans().then(all => setSummary(summarizeByStatus(all))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setError(null);
    listLoans({ status: status || undefined })
      .then(setLoans).catch(setError).finally(() => setLoading(false));
  }, [status]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">LOANS · LIST</p>
          <h1>รายการคำขอยืม</h1>
          <p>ติดตามคำขอยืมอุปกรณ์ชมรมและกรองตามสถานะ</p>
        </div>
        <Link className="button primary inline" to="/new">+ ยืมอุปกรณ์</Link>
      </div>

      <SummaryPanel summary={summary} />

      <section className="panel">
        <div className="section-heading">
          <h2>รายการคำขอ</h2>
          <FilterBar value={status} onFilterChange={setStatus} />
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error.message} />}
        {!loading && !error && loans.length === 0 && (
          <p className="subtle-empty">ไม่มีคำขอยืมในสถานะนี้</p>
        )}
        {!loading && !error && loans.length > 0 && (
          <div className="request-list">
            {loans.map(l => (
              <article className="request-card" key={l.id}>
                <div>
                  <span className="request-id">{l.id}</span>
                  <h3><Link to={`/loans/${l.id}`}>{l.equipmentName} × {l.quantity}</Link></h3>
                  <p>ผู้ยืม: {l.borrowerName}</p>
                  <p>ยืม {l.borrowDate} · คืน {l.returnDate}</p>
                  <p><StatusBadge status={l.status} /></p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}