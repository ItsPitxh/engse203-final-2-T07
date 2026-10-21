# Release Checklist — v1.0.0

> ติ๊ก `[x]` เมื่อทำแล้ว **พร้อมใส่หลักฐาน** (คำสั่งที่รัน · ลิงก์ · ภาพ) · ข้อที่ทำไม่ได้ ให้ติ๊กแล้วเขียน `ยกเว้น: <เหตุผล>`
> ผู้ตรวจ: <ชื่อคนที่ตรวจรอบสุดท้าย> · วันที่ <วันที่>

## โค้ดและการทดสอบ

- [x] `npm test` ผ่านทั้งหมด (api + frontend) — หลักฐาน: จำนวน test ที่ผ่าน ______ · ลิงก์ CI run ล่าสุด ______
- [x] `npm run build` ได้ไม่มี error
- [x] `node --disable-warning=ExperimentalWarning check-project.mjs --online` ผ่านทุกข้อ (หรือระบุข้อที่ยกเว้น)

## ความปลอดภัย

- [x] ไม่มี secret ใน git — `git ls-files | grep .env` เจอแค่ `.env.example` (และ `frontend/.env.production`)
- [x] `api/.env.example` มีตัวแปรครบ ค่าว่าง
- [x] `JWT_SECRET` ตั้งบน Render แล้ว · ลองลบแล้ว deploy → ระบบไม่ยอม start (fail fast)
- [x] บน production ตั้ง `STAFF_EMAIL` + `STAFF_PASSWORD` แล้ว · ลอง login ด้วยรหัสใน seed → ไม่ผ่าน
- [x] `npm audit --prefix api` และ `--prefix frontend` ไม่มีระดับ high / critical (หรืออธิบายได้)

## เอกสาร

- [x] README บอกวิธีติดตั้ง · รัน · test · deploy · URL · บัญชีทดสอบ · การใช้ AI
- [x] `API_CONTRACT.md` ตรงกับโค้ดจริงทุก endpoint
- [x] `DEBUG_LOG.md` มี bug จริงของโปรเจกต์อย่างน้อย 2 ตัว

## Deploy

- [x] `/api/health` บน URL จริงตอบ 200 — URL: ______
- [x] ลองใช้งานจริงบน URL: ส่งคำขอ → login เจ้าหน้าที่ → เปลี่ยนสถานะ → ลบ · และคนทั่วไปทำ PUT/DELETE ไม่ได้
- [x] เปิดบนมือถือแล้วใช้งานได้

## ปล่อยเวอร์ชัน

- [x] tag `v1.0.0` ชี้ commit เดียวกับที่ deploy อยู่ — `git tag v1.0.0 && git push origin v1.0.0`
