import { statusLabel } from '../utils/loanStatus.js';

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{statusLabel(status)}</span>;
}