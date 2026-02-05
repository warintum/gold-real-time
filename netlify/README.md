# Deploy บน Netlify (แนะนำ)

## ขั้นตอน

### 1. สร้าง Netlify Account
- ไปที่ https://app.netlify.com/signup
- ใช้ GitHub account ล็อกอินได้เลย

### 2. Deploy จาก GitHub
1. คลิก **"Add new site"** → **"Import an existing project"**
2. เลือก **GitHub** แล้วเลือก repository `gold-real-time-web`
3. ตั้งค่า Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. คลิก **"Deploy site"**

### 3. ตั้งค่า Environment Variables (ถ้าจำเป็น)
ไปที่ **Site settings** → **Environment variables**
- ไม่ต้องตั้งค่าอะไรเพิ่มสำหรับโปรเจคนี้

### 4. รอ Deploy เสร็จ
- รอสัก 1-2 นาที
- Netlify จะให้ URL มา เช่น `https://gold-real-time-web-xxx.netlify.app`

### 5. แก้ไข Frontend
ใน `src/hooks/useBinanceChart.ts` แก้:

```typescript
const WORKER_URL = 'https://gold-real-time-web-xxx.netlify.app/api';
```

หรือใช้ relative path ก็ได้ (แนะนำ):
```typescript
const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    return '/api/binance';
  }
  // Production: ใช้ Netlify Function
  return '/api';
};
```

## ทดสอบ Function
หลัง deploy ทดสอบที่:
```
https://your-site.netlify.app/api/fapi/v1/ticker/price?symbol=XAUUSDT
```

## ข้อดีของ Netlify
- ฟรี 100GB bandwidth/เดือน
- Functions รันได้ 125,000 requests/เดือน (ฟรี)
- ไม่ถูก Binance บล็อกเหมือน Cloudflare
- Deploy อัตโนมัติเมื่อ push ขึ้น GitHub
