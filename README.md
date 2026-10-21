# ระบบยืม-คืนอุปกรณ์ชมรม (Club Equipment Loan System) — มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา

**ENGSE203 Final Term Project · Section 2 · หัวข้อ T07**

🌐 **URL:** https://engse203-final-2-t07.onrender.com · 🏷️ เวอร์ชัน `v1.0.0`

ระบบจัดการยืม-คืนอุปกรณ์ชมรม ถูกพัฒนาขึ้นเพื่อแก้ปัญหาการยืมอุปกรณ์แบบเดิมที่มักเกิดความล่าช้า ขาดการบันทึกสถานะที่ชัดเจน และตรวจสอบความพร้อมของอุปกรณ์ได้ยาก โดยเปิดให้บุคคลทั่วไปสามารถตรวจสอบรายการและส่งคำขอยืมได้ทันที พร้อมระบบจัดการสำหรับเจ้าหน้าที่ในการอนุมัติ ติดตาม และบริหารจัดการอุปกรณ์ได้อย่างมีประสิทธิภาพ

## สมาชิก ทีม DontThink.move

| ชื่อ | รหัสนักศึกษา | บทบาท | รับผิดชอบ |
|---|---|---|---|
| วรสิทธิ์ บุญยปรีดี | 68543210017-8 | Front-end | พัฒนาส่วนติดต่อผู้ใช้ (UI), หน้าจอรายการ, ฟอร์มขอยืมอุปกรณ์ และระบบการจัดการฝั่งไคลเอนต์ |
| พิชฌ์ สินธรสวัสดิ์ | 67543210061-7 | Back-end + DevOps | พัฒนา API, ฐานข้อมูล, ระบบความปลอดภัย (JWT), การทดสอบระบบ และการ Deploy ขึ้นเซิร์ฟเวอร์ |

## ความสามารถของระบบ

| ใคร | ทำอะไรได้ |
|---|---|
| คนทั่วไป | ดูรายการอุปกรณ์ · กรองสถานะคำขอ · ดูรายละเอียด · ส่งคำขอยืมอุปกรณ์ |
| เจ้าหน้าที่ (login) | ทุกอย่างข้างบน + เปลี่ยนสถานะคำขอ (รออนุมัติ, กำลังยืม, คืนแล้ว, เลยกำหนด) · ลบคำขอ |



|<img width="1470" height="862" alt="image" src="https://github.com/user-attachments/assets/2333d8d9-172f-415f-8a23-40897305e57b" /> |<img width="473" height="697" alt="image" src="https://github.com/user-attachments/assets/dd4950c0-4b27-402b-9b68-35777827dc42" />

ภาพหน้าจอ (desktop + มือถือ): *(เพิ่มภาพหน้าจอ desktop + มือถือก่อนส่ง v1.0.0)*

## ข้อมูล

**ตาราง (SQLite):**

| ตาราง | ฟิลด์หลัก | ความสัมพันธ์ |
|---|---|---|
| `users` | id · name · department · email · role · password_hash | — |
| `equipment` | id (EQ-NNN) · name · total_qty · location · category | ถูกอ้างโดย `loans` |
| `loans` | id (LN-NNN) · borrower_id · equipment_id · quantity · borrow_date · return_date · purpose · status | FK → users · FK → equipment |

**สถานะคำขอยืม:** `requested` → `borrowed` → `returned` / `overdue`

**กฎเฉพาะของ T07:**
1. วันคืนต้องหลังวันยืม และ**ไม่เกิน 14 วัน**
2. จำนวนที่ขอยืมต้อง**ไม่เกินจำนวนคงเหลือ** = `total_qty` − SUM(`quantity`) ของ loans ที่สถานะ `requested` · `borrowed` · `overdue` (ไม่นับ `returned`)

## ติดตั้ง

```bash
git clone https://github.com/ItsPitxh/engse203-final-2-T-07.git
cd engse203-final-2-T-07
npm install --prefix api
npm install --prefix frontend
cp api/.env.example api/.env        # แล้วใส่ JWT_SECRET ของเครื่องตัวเอง
npm run db:setup --prefix api
```

## วิธีรัน (development)

```bash
npm run dev --prefix api            # http://localhost:3001
npm run dev --prefix frontend       # http://localhost:5173
```

## การทดสอบ

```bash
npm test                            # api + frontend
npm run coverage                    # coverage ของ api
node --disable-warning=ExperimentalWarning check-project.mjs
```

| ชุด test | จำนวน |
|---|---:|
| api unit | 10 |
| api integration | 12 |
| frontend | 9 |

## Deploy

Deploy ขึ้น **Render** (Singapore · plan free) ผ่าน Blueprint (`render.yaml` ที่ root)

**ตัวแปรบน Render:**
- `NODE_ENV=production` · `NODE_VERSION=22` (จาก render.yaml)
- `JWT_SECRET` — Render สุ่มให้ (`generateValue: true`)
- `STAFF_EMAIL` + `STAFF_PASSWORD` — ตั้งเองในหน้า Environment (ไม่ commit ใน git · แจ้งผู้สอนทาง LMS)

**ข้อจำกัด Render free tier:**
- Server หลับหลังไม่ใช้งาน 15 นาที · เปิดครั้งแรก cold start ~30–60 วินาที
- SQLite รีเซ็ตเป็น seed ทุกครั้งที่ redeploy · ทีมคู่ยอมรับได้
- รายละเอียดเพิ่มใน [DEPLOY.md](DEPLOY.md)

## บัญชีทดสอบ

| ที่ไหน | อีเมล | รหัสผ่าน |
|---|---|---|
| development (จาก seed) | `staff@rmutl.ac.th` | `staff1234` |
| production | `staff@rmutl.ac.th` | **แจ้งผู้สอนแยก — ห้ามเขียนในไฟล์นี้** |

## เอกสารอื่น

- [API_CONTRACT.md](API_CONTRACT.md) · [DEBUG_LOG.md](DEBUG_LOG.md) · [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) · [TEAM_CONTRACT.md](TEAM_CONTRACT.md)

## การใช้ AI

| ใคร | ใช้เครื่องมืออะไร | ใช้ทำอะไร | ตรวจ/แก้อย่างไร |
|---|---|---|---|
| วรสิทธิ์ บุญยปรีดี / พิชฌ์ สินธรสวัสดิ์ | Gemini/claude | ช่วยออกแบบโครงสร้างโค้ด ร่างหน้าจอ และตรวจสอบการเขียนสคริปต์ Git | ตรวจทานความถูกต้องและทำความเข้าใจโค้ดทุกบรรทัดก่อนนำมาใช้งานจริง |

> ทุกคนอธิบายโค้ดที่ส่งได้ทุกบรรทัด
