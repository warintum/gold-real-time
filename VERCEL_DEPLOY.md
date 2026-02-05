# Deploy บน Vercel (แนะนำ!)

## ขั้นตอน

### 1. สมัคร Vercel
- ไปที่ https://vercel.com/signup
- ใช้ GitHub account ล็อกอิน

### 2. Import Project
1. คลิก **"Add New..."** → **"Project"**
2. เลือก repository `gold-real-time-web`
3. ตั้งค่า:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. คลิก **"Deploy"**

### 3. รอ Deploy (1-2 นาที)
Vercel จะให้ URL เช่น: `https://gold-real-time-web.vercel.app`

### 4. ทดสอบ API
เปิด URL นี้:
```
https://gold-real-time-web.vercel.app/api/fapi/v1/ticker/price?symbol=XAUUSDT
```
ถ้าเห็นราคา = สำเร็จ! ✅

## ข้อดีของ Vercel
- ✅ ไม่มีปัญหา CORS
- ✅ ฟรี 100GB/เดือน
- ✅ Auto deploy เมื่อ push GitHub
- ✅ Serverless Functions รองรับ
- ✅ เร็วกว่า GitHub Pages

## หมายเหตุ
ถ้าอยากใช้ custom domain ไปที่ Project Settings → Domains
