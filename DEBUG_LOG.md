# บันทึกการไล่ปัญหา (Debug Log) — T07 ยืม-คืนอุปกรณ์ชมรม

แต่ละ bug ตอบ 6 ข้อ: อาการ → ทำซ้ำ → เครื่องมือ → สาเหตุ → วิธีแก้ → test ที่กัน

> **หัวข้อ "T07" ด้านล่าง = bug จริงของโปรเจกต์นี้** (ไม่ใช่ bug ที่ยกมาจาก LAB 12 Campus Service)
> ส่วน "LAB (regression)" คือ bug เดิมจาก LAB 12/13 ที่ยังมี regression test คุ้มครองใน repo นี้

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

---

## 🟡 LAB (regression · inherited จาก LAB 12 Campus Service)

ด้านล่างเป็น bug เดิมจาก LAB 12 ที่ยังมี regression test คุ้มครองใน repo นี้ (test files `password.test.js` + T07's `loans.test.js`) · ไม่ใช่ bug ใหม่ของโปรเจกต์

### LAB #A · ค่าขอบรายละเอียด 10 ตัวอักษร (LAB 12)
- **สาเหตุ:** `validateInput` ใช้ `length <= MIN_DETAILS` → 10 ตัวพอดีถูกนับว่าไม่ผ่าน
- **แก้:** เปลี่ยนเป็น `length < MIN_DETAILS` · **test ที่กัน:** unit test "ตรงขอบพอดี"

### LAB #B · `nextId()` รหัสซ้ำหลังลบรายการกลาง (LAB 12)
- **สาเหตุ:** `COUNT(*) + 1` ลดลงเมื่อลบ · ชนกับ id ที่เหลือ
- **แก้:** `ORDER BY id DESC LIMIT 1` + 1 · **test ที่กัน:** integration "ลบ-เพิ่มใหม่ → รหัสไม่ซ้ำ"

### LAB #C · 500 แทน 404 เมื่อ update คำร้องที่ไม่มี (LAB 12)
- **สาเหตุ:** log `updated.id` อยู่ก่อนตรวจ `if (!updated)`
- **แก้:** ย้าย log ไปหลัง guard · **test ที่กัน:** integration "คำร้องไม่มีอยู่ → 404"
