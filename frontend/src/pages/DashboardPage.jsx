import { useEffect, useState } from 'react';
import { listLoans } from '../services/loanService.js';
import { summarizeByStatus } from '../utils/loanSummary.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listLoans()
      .then(loans => setSummary(summarizeByStatus(loans)))
      .catch(setError);
  }, []);

  if (error) return <ErrorState message={error.message} />;
  if (!summary) return <LoadingState />;

  return (
    <main>
      <h1>สรุปภาพรวม</h1>
      <div className="cards">
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} className={`card status-${status}`}>
            <h2>{status}</h2><p className="count">{count}</p>
          </div>
        ))}
      </div>
    </main>
  );
}