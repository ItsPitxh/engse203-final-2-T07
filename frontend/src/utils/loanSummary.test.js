import { test } from 'vitest';
import assert from 'node:assert/strict';
import { summarizeByStatus } from './loanSummary.js';

test('summarizeByStatus นับครบทั้ง 4 สถานะ', () => {
  const loans = [
    { status: 'requested' },
    { status: 'borrowed' }, { status: 'borrowed' },
    { status: 'returned' },
    { status: 'overdue' }, { status: 'overdue' }, { status: 'overdue' },
  ];
  assert.deepEqual(summarizeByStatus(loans), {
    requested: 1, borrowed: 2, returned: 1, overdue: 3,
  });
});

test('summarizeByStatus รายการว่าง → 0 ทุกสถานะ', () => {
  assert.deepEqual(summarizeByStatus([]), {
    requested: 0, borrowed: 0, returned: 0, overdue: 0,
  });
});

test('summarizeByStatus ข้ามสถานะที่ไม่รู้จัก', () => {
  const result = summarizeByStatus([{ status: 'borrowed' }, { status: 'in-progress' }]);
  assert.equal(result.borrowed, 1);
  assert.equal(result['in-progress'], undefined);
});