import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLoans } from '../services/loanService.js';
import { summarizeByStatus } from '../utils/loanSummary.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import SummaryPanel from '../components/SummaryPanel.jsx';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listLoans()
      .then(loans => setSummary(summarizeByStatus(loans)))
      .catch(setError);
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">DASHBOARD · SUMMARY</p>
          <h1>Dashboard</h1>
          <p>สรุปจำนวนคำขอยืมแยกตามสถานะ</p>
        </div>
        <Link className="button secondary inline" to="/">ดูรายการทั้งหมด</Link>
      </div>

      {error && <ErrorState message={error.message} />}
      {!error && !summary && <LoadingState />}
      {summary && <SummaryPanel summary={summary} />}
    </>
  );
}