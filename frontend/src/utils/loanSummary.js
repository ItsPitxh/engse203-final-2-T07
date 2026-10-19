export function summarizeByStatus(loans) {
  const init = { requested: 0, borrowed: 0, returned: 0, overdue: 0 };
  return loans.reduce((acc, l) => {
    if (acc[l.status] !== undefined) acc[l.status]++;
    return acc;
  }, init);
}