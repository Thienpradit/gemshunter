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
