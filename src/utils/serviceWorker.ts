// Utility สำหรับจัดการ Service Worker และ Browser Notifications

class ServiceWorkerManager {
  private registration: globalThis.ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private messageCallbacks: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // ตรวจสอบว่ารองรับ Service Worker หรือไม่
  public isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  // ตรวจสอบว่ารองรับ Notifications หรือไม่
  public isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  // ลงทะเบียน Service Worker
  public async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('[SW] Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available');
            }
          });
        }
      });

      // ฟังข้อความจาก Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event.data);
      });

      console.log('[SW] Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      return false;
    }
  }

  // จัดการข้อความจาก Service Worker
  private handleMessage(data: { type: string; payload?: any }) {
    const { type, payload } = data;
    const callbacks = this.messageCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(payload));
    }
  }

  // ลงทะเบียน callback สำหรับข้อความจาก Service Worker
  public onMessage(type: string, callback: (data: any) => void): () => void {
    if (!this.messageCallbacks.has(type)) {
      this.messageCallbacks.set(type, []);
    }
    this.messageCallbacks.get(type)!.push(callback);

    // คืนค่า function สำหรับยกเลิกการลงทะเบียน
    return () => {
      const callbacks = this.messageCallbacks.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // ส่งข้อความไปยัง Service Worker
  public async sendMessage(type: string, payload?: any): Promise<void> {
    if (!this.registration?.active) {
      console.warn('[SW] Service Worker not active');
      return;
    }

    this.registration.active.postMessage({ type, payload });
  }

  // ขอสิทธิ์การแจ้งเตือน
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('[SW] Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // ตรวจสอบสิทธิ์การแจ้งเตือนปัจจุบัน
  public getNotificationPermission(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  // ตรวจสอบว่ามีสิทธิ์แจ้งเตือนหรือไม่
  public hasNotificationPermission(): boolean {
    return this.getNotificationPermission() === 'granted';
  }

  // ส่งการแจ้งเตือนทันที (ใช้เมื่อหน้าเว็บเปิดอยู่)
  public async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.hasNotificationPermission()) {
      return;
    }

    try {
      if (this.registration) {
        await this.registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('[SW] Error showing notification:', error);
    }
  }

  // ตรวจสอบราคาและส่งไปยัง Service Worker
  public async checkPriceAlerts(currentPrice: number, alerts: any[]): Promise<void> {
    await this.sendMessage('CHECK_PRICE_ALERTS', { currentPrice, alerts });
  }

  // ตั้ง schedule ตรวจสอบราคา
  public async schedulePriceChecks(intervalMs: number): Promise<void> {
    await this.sendMessage('SCHEDULE_NEXT_CHECK', { intervalMs });
  }

  // หยุดการตรวจสอบราคา
  public async stopPriceChecks(): Promise<void> {
    await this.sendMessage('STOP_CHECKS');
  }

  // อัปเดต Service Worker
  public async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // ถอดการลงทะเบียน Service Worker
  public async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    }
    return false;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;
