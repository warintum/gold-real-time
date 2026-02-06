// Gold Price Alert Service Worker
// ทำงานเบื้องหลังเพื่อตรวจสอบราคาทองและส่งการแจ้งเตือน

const CACHE_NAME = 'gold-price-alert-v1';

// ติดตั้ง Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// เปิดใช้งาน Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// รับข้อความจาก main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  if (type === 'CHECK_PRICE_ALERTS') {
    checkPriceAlerts(payload.currentPrice, payload.alerts);
  } else if (type === 'SCHEDULE_NEXT_CHECK') {
    scheduleNextCheck(payload.interval);
  }
});

// ตรวจสอบการแจ้งเตือนราคา
function checkPriceAlerts(currentPrice, alerts) {
  if (!alerts || !Array.isArray(alerts)) return;
  
  const triggeredAlerts = alerts.filter(alert => {
    if (!alert.isActive) return false;
    if (alert.type === 'above' && currentPrice >= alert.targetPrice) return true;
    if (alert.type === 'below' && currentPrice <= alert.targetPrice) return true;
    return false;
  });

  triggeredAlerts.forEach(alert => {
    // ตรวจสอบว่าเคยแจ้งเตือน alert นี้ไปแล้วหรือยัง (ภายใน 5 นาที)
    const lastNotified = alert.lastNotified ? new Date(alert.lastNotified).getTime() : 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastNotified > fiveMinutes) {
      sendNotification(alert, currentPrice);
      // อัปเดตเวลาแจ้งเตือนล่าสุด
      alert.lastNotified = new Date().toISOString();
    }
  });
}

// ส่งการแจ้งเตือน
function sendNotification(alert, currentPrice) {
  const title = '🔔 แจ้งเตือนราคาทอง';
  const direction = alert.type === 'above' ? 'ขึ้น' : 'ลง';
  const body = `ราคาทอง${direction}ถึง ${alert.targetPrice.toLocaleString('th-TH')} บาท (ปัจจุบัน: ${currentPrice.toLocaleString('th-TH')} บาท)`;
  
  const options = {
    body: body,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🪙</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🪙</text></svg>',
    tag: `gold-alert-${alert.id}`,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'เปิดแอป'
      },
      {
        action: 'dismiss',
        title: 'ปิด'
      }
    ],
    data: {
      alertId: alert.id,
      targetPrice: alert.targetPrice,
      currentPrice: currentPrice
    }
  };

  self.registration.showNotification(title, options);
}

// จัดการเมื่อคลิกที่ notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action } = event;
  
  if (action === 'open' || !action) {
    // เปิดหรือ focus หน้าเว็บ
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            // Focus หน้าเว็บที่เปิดอยู่
            const client = clientList[0];
            client.focus();
            // ส่งข้อความให้หน้าเว็บทราบ
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              payload: event.notification.data
            });
          } else {
            // เปิดหน้าเว็บใหม่
            self.clients.openWindow('/');
          }
        })
    );
  }
});

// จัดการ push notification จาก server (ถ้ามี)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🪙</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🪙</text></svg>',
      tag: data.tag || 'gold-push',
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'เปิดแอป' },
        { action: 'dismiss', title: 'ปิด' }
      ],
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Background sync (สำหรับตรวจสอบราคา periodically)
let checkInterval = null;

function scheduleNextCheck(intervalMs) {
  // ล้าง interval เดิม
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // ตั้ง interval ใหม่
  checkInterval = setInterval(async () => {
    try {
      // ดึงราคาล่าสุดจาก API
      const response = await fetch('https://api.chnwt.dev/thai-gold-api/latest');
      const data = await response.json();
      
      if (data.status === 'success' && data.response) {
        const price = data.response;
        const currentPrice = parseFloat(price.price?.gold_bar?.sell?.replace(/,/g, '')) || 0;
        
        // ส่งข้อมูลให้ทุก client
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({
            type: 'PRICE_CHECK_RESULT',
            payload: { currentPrice }
          });
        });
      }
    } catch (error) {
      console.error('[SW] Error checking price:', error);
    }
  }, intervalMs);
}

// หยุดการตรวจสอบเมื่อไม่จำเป็น
self.addEventListener('message', (event) => {
  if (event.data.type === 'STOP_CHECKS') {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }
});
