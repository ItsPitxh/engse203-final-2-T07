import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createHmac } from 'node:crypto';

// ตั้งค่าก่อน import โมดูลของ API — ใช้ฐานข้อมูลในหน่วยความจำ ไม่แตะ loans.db จริง
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET ??= 'test-secret-for-vitest-only';

let app;
let staffToken;

/** เซ็น JWT (HS256) เอง — ไม่ต้องพึ่ง library เพื่อสร้าง token ของ role อื่นสำหรับทดสอบ 403 */
function signJwt(payload, secret) {
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const data = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`;
  const sig = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

const validBody = {
  borrowerName: 'ทดสอบ สมบูรณ์',
  equipmentId: 'EQ-005',
  quantity: 1,
  borrowDate: '2026-10-15',
  returnDate: '2026-10-20',
  purpose: 'ทดสอบระบบ integration',
};

beforeAll(async () => {
  const { loadSeed } = await import('../../src/services/loanService.js');
  const { createApp } = await import('../../src/app.js');
  await loadSeed();
  app = createApp();

  const res = await request(app).post('/api/auth/login')
    .send({ email: 'staff@rmutl.ac.th', password: 'staff1234' });
  staffToken = res.body.token;
});

describe('POST /api/auth/login', () => {
  it('รหัสผ่านผิด → 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'staff@rmutl.ac.th', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('รหัสผ่านถูก → 200 + token', async () => {
    expect(typeof staffToken).toBe('string');
    expect(staffToken.length).toBeGreaterThan(20);
  });
});

describe('GET /api/loans', () => {
  it('200 + array', async () => {
    const res = await request(app).get('/api/loans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('มี equipmentName จาก JOIN', async () => {
    const res = await request(app).get('/api/loans');
    expect(res.body[0]).toHaveProperty('equipmentName');
  });

  it('กรองสถานะด้วย ?status=', async () => {
    const res = await request(app).get('/api/loans?status=returned');
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(l => l.status === 'returned')).toBe(true);
  });
});

describe('GET /api/loans/:id', () => {
  it('พบ → 200', async () => {
    const res = await request(app).get('/api/loans/LN-003');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('LN-003');
  });

  it('ไม่พบ → 404', async () => {
    const res = await request(app).get('/api/loans/LN-999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/equipment', () => {
  it('200 + availableQty เป็นตัวเลข', async () => {
    const res = await request(app).get('/api/equipment');
    expect(res.status).toBe(200);
    expect(typeof res.body[0].availableQty).toBe('number');
  });
});

describe('POST /api/loans', () => {
  it('body ถูก → 201', async () => {
    const res = await request(app).post('/api/loans').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^LN-\d{3}$/);
  });

  it('body ผิด → 400 + details', async () => {
    const res = await request(app).post('/api/loans').send({ borrowerName: 'ก' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('ยืมเกิน 14 วัน → 400', async () => {
    const res = await request(app).post('/api/loans').send({
      ...validBody, returnDate: '2026-11-15', purpose: 'ทดสอบกฎ 14 วัน',
    });
    expect(res.status).toBe(400);
  });

  it('จำนวนเกินคงเหลือ → 400', async () => {
    // EQ-006 มี 1 ชิ้น และถูกขอยืมอยู่แล้ว (LN-005) → คงเหลือ 0
    const res = await request(app).post('/api/loans').send({ ...validBody, equipmentId: 'EQ-006' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/loans/:id', () => {
  it('ไม่มี token → 401', async () => {
    const res = await request(app).put('/api/loans/LN-001').send({ status: 'borrowed' });
    expect(res.status).toBe(401);
  });

  it('มี token staff → 200 และบันทึกจริง', async () => {
    const res = await request(app).put('/api/loans/LN-001')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'returned' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('returned');
    const again = await request(app).get('/api/loans/LN-001');
    expect(again.body.status).toBe('returned');
  });

  it('สถานะไม่ถูกต้อง → 400', async () => {
    const res = await request(app).put('/api/loans/LN-001')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'in-progress' });
    expect(res.status).toBe(400);
  });

  it('ไม่พบรายการ → 404 (ไม่ใช่ 500)', async () => {
    const res = await request(app).put('/api/loans/LN-999')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'borrowed' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/loans/:id', () => {
  it('ไม่มี token → 401', async () => {
    const res = await request(app).delete('/api/loans/LN-002');
    expect(res.status).toBe(401);
  });

  it('มี token staff → 204 แล้ว GET ซ้ำ → 404', async () => {
    const res = await request(app).delete('/api/loans/LN-002')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(204);
    const again = await request(app).get('/api/loans/LN-002');
    expect(again.status).toBe(404);
  });
});

describe('403 role check', () => {
  it('borrower ลอง PUT → 403', async () => {
    const borrowerToken = signJwt(
      { sub: '999', name: 'fake', role: 'borrower', exp: Math.floor(Date.now() / 1000) + 3600 },
      process.env.JWT_SECRET
    );
    const res = await request(app).put('/api/loans/LN-003')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ status: 'borrowed' });
    expect(res.status).toBe(403);
  });
});