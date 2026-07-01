# ระบบ ERP — โรงงานชูรสยายปู

เว็บแอปไฟล์เดียว (ไม่ต้องมีเซิร์ฟเวอร์) เก็บข้อมูลถาวรบนคลาวด์ Supabase

## วิธีนำขึ้น GitHub (แบบง่ายสุด — ไม่ต้องใช้คำสั่ง)

1. เข้า https://github.com/mktchooros/ERP  (repo ที่ยังว่างอยู่)
2. กดปุ่ม **Add file → Upload files**
3. ลาก **ทุกไฟล์ในโฟลเดอร์ `deploy/` นี้** (index.html และไฟล์ .jsx / .js / รูป ทั้งหมด) เข้าไปวาง
   - ⚠️ วางไฟล์ให้อยู่ที่ **ราก (root)** ของ repo — ไม่ต้องมีโฟลเดอร์ deploy ครอบ
4. กด **Commit changes**

## วิธีเปิดผ่าน URL (Deploy)

**ตัวเลือก A — Cloudflare Pages (แนะนำ ฟรี)**
1. เข้า https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. เลือก repo `mktchooros/ERP`
3. Build command: เว้นว่าง | Output directory: `/` (ราก)
4. Save and Deploy → จะได้ URL เช่น `https://erp-xxx.pages.dev`

**ตัวเลือก B — Vercel (ฟรี)**
1. เข้า https://vercel.com → Add New → Project → เลือก repo
2. Framework Preset: **Other** | ไม่ต้องตั้ง build
3. Deploy → ได้ URL `https://xxx.vercel.app`

เปิดใช้งานจาก URL นั้นได้เลย ข้อมูลจะซิงค์ขึ้นคลาวด์อัตโนมัติ (ป้าย "ซิงค์แล้ว ✓" มุมขวาล่าง)

## ข้อมูลถูกเก็บที่ไหน
- ทุกอย่างซิงค์ขึ้น Supabase (ตั้งค่าไว้ในไฟล์ `supabase-config.js`)
- ถ้าเปลี่ยนเครื่อง ให้กดปุ่ม **↻ ดึงข้อมูลล่าสุด** ก่อนเริ่มทำงาน
