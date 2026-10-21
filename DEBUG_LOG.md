# บันทึกการไล่ปัญหา (Debug Log)

แต่ละ bug ตอบ 6 ข้อ: อาการ → ทำซ้ำ → เครื่องมือ → สาเหตุ → วิธีแก้ → test ที่กันไม่ให้กลับมา

---

## BUG #0 · ค่าขอบรายละเอียด 10 ตัวอักษร (test เจอ — ไม่มีผู้ใช้แจ้ง)

- **อาการ:** ส่งรายละเอียด 10 ตัวอักษรพอดี ถูกปฏิเสธ ทั้งที่ข้อความบอกว่า "อย่างน้อย 10"
- **วิธีทำซ้ำ:** unit test `validateRequestInput({ ...valid, details: '1234567890' })`
- **เครื่องมือ:** unit test ค่าขอบ (TC-03) — fail ทันทีที่เขียน
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/validators/requestValidator.js` เงื่อนไข `length <= MIN_DETAILS` ทำให้ 10 ตัวถูกนับว่าไม่ผ่าน
- **วิธีแก้:** เปลี่ยนเป็น `length < MIN_DETAILS`
- **test ที่กัน:** `tests/unit/requestValidator.test.js` → "10 ตัวอักษร → ผ่าน (ตรงขอบพอดี)"

## BUG #1 · ลบคำร้องแล้วเพิ่มใหม่ ได้ 500

- **อาการ:** หลังลบคำร้องรายการกลาง การสร้างคำร้องใหม่ได้ 500
- **วิธีทำซ้ำ:** `DELETE /api/requests/REQ-002` แล้ว `POST /api/requests` → 500
- **เครื่องมือ:** อ่าน log ใน terminal (`UNIQUE constraint failed: requests.id`) → วาง breakpoint ใน `nextId()` ด้วย JavaScript Debug Terminal เห็นว่าได้ `REQ-005` ซึ่งมีอยู่แล้ว
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/services/requestService.js` ฟังก์ชัน `nextId()` คำนวณรหัสจาก `COUNT(*) + 1` — เมื่อลบรายการกลาง จำนวนลดลง รหัสที่ได้จึงชนกับรหัสที่ยังอยู่
- **วิธีแก้:** หารหัสล่าสุด (`ORDER BY id DESC LIMIT 1`) แล้วบวก 1
- **test ที่กัน:** `tests/integration/requests.api.test.js` → "ลบรายการกลาง แล้วเพิ่มใหม่ → 201 และรหัสไม่ซ้ำของเดิม"

## BUG #2 · Dashboard แสดง "กำลังดำเนินการ 0"

- **อาการ:** การ์ดสรุปบอกว่ากำลังดำเนินการ 0 แต่ในรายการมีคำร้อง in-progress
- **วิธีทำซ้ำ:** เปิด Dashboard ด้วยข้อมูลตั้งต้น (REQ-002 เป็น in-progress)
- **เครื่องมือ:** DevTools → Network → `GET /api/requests` ส่ง `"status": "in-progress"` ถูกต้อง → ปัญหาอยู่ฝั่ง frontend → วาง breakpoint ใน `summarizeRequests` (DevTools → Sources)
- **สาเหตุ (ไฟล์:บรรทัด):** `frontend/src/utils/requestSummary.js` นับด้วย `'in progress'` (ช่องว่าง) แทน `'in-progress'` (ขีด) จึงไม่ตรงกับค่าที่ API ส่งมา
- **วิธีแก้:** ใช้ `'in-progress'` ให้ตรงกับ API
- **test ที่กัน:** `frontend/src/utils/requestSummary.test.js` → "นับครบทุกสถานะ"

## BUG #3 · เปลี่ยนสถานะคำร้องที่ไม่มีอยู่ ได้ 500

- **อาการ:** `PUT /api/requests/REQ-999` ได้ 500 แทน 404
- **วิธีทำซ้ำ:** `curl -X PUT localhost:3001/api/requests/REQ-999 -H "Content-Type: application/json" -d '{"status":"completed"}'`
- **เครื่องมือ:** อ่าน stack trace ใน terminal — บรรทัดแรกบอก `TypeError: Cannot read properties of null (reading 'id')` บรรทัดถัดไปบอกไฟล์และบรรทัดใน controller
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/controllers/requestController.js` ใน `updateRequestStatus` มีบรรทัด log `updated.id` อยู่**ก่อน**การตรวจ `if (!updated)` — เมื่อไม่พบคำร้อง `updated` เป็น null จึงพัง
- **วิธีแก้:** ย้าย log ไปไว้หลังการตรวจ null
- **test ที่กัน:** `tests/integration/requests.api.test.js` → "คำร้องที่ไม่มีอยู่ → 404 (ไม่ใช่ 500)"

## SECURITY #1 · เคย commit `.env.production` ลงประวัติ git (checker ข้อ D3 แจ้ง)

- **อาการ:** `check-project.mjs` ข้อ D3 แจ้งว่าเคย commit `starter/frontend/.env.production` ไว้ในประวัติ
- **วิธีทำซ้ำ:** `git log --all --oneline -- starter/frontend/.env.production`
- **เครื่องมือ:** `git log` หา commit ที่เกี่ยวข้อง แล้ว `git show <commit>:<path>` อ่านเนื้อหา · ค้นชื่อตัวแปรที่เหมือนความลับ (secret / password / token / key) ตรวจเมื่อ 2026-10-21
- **สาเหตุ (ไฟล์:บรรทัด):** `starter/frontend/.env.production` ถูกคัดลอกมากับโค้ดเริ่มต้นของ LAB 13 แล้วถูก `git add` เข้ามา · ไฟล์มีตัวแปร: VITE_API_BASE_URL
- **วิธีแก้:** ตรวจแล้ว**ไม่มีตัวแปรที่เป็นความลับ** (มีแต่ที่อยู่สาธารณะของ API ซึ่งเบราว์เซอร์เห็นได้อยู่แล้ว) จึงไม่ต้องเปลี่ยน secret · ย้ายโค้ดขึ้น root ทำให้ path `starter/` หายไปจากโฟลเดอร์ทำงาน · `.gitignore` มี `.env` และ `.env.local` · `api/.env.example` มี `JWT_SECRET=` ค่าว่าง · `JWT_SECRET` และรหัส staff production อยู่ใน environment ของ Render เท่านั้น
- **test ที่กัน:** `check-project.mjs` ข้อ D3 · และคำสั่ง `git ls-files | Select-String '\.env$'` ต้องเจอแค่ `.env.example`
## BUG #3 · `starter/frontend/.env.production` เคย commit (D3)

- **ผู้เจอ / วันที่:** พิชฌ์ · 21 ต.ค. 2026 (ตอน checker ตรวจ D3)
- **อาการ:** checker รายงาน "เคย commit `starter/frontend/.env.production` ไว้ในประวัติ — เปลี่ยน secret ทันทีแล้วบันทึกใน DEBUG_LOG.md"
- **วิธีทำซ้ำ:** `git log --all -- "**/.env.production"` เจอ commit `2c63bc3 feat(M1.2): added starter code` · ไฟล์ `starter/frontend/.env.production` ติดเข้าไปตอนที่ย้าย LAB 13 ลง repo ทีม
- **เครื่องมือ:** `git log --all --diff-filter=A --name-only -- "**/.env.production"` · `git show 2c63bc3:starter/frontend/.env.production`
- **สาเหตุ (ไฟล์:บรรทัด):** `.gitignore` ตอน M1.2 ยังไม่ครอบคลุม `starter/frontend/.env.production` · ไฟล์ติดเข้า commit · ของจริงมีค่า `VITE_API_BASE_URL=` ว่าง (ไม่ใช่ secret) แต่กฎรัดกุม: ไฟล์ `.env.*` ยกเว้น `.env.example` ไม่ควรอยู่ใน git เลย
- **วิธีแก้:** 
  1. `starter/` ถูกลบไปแล้วตอน M1.3 · ไฟล์ไม่อยู่บน `main` ปัจจุบัน
  2. **หมุน `JWT_SECRET` บน Render ทันที** — Render Dashboard → service → Environment → `JWT_SECRET` → Edit → ลบของเดิม → ปล่อยให้ `generateValue: true` ใน `render.yaml` สุ่มใหม่ตอน redeploy
  3. `.gitignore` และ `api/.gitignore` ยืนยันว่ามี `.env` และ `.env.local` ครอบคลุม `.env.production` แล้ว
- **test ที่กัน:** pre-commit guard: `git ls-files | grep -E '\.env\.(production|development|local)$'` ต้องว่าง · ทีมเช็คก่อน push ทุกครั้ง
