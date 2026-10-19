import { test } from 'vitest';
import assert from 'node:assert/strict';
import { validateLoanForm } from './loanForm.js';

const equipment = [{ id: 'EQ-1', name: 'กล้อง', availableQty: 3, totalQty: 5 }];
const valid = {
  borrowerName: 'สมชาย ใจดี',
  equipmentId: 'EQ-1',
  quantity: 2,
  borrowDate: '2026-10-20',
  returnDate: '2026-10-25',
  purpose: 'ถ่ายภาพกิจกรรมชมรม',
};

test('validateLoanForm ข้อมูลถูกต้อง → ไม่มี error', () => {
  assert.deepEqual(validateLoanForm(valid, equipment), []);
});

test('validateLoanForm คืนครบ 14 วัน → ผ่าน (ค่าขอบ)', () => {
  assert.deepEqual(validateLoanForm({ ...valid, returnDate: '2026-11-03' }, equipment), []);
});

test('validateLoanForm คืนเกิน 14 วัน → error', () => {
  const errors = validateLoanForm({ ...valid, returnDate: '2026-11-04' }, equipment);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /14 วัน/);
});

test('validateLoanForm วันคืน = วันยืม → error', () => {
  const errors = validateLoanForm({ ...valid, returnDate: '2026-10-20' }, equipment);
  assert.ok(errors.some(e => e.includes('หลังวันยืม')));
});

test('validateLoanForm จำนวนเกิน availableQty → error', () => {
  const errors = validateLoanForm({ ...valid, quantity: 4 }, equipment);
  assert.ok(errors.some(e => e.includes('เกินคงเหลือ')));
});

test('validateLoanForm วัตถุประสงค์ 9 ตัว → error · 10 ตัว → ผ่าน', () => {
  assert.ok(validateLoanForm({ ...valid, purpose: '123456789' }, equipment).length > 0);
  assert.deepEqual(validateLoanForm({ ...valid, purpose: '1234567890' }, equipment), []);
});