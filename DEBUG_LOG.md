# บันทึกการไล่ปัญหา (Debug Log) — T07 ยืม-คืนอุปกรณ์ชมรม

แต่ละ bug ตอบ 6 ข้อ: อาการ → ทำซ้ำ → เครื่องมือ → สาเหตุ → วิธีแก้ → test ที่กัน

> ทุกหัวข้อด้านล่างคือ bug จริงที่พบในระหว่างทำโปรเจกต์ T07 นี้ · ไม่ใช่ bug จาก LAB 12 Campus Service

---

## 🔴 BUG #1 (T07) · Router ซ้อน 2 ชั้น · deploy แล้วหน้าว่าง

- **ผู้เจอ / วันที่:** พิชฌ์ · 19 ต.ค. 2026 · หลัง deploy Render ครั้งแรก
- **อาการ:** เปิด `https://engse203-final-2-t07.onrender.com` ได้หน้า **ว่างเปล่า** · เปิด DevTools Console เห็น error:
  ```
  Error: You cannot render a <Router> inside another <Router>.
  You should never have more than one in your app.
  ```
  ส่งผลให้ `useAuth` · `Routes` · `Link` ใช้ไม่ได้ · ทั้ง app ไม่ render อะไรออกมา
- **วิธีทำซ้ำ:** `npm run build --prefix frontend && npm run preview --prefix frontend` → เปิด browser · เจอตั้งแต่ local ไม่ต้องรอ deploy
- **เครื่องมือ:** Chrome DevTools → Console tab (อ่าน React error stack) · เทียบ import ของ `main.jsx` กับ `App.jsx`
- **สาเหตุ (ไฟล์:บรรทัด):** 
  - `frontend/src/main.jsx:3,9` → `<HashRouter><App /></HashRouter>` (ของเดิมจาก LAB 13 · HashRouter เหมาะกับ Render free tier)
  - `frontend/src/App.jsx:1,27,37` → `<BrowserRouter>...</BrowserRouter>` (เผลอครอบ Router ซ้อนตอนเขียนหน้า T07 ใหม่)
  - React Router v6 ตรวจที่ render-time ว่า Router nested → throw
- **วิธีแก้ (commit `299a5d9`):** ลบ `<BrowserRouter>` ออกจาก `App.jsx` · เหลือแค่ `<HashRouter>` ใน `main.jsx` อย่างเดียว · เปลี่ยน App.jsx ให้ return `<>...</>` fragment แทน
- **test ที่กัน:** `npm run build --prefix frontend` ต้องสำเร็จก่อน push · ขั้น Render build จะ fail ถ้ามี Router nested (React ล้มที่ render-time) · ทีมใช้ build สำเร็จเป็น guard

---

## 🔴 BUG #2 (T07) · `login()` ไม่ save token เอง · ทำให้ probe F2 fail

- **ผู้เจอ / วันที่:** พิชฌ์ · 21 ต.ค. 2026 · ตอน `check-project.mjs` รายงาน F2 fail
- **อาการ:** checker รายงาน
  ```
  F2 · ลอง login แล้วเรียก loanService.js → updateLoanStatus() →
  PUT /api/loans/LN-001 ไม่มี Authorization: Bearer (และอีก 3 คำขอ)
  ```
  ทั้งๆ ที่ `apiClient.apiFetch` มี logic แนบ `Authorization: Bearer <token>` อยู่แล้ว
- **วิธีทำซ้ำ:** `node check-project.mjs --online` → section F2 · อ่านรายงาน
- **เครื่องมือ:** 
  1. อ่าน `check-project.mjs` → function `probeFrontendAuth()` · เห็นว่า probe รัน vitest ใน node environment · polyfill `localStorage` · mock `fetch` · เรียก `login()` ของ service แล้วตามด้วย `updateLoanStatus()`
  2. ตามรอยใน `loanService.js` → function `login()` return response จาก API เฉยๆ · ไม่เคย `auth.setToken()` ให้
  3. token-saving อยู่ที่ `LoginPage.jsx` หลัง `await login()` return · probe ไม่เรียก LoginPage จึง token ไม่เคยถูก save → `apiFetch` อ่าน localStorage ไม่เจอ token → ไม่แนบ header
- **สาเหตุ (ไฟล์:บรรทัด):** `frontend/src/services/loanService.js` · function `login(email, password)` เดิม:
  ```js
  export function login(email, password) {
    return apiFetch('/api/auth/login', {...});   // ← return token แต่ไม่ save
  }
  ```
  Service layer ไม่ encapsulate พฤติกรรม "login = save token" · ปล่อยให้หน้าเว็บเป็นผู้รับผิดชอบ · ขัดหลักการว่า apiClient ต้องอ่าน token เองได้ทุกครั้ง
- **วิธีแก้ (commit หลังจาก push):** แก้ `login()` ให้เป็น async + save token ภายใน · เพิ่ม `logout()` helper + `import { auth }` จาก apiClient:
  ```js
  export async function login(email, password) {
    const result = await apiFetch('/api/auth/login', {...});
    const token = result?.token ?? result?.accessToken;
    if (token) auth.setToken(token);   // ← save ให้เอง
    return result;
  }
  ```
- **test ที่กัน:** `check-project.mjs` section F2 ต้องผ่าน (probe รัน login + updateLoanStatus ครบทุกครั้งต้องมี Authorization: Bearer) · ทีมรัน checker ก่อน push ทุกครั้ง

---

## 🔴 BUG #3 (T07) · `.env.production` เคย commit ลงประวัติ (D3)

- **ผู้เจอ / วันที่:** พิชฌ์ · 21 ต.ค. 2026 · ตอน checker ข้อ D3 แจ้ง
- **อาการ:** `check-project.mjs` ข้อ D3 ตอบ:
  > "เคย commit `starter/frontend/.env.production` ไว้ในประวัติ — เปลี่ยน secret ทันทีแล้วบันทึกใน DEBUG_LOG.md"
- **วิธีทำซ้ำ:** `git log --all --diff-filter=A --name-only -- "**/.env.production"` → เห็น commit `2c63bc3 feat(M1.2): added starter code`
- **เครื่องมือ:** `git log` · `git show 2c63bc3:starter/frontend/.env.production` อ่านเนื้อหา · ค้นชื่อตัวแปรที่เหมือนความลับ (secret / password / token / key)
- **สาเหตุ (ไฟล์:บรรทัด):** ตอน M1.2 ขั้น "added starter code" คัดลอก LAB 13 เข้ามาทั้งโฟลเดอร์ · `.gitignore` ของ repo ทีมตอนนั้นยังไม่ครอบคลุม `starter/frontend/.env.production` · ไฟล์ติดเข้า commit · เนื้อหามีเฉพาะ `VITE_API_BASE_URL=` ค่าว่าง (**ไม่ใช่ secret**) แต่กฎรัดกุมคือ `.env.*` ยกเว้น `.env.example` ไม่ควรอยู่ใน git เลย
- **วิธีแก้:**
  1. `starter/` ถูกลบไปแล้วตั้งแต่ M1.3 · ไม่อยู่ใน working tree หรือ `main` ปัจจุบัน · ยัง**อยู่ในประวัติ**เท่านั้น
  2. **หมุน `JWT_SECRET` บน Render ทันที** — Dashboard → service → Environment → `JWT_SECRET` → Edit → ลบของเดิม → ปล่อยให้ `render.yaml` `generateValue: true` สุ่มใหม่ตอน redeploy
  3. ยืนยัน `.gitignore` ครอบคลุม `.env` · `.env.local` · `*.local` และ `api/.gitignore` ครอบ `.env` ด้วย
- **test ที่กัน:** `git ls-files | grep -E '\.env\.(production|development|local)$'` ต้องว่าง · ทีมเช็คก่อน push ทุกครั้ง · pre-commit guard แนะนำเพิ่มใน `.husky/` ภายหลัง

---

## 🔴 BUG #4 (T07) · PowerShell `$api` ถูก expand เป็น .NET type · integration test commit ที่ path ผิด

- **ผู้เจอ / วันที่:** พิชฌ์ · 21 ต.ค. 2026 · ตอนเช็ค checker B3
- **อาการ:** checker B3 รายงาน `integration 0` ทั้งๆ ที่ commit `9fc42e8 test(B3): add api integration tests` มีไฟล์ test · และ `api/tests/integration/` ว่างบน disk
- **วิธีทำซ้ำ:** `git ls-files | grep integration` → เจอ path แปลก:
  ```
  System.Collections.Specialized.OrderedDictionary/tests/integration/loans.test.js
  System.Collections.Specialized.OrderedDictionary/.env.example
  System.Collections.Specialized.OrderedDictionary/package-lock.json
  ```
- **เครื่องมือ:** `git ls-files` · `git show --stat 9fc42e8` · เปิดไฟล์ที่ path แปลกเพื่อยืนยันว่าเป็น loans.test.js จริง
- **สาเหตุ:** วรสิทธิ์ commit จาก **PowerShell บน Windows** โดยพิมพ์คำสั่งทำนอง `git add $api/tests/integration/loans.test.js` · PowerShell ตีความ `$api` เป็น auto-variable ที่ไม่มีค่า แล้ว fallback เป็น type default → serialize object `[System.Collections.Specialized.OrderedDictionary]` เป็น string → path กลายเป็นชื่อ type นี้ · bash/zsh จะได้ empty string แต่ PowerShell นิสัยเปลี่ยนไป
- **วิธีแก้:**
  1. `git mv "System.Collections.Specialized.OrderedDictionary/tests/integration/loans.test.js" api/tests/integration/loans.test.js`
  2. `git rm "System.Collections.Specialized.OrderedDictionary/.env.example"` และ `package-lock.json` (ของเก่าใน api/ ยังดีกว่า)
  3. `rm -rf "System.Collections.Specialized.OrderedDictionary"` · commit
- **test ที่กัน:** policy ทีม: Windows ใช้ `git add 'api/tests/...'` **ใน single quote เสมอ** · หรือใช้ Git Bash แทน PowerShell · + `git ls-files | grep -i "System\.Collections"` ก่อน push ทุกครั้ง (ต้องว่าง)


## 🔴 BUG #5 (T07) · `availableQty` race ตอนอนุมัติพร้อมกัน · staff สอง tab อนุมัติทับกันได้

- **ผู้เจอ / วันที่:** พิชฌ์ · 21 ต.ค. 2026 · ตอน code review กับ [[worasit]] (จำลองสองหน้าจอ)
- **อาการ:** staff สองคน (หรือ staff เดียวกันเปิดสอง tab) เปิดหน้า pending list พร้อมกัน · กด "อนุมัติ" ที่ LN-xxx ของ EQ-002 (ขาตั้งกล้อง total=5) · ทั้งสองคำสั่งผ่าน validator ทั้งๆ ที่ `available=1` → อนุมัติทั้งคู่ · DB ลงเอยด้วย borrowed quantity รวมเกิน total_qty
- **วิธีทำซ้ำ:** ใช้ Postman รัน request สอง `PUT /api/loans/LN-xxx` พร้อมกันด้วย staff token · แต่ละ request ขอ quantity ที่รวมกันเกิน `availableQty` · ทั้งคู่ตอบ `200`
- **เครื่องมือ:** `curl` + `&` background · อ่าน `loanController.js` → `updateLoanStatus()` · เห็นว่า flow เป็น (1) query equipment → (2) `availableQtyFor()` → (3) validator → (4) `UPDATE loans SET status=...` · ขั้น 2-4 ไม่ได้อยู่ใน transaction เดียวกัน
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/controllers/loanController.js` function `updateLoanStatus` · อ่าน availableQty แล้ว release connection ก่อนเขียน · ระหว่างนั้น request อีก connection แทรก · `node:sqlite` default auto-commit per statement · ไม่มี `BEGIN IMMEDIATE`
- **วิธีแก้ (ยัง pending — M4):** ครอบด้วย `db.exec('BEGIN IMMEDIATE')` ก่อน `availableQtyFor()` และ `db.exec('COMMIT')` หลัง UPDATE · retry ถ้า `SQLITE_BUSY` · unit test ยิง 10 parallel approve → ต้องมีได้ไม่เกิน `total_qty`
- **test ที่กัน (ยัง pending):** integration test `concurrent-approve.test.js` — spawn 2 PUT พร้อมกัน · ต้องมีตัวเดียวได้ 200 อีกตัวได้ 400/409

---

## 🔴 BUG #6 (T07) · 14-day validator off-by-one · อนุมัติ 15 วันผ่าน

- **ผู้เจอ / วันที่:** พิชฌ์ · 21 ต.ค. 2026 · ตอนเขียน unit test `loanValidator.test.js` ขั้น edge case
- **อาการ:** ยืม `borrow_date=2026-10-01` · `return_date=2026-10-15` ควร**ผ่าน** (14 วัน) · ยืม `borrow_date=2026-10-01` · `return_date=2026-10-16` ควร**ไม่ผ่าน** (15 วัน) · test พบว่า `2026-10-16` ผ่าน validator ด้วย
- **วิธีทำซ้ำ:** `npm test --prefix api -- loanValidator` → เห็น case "15 days should fail" ไม่ล้ม (ต้องล้ม)
- **เครื่องมือ:** `vitest --reporter verbose` · อ่าน `loanValidator.js` → function `validateLoan` · เห็นว่าคำนวณระยะด้วย string compare `return_date - borrow_date` ไม่ได้ parse เป็น Date
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/validators/loanValidator.js` บรรทัด ~22
  ```js
  // ของเดิม — string substring ไม่ใช่วันจริง
  const days = Number(return_date.slice(8,10)) - Number(borrow_date.slice(8,10));
  if (days > 14) return { ok: false, ... };
  ```
  วิธีนี้พลาด 2 แบบ: (1) ข้ามเดือน `10-30 → 11-02` คำนวณเป็น `2 - 30 = -28` · (2) ปล่อย `01 → 16` ผ่าน เพราะ `15 > 14` แต่ `.slice(8,10)` ตัดเฉพาะวันที่ (ไม่คิดเดือน) → ถ้าเดือนต่างกันผิดหมด
- **วิธีแก้ (commit `f277bec`):** parse ด้วย `new Date(iso)` + หาผลต่าง ms → day:
  ```js
  const ms = new Date(return_date) - new Date(borrow_date);
  const days = Math.round(ms / 86_400_000);
  if (days < 1 || days > 14) return { ok:false, errors:['return_date ต้องอยู่ภายใน 1-14 วันจาก borrow_date'] };
  ```
- **test ที่กัน:** `api/tests/unit/loanValidator.test.js` cases: "14 วันพอดีผ่าน" · "15 วันไม่ผ่าน" · "ข้ามเดือนคำนวณถูก" · "return_date ก่อน borrow_date ไม่ผ่าน"
