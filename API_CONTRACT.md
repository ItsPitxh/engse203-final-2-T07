# API Contract — T07 ยืม-คืนอุปกรณ์ชมรม

**เวอร์ชัน:** 1.0.0 · **Base URL (dev):** `http://localhost:3001` · **Base URL (prod):** `https://engse203-final-2-t07.onrender.com`
**รูปแบบข้อมูล:** JSON (`Content-Type: application/json`) · UTF-8
**ความปลอดภัย:** JWT (ใช้ `Authorization: Bearer <token>` สำหรับ endpoint ที่ต้อง login)

---

## Health

### `GET /api/health`
- **สิทธิ์:** ทุกคน
- **200:** `{ "ok": true, "db": { "connected": true, "driver": "sqlite", "tables": 3 } }`

## Auth

### `POST /api/auth/login`
- **สิทธิ์:** ทุกคน · **Body:** `{ "email": "...", "password": "..." }`
- **200:** `{ "token": "<JWT>", "user": { "id": 5, "name": "...", "email": "...", "role": "staff" } }`
- **401:** `{ "error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }` (ข้อความเดียวกันทั้งอีเมลผิดและรหัสผิด)
- **429:** เดา 5 ครั้งใน 15 นาที

## Loans

### `GET /api/loans`
- **สิทธิ์:** ทุกคน
- **Query (optional):** `?status=requested|borrowed|returned|overdue` · `?q=<คำค้น>`
- **200:** array ของ loan ที่ JOIN กับ equipment + users แล้ว
  ```json
  [{
    "id": "LN-001",
    "borrowerName": "สมชาย ใจดี",
    "equipmentId": "EQ-001",
    "equipmentName": "กล้อง DSLR Canon 90D",
    "equipmentLocation": "ห้องชมรมถ่ายภาพ · ตู้ A",
    "quantity": 1,
    "borrowDate": "2026-10-10",
    "returnDate": "2026-10-20",
    "purpose": "ถ่ายภาพกิจกรรมปฐมนิเทศ",
    "status": "borrowed",
    "createdAt": "..."
  }]
  ```

### `GET /api/loans/:id`
- **สิทธิ์:** ทุกคน
- **200:** loan object · **404:** `{ "error": "ไม่พบคำขอยืมรหัส LN-999" }`

### `POST /api/loans`
- **สิทธิ์:** ทุกคน
- **Body:** `{ "borrowerName", "equipmentId", "quantity", "borrowDate", "returnDate", "purpose" }`
- **201:** loan object ที่สร้าง
- **400:** `{ "error": "ข้อมูลคำขอยืมไม่ถูกต้อง", "details": ["ชื่อผู้ยืมต้องยาว 2–100 ตัวอักษร", "..."] }`
- **413:** body > 10 KB

### `PUT /api/loans/:id`
- **สิทธิ์:** staff (ต้อง login)
- **Body:** `{ "status": "requested|borrowed|returned|overdue" }`
- **200:** loan ที่อัปเดต · **400:** สถานะไม่ถูกต้อง · **401:** ไม่มี token · **403:** ไม่ใช่ staff · **404:** ไม่พบ

### `DELETE /api/loans/:id`
- **สิทธิ์:** staff
- **204:** ลบสำเร็จ · **401/403/404:** เหมือน PUT

## Equipment

### `GET /api/equipment`
- **สิทธิ์:** ทุกคน
- **200:** array ที่มี `availableQty` (คำนวณจาก loans ที่ status requested/borrowed/overdue)
  ```json
  [{ "id": "EQ-001", "name": "...", "totalQty": 2, "availableQty": 1, "location": "...", "category": "..." }]
  ```

### `GET /api/equipment/:id`
- **200/404**

## Users

### `GET /api/users`
- **200:** `[{ "id": 1, "name": "...", "department": "..." }, ...]`

### `GET /api/users/:id/loans`
- **200:** `[{ "id": "LN-001", "equipmentName": "...", "status": "..." }, ...]`

---

## Status codes

| Code | ความหมาย |
|---|---|
| 200 | สำเร็จ · มีข้อมูลคืน |
| 201 | สร้างสำเร็จ |
| 204 | สำเร็จ · ไม่มีข้อมูลคืน (DELETE) |
| 400 | body ผิด / สถานะผิด / กฎเฉพาะไม่ผ่าน |
| 401 | ไม่มี token หรือ token ไม่ valid |
| 403 | มี token แต่ไม่ใช่ staff |
| 404 | ไม่พบ resource |
| 413 | body > 10 KB |
| 429 | login ผิดถี่เกิน |
| 500 | server error (prod ไม่ส่ง stack trace) |
