export const STATUS_ORDER = ['requested', 'borrowed', 'returned', 'overdue'];

export const STATUS_LABELS = {
  requested: 'รออนุมัติ',
  borrowed: 'กำลังยืม',
  returned: 'คืนแล้ว',
  overdue: 'เกินกำหนด',
};

export const STATUS_FILTERS = [
  { value: '', label: 'ทั้งหมด' },
  ...STATUS_ORDER.map(value => ({ value, label: STATUS_LABELS[value] })),
];

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}