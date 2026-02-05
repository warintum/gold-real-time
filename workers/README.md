# Cloudflare Worker - Binance API Proxy

## วิธีตั้งค่า

### 1. สร้าง Cloudflare Account
- ไปที่ https://dash.cloudflare.com/sign-up
- ใช้ email ธรรมดาได้ (ไม่ต้องใช้ domain)

### 2. สร้าง Worker
1. Login เข้า Cloudflare Dashboard
2. ไปที่ **Workers & Pages** (ซ้ายเมนู)
3. คลิก **Create application**
4. คลิก **Create Worker**
5. ตั้งชื่อ: `binance-proxy` (หรือชื่ออื่นก็ได้)
6. คลิก **Deploy**

### 3. แก้ไข Worker Code
1. หลัง deploy เสร็จ คลิก **Edit code**
2. ลบโค้ดที่มีอยู่ทั้งหมด
3. Copy โค้ดจาก `binance-proxy.js` ในโฟลเดอร์นี้
4. Paste ลงไป
5. คลิก **Save and deploy**

### 4. ทดสอบ Worker
เปิด browser ไปที่:
```
https://binance-proxy.your-account.workers.dev/fapi/v1/ticker/price?symbol=XAUUSDT
```

ถ้าเห็นข้อมูลราคา = สำเร็จ!

### 5. แก้ไข Frontend
ในไฟล์ `src/hooks/useBinanceChart.ts` ให้แก้:

```typescript
// จาก
const url = `/api/binance/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

// เป็น
const WORKER_URL = 'https://binance-proxy.your-account.workers.dev';
const url = `${WORKER_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
```

## ข้อจำกัด Free Tier
- 100,000 requests/วัน
- 10ms CPU time/request
- สำหรับแอพทั่วไปเพียงพอมาก

## การตั้งค่า Custom Domain (ถ้าต้องการ)
1. ไปที่ Worker → **Triggers** tab
2. เพิ่ม Custom Domain ที่ต้องการ
