import { STATUS_ORDER, statusLabel } from '../utils/loanStatus.js';

function SummaryPanel({ summary }) {
  const total = STATUS_ORDER.reduce((n, s) => n + (summary[s] ?? 0), 0);
  const items = [
    ['ทั้งหมด', total],
    ...STATUS_ORDER.map(s => [statusLabel(s), summary[s] ?? 0]),
  ];
  return (
    <section className="summary-grid" aria-label="สรุปคำขอยืม">
      {items.map(([label, value]) => (
        <article className="summary-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

export default SummaryPanel;