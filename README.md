# นักล่าอัญมณี — เซิร์ฟเวอร์เกมออนไลน์

เซิร์ฟเวอร์ Node.js ส่งหน้าเกม (`public/index.html`) และให้บริการระบบบัญชี เซฟบนคลาวด์ และอันดับจริง
โครงแบบเดียวกับรถไฟซ่า: GitHub → Render (สิงคโปร์) → ฐานข้อมูล Postgres (เช่น Neon)

## ไฟล์
- `server.js` — ส่งหน้าเกม + `/health` + `/version`
- `accounts.js` — `/api/*`: สมัคร เข้าสู่ระบบ ลืมรหัสผ่าน (รหัสกู้คืน) เซฟ อันดับ
- `public/index.html` — ตัวเกม (สร้างจากโค้ดเกมด้วย build.sh)
- `render.yaml` — ค่าตั้งของ Render

## ค่าที่ต้องตั้งบน Render (Environment)
- `DATABASE_URL` — ลิงก์เชื่อมต่อ Postgres (จำเป็น ถ้าไม่ใส่ ระบบบัญชีจะปิดบน Render)
- `TOKEN_SECRET` — ข้อความสุ่มยาว ๆ ใช้เซ็นการเข้าสู่ระบบ (แนะนำให้ตั้ง)

## รันในเครื่อง
```
npm install
npm start            # http://localhost:3000 (ไม่มี DATABASE_URL = เก็บในไฟล์ data/players.json ไว้ทดสอบเท่านั้น)
```

## ระบบกันโกง (ตลาดเทรด + ตรวจเงิน)

- `market.js` ตลาดเทรดพลอยระหว่างผู้เล่น (ทุกรายการทำที่เซิร์ฟเวอร์)
- `econ.js` ตรวจเงินและของในทุกเซฟ ใช้สูตรราคาจาก `econ.gen.js`
- `econ.gen.js` สร้างอัตโนมัติจาก `public/index.html` — **ทุกครั้งที่แก้เกมต้องสร้างใหม่** (เลขบิลด์ต้องตรงกับหน้าเกม ไม่งั้นเซิร์ฟเวอร์ปิดการตรวจเอง):
  1. เปิดเซิร์ฟเวอร์ไฟล์ของ `public/` (เช่น `python3 -m http.server 3199`)
  2. `node tools/snap-econ.js` แล้ว `node tools/gen-econ.js` (ต้องมี playwright, acorn, acorn-walk)
- ตัวแปรบน Render: `ECON_MODE` = `log` (ค่าเริ่มต้น: ตรวจและจดบันทึกอย่างเดียว) / `enforce` (บังคับใช้: เซิร์ฟเวอร์สรุปยอดเงินเอง เซฟที่ผิดกติกาไม่ถูกบันทึก) / `off`
- บันทึกการตรวจ: ดูคำว่า `AUDIT` ใน Logs ของ Render หรือเรียก `/api/admin/audit` พร้อม header `x-admin-key` = ค่าตัวแปร `ADMIN_KEY` (ต้องตั้งเองบน Render ยาวอย่างน้อย 8 ตัว)
