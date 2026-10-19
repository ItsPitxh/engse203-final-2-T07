export const MIN_NAME = 2;
export const MAX_NAME = 100;
export const MIN_PURPOSE = 10;
export const MAX_PURPOSE = 500;
export const MIN_QTY = 1;
export const MAX_QTY = 10;
export const MAX_DAYS = 14;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function daysBetween(fromISO, toISO) {
  const from = new Date(fromISO + 'T00:00:00');
  const to = new Date(toISO + 'T00:00:00');
  return Math.round((to - from) / 86_400_000);
}

export function validateLoanForm(values, equipment = []) {
  const v = values ?? {};
  const errors = [];

  const name = typeof v.borrowerName === 'string' ? v.borrowerName.trim() : '';
  if (name.length < MIN_NAME || name.length > MAX_NAME) {
    errors.push(`ชื่อผู้ยืมต้องยาว ${MIN_NAME}–${MAX_NAME} ตัวอักษร`);
  }

  if (!v.equipmentId) errors.push('ต้องเลือกอุปกรณ์');

  const qty = Number(v.quantity);
  if (!Number.isInteger(qty) || qty < MIN_QTY || qty > MAX_QTY) {
    errors.push(`จำนวนต้องเป็นจำนวนเต็ม ${MIN_QTY}–${MAX_QTY}`);
  } else {
    const eq = equipment.find(e => e.id === v.equipmentId);
    if (eq && qty > eq.availableQty) {
      errors.push(`จำนวนเกินคงเหลือ (เหลือ ${eq.availableQty} ชิ้น)`);
    }
  }

  const borrowOk = DATE_RE.test(v.borrowDate ?? '');
  const returnOk = DATE_RE.test(v.returnDate ?? '');
  if (!borrowOk) errors.push('รูปแบบวันยืมต้องเป็น YYYY-MM-DD');
  if (!returnOk) errors.push('รูปแบบวันคืนต้องเป็น YYYY-MM-DD');
  if (borrowOk && returnOk) {
    const d = daysBetween(v.borrowDate, v.returnDate);
    if (d <= 0) errors.push('วันคืนต้องหลังวันยืม');
    else if (d > MAX_DAYS) errors.push(`วันคืนต้องไม่เกิน ${MAX_DAYS} วันจากวันยืม`);
  }

  const purpose = typeof v.purpose === 'string' ? v.purpose.trim() : '';
  if (purpose.length < MIN_PURPOSE || purpose.length > MAX_PURPOSE) {
    errors.push(`วัตถุประสงค์ต้องยาว ${MIN_PURPOSE}–${MAX_PURPOSE} ตัวอักษร`);
  }

  return errors;
}