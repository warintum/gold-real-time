// Utility สำหรับเล่นเสียงแจ้งเตือนราคาทอง
// ใช้ Web Audio API เพื่อไม่ต้องโหลดไฟล์เสียงแยก

class NotificationSound {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    this.enabled = this.loadSoundPreference();
  }

  private loadSoundPreference(): boolean {
    try {
      const saved = localStorage.getItem('goldAlertSoundEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem('goldAlertSoundEnabled', JSON.stringify(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // เล่นเสียงแจ้งเตือนแบบประสบความสำเร็จ (ราคาถึงเป้า)
  public playSuccess(): void {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // สร้างเสียงดนตรีแจ้งเตือน (C-G-C ซักเซส)
      const now = ctx.currentTime;
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(783.99, now + 0.1); // G5
      oscillator.frequency.setValueAtTime(1046.50, now + 0.2); // C6
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }

  // เล่นเสียงแจ้งเตือนแบบทั่วไป
  public playAlert(): void {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      // สร้างเสียง beep แจ้งเตือน
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.setValueAtTime(1100, now + 0.1);
      oscillator.frequency.setValueAtTime(880, now + 0.2);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }

  // เล่นเสียงเมื่อเพิ่ม alert สำเร็จ
  public playAdd(): void {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(659.25, now); // E5
      oscillator.frequency.setValueAtTime(880, now + 0.1); // A5
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (error) {
      console.error('Error playing add sound:', error);
    }
  }

  // เล่นเสียงเมื่อลบ alert
  public playRemove(): void {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, now); // A4
      oscillator.frequency.setValueAtTime(220, now + 0.15);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (error) {
      console.error('Error playing remove sound:', error);
    }
  }

  // เล่นเสียงทดสอบ
  public playTest(): void {
    this.playSuccess();
  }
}

export const notificationSound = new NotificationSound();
export default notificationSound;
