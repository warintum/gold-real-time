import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Volume2,
  VolumeX,
  BellRing,
  BellOff,
  Play,
  Settings
} from 'lucide-react';
import { usePriceAlerts } from '@/hooks/useGoldPrice';
import { notificationSound } from '@/utils/notificationSound';
import { serviceWorkerManager } from '@/utils/serviceWorker';
import type { PriceAlert } from '@/types/gold';

interface PriceAlertSectionProps {
  currentPrice: number;
}

interface AlertSettings {
  soundEnabled: boolean;
  notificationEnabled: boolean;
  browserNotifications: boolean;
}

const AlertItem = ({ 
  alert, 
  currentPrice, 
  onToggle, 
  onRemove,
  wasNotified
}: { 
  alert: PriceAlert; 
  currentPrice: number;
  onToggle: () => void;
  onRemove: () => void;
  wasNotified: boolean;
}) => {
  const isTriggered = alert.type === 'above' 
    ? currentPrice >= alert.targetPrice 
    : currentPrice <= alert.targetPrice;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
      isTriggered 
        ? 'bg-gold/10 border-gold/50 shadow-lg shadow-gold/10' 
        : 'bg-secondary/30 border-border'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          alert.type === 'above' 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'above' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <div>
          <p className="font-medium text-foreground number-thai">
            {alert.targetPrice.toLocaleString('th-TH')} บาท
          </p>
          <p className="text-xs text-muted-foreground">
            {alert.type === 'above' ? 'เมื่อราคาขึ้นถึง' : 'เมื่อราคาลงถึง'}
          </p>
        </div>
        {isTriggered && (
          <Badge className={`${wasNotified ? 'bg-gold/20 text-gold' : 'bg-emerald-500/20 text-emerald-400 animate-pulse'} border-gold/50`}>
            <AlertCircle className="w-3 h-3 mr-1" />
            {wasNotified ? 'ถึงเป้าแล้ว!' : 'ถึงเป้า!'}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={alert.isActive}
          onCheckedChange={onToggle}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const PriceAlertSection = ({ currentPrice }: PriceAlertSectionProps) => {
  const { 
    alerts, 
    triggeredAlerts, 
    addAlert, 
    removeAlert, 
    toggleAlert, 
    markAlertNotified 
  } = usePriceAlerts(currentPrice);
  
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above');
  const [settings, setSettings] = useState<AlertSettings>({
    soundEnabled: notificationSound.isEnabled(),
    notificationEnabled: true,
    browserNotifications: serviceWorkerManager.hasNotificationPermission(),
  });
  const [showSettings, setShowSettings] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    serviceWorkerManager.getNotificationPermission()
  );

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('goldAlertSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
        notificationSound.setEnabled(parsed.soundEnabled ?? true);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem('goldAlertSettings', JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
  }, [settings]);

  // Handle sound toggle
  const handleSoundToggle = useCallback((enabled: boolean) => {
    notificationSound.setEnabled(enabled);
    saveSettings({ soundEnabled: enabled });
    if (enabled) {
      notificationSound.playTest();
    }
  }, [saveSettings]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    const permission = await serviceWorkerManager.requestNotificationPermission();
    setPermissionStatus(permission);
    saveSettings({ browserNotifications: permission === 'granted' });
    
    if (permission === 'granted') {
      // Send test notification
      serviceWorkerManager.showNotification('🔔 การแจ้งเตือนพร้อมใช้งาน', {
        body: 'คุณจะได้รับการแจ้งเตือนเมื่อราคาทองถึงเป้าหมาย',
        icon: '/gold-icon.png',
        tag: 'test-notification'
      });
    }
  }, [saveSettings]);

  // Handle triggered alerts
  useEffect(() => {
    if (triggeredAlerts.length > 0 && settings.notificationEnabled) {
      // Play sound for newly triggered alerts
      const newTriggers = triggeredAlerts.filter(alert => {
        const lastNotified = alert.lastNotified ? new Date(alert.lastNotified).getTime() : 0;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        return now - lastNotified > fiveMinutes;
      });

      if (newTriggers.length > 0) {
        notificationSound.playSuccess();
        
        // Mark as notified
        newTriggers.forEach(alert => {
          markAlertNotified(alert.id);
        });

        // Show browser notification if permitted
        if (settings.browserNotifications && permissionStatus === 'granted') {
          newTriggers.forEach(alert => {
            const direction = alert.type === 'above' ? 'ขึ้น' : 'ลง';
            serviceWorkerManager.showNotification('🔔 แจ้งเตือนราคาทอง', {
              body: `ราคาทอง${direction}ถึง ${alert.targetPrice.toLocaleString('th-TH')} บาท`,
              icon: '/gold-icon.png',
              tag: `gold-alert-${alert.id}`,
              requireInteraction: true,
            });
          });
        }
      }
    }
  }, [triggeredAlerts, settings, permissionStatus, markAlertNotified]);

  const handleAddAlert = () => {
    const price = parseFloat(newAlertPrice);
    if (price > 0) {
      addAlert(price, newAlertType);
      notificationSound.playAdd();
      setNewAlertPrice('');
    }
  };

  const handleRemoveAlert = (id: string) => {
    removeAlert(id);
    notificationSound.playRemove();
  };

  const handleTestSound = () => {
    notificationSound.playTest();
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gold" />
                  ระบบแจ้งเตือนราคา
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ตั้งค่าการแจ้งเตือนเมื่อราคาถึงเป้าหมาย
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-muted-foreground"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                {triggeredAlerts.length > 0 && (
                  <Badge className="bg-gold/20 text-gold border-gold/50 animate-pulse">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {triggeredAlerts.length} การแจ้งเตือน
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mx-6 mb-4 p-4 bg-secondary/50 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                ตั้งค่าการแจ้งเตือน
              </h4>
              <div className="space-y-3">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">เสียงแจ้งเตือน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleTestSound}
                      className="h-7 px-2"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      ทดสอบ
                    </Button>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={handleSoundToggle}
                    />
                  </div>
                </div>

                {/* Browser Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {permissionStatus === 'granted' ? (
                      <BellRing className="w-4 h-4 text-emerald-400" />
                    ) : permissionStatus === 'denied' ? (
                      <BellOff className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">แจ้งเตือนในเบราว์เซอร์</span>
                  </div>
                  {permissionStatus !== 'granted' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestNotificationPermission}
                      className="h-7 text-xs"
                    >
                      {permissionStatus === 'denied' ? 'ถูกบล็อก' : 'เปิดใช้งาน'}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                      เปิดใช้งาน
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <CardContent className="space-y-6">
            {/* Add New Alert */}
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                เพิ่มการแจ้งเตือนใหม่
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="ราคาเป้าหมาย (บาท)"
                    value={newAlertPrice}
                    onChange={(e) => setNewAlertPrice(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={newAlertType === 'above' ? 'default' : 'outline'}
                    onClick={() => setNewAlertType('above')}
                    className={newAlertType === 'above' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    ขึ้นถึง
                  </Button>
                  <Button
                    variant={newAlertType === 'below' ? 'default' : 'outline'}
                    onClick={() => setNewAlertType('below')}
                    className={newAlertType === 'below' ? 'bg-rose-500 hover:bg-rose-600' : ''}
                  >
                    <TrendingDown className="w-4 h-4 mr-1" />
                    ลงถึง
                  </Button>
                </div>
                <Button
                  onClick={handleAddAlert}
                  disabled={!newAlertPrice || parseFloat(newAlertPrice) <= 0}
                  className="bg-gold text-primary-foreground hover:bg-gold-dark"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  เพิ่ม
                </Button>
              </div>
            </div>

            {/* Current Price Reference */}
            <div className="flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/20">
              <span className="text-sm text-muted-foreground">ราคาปัจจุบัน</span>
              <span className="text-lg font-bold text-gold number-thai">
                {currentPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
              </span>
            </div>

            {/* Alert List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                รายการแจ้งเตือน ({alerts.length})
              </h4>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ยังไม่มีการแจ้งเตือน</p>
                  <p className="text-sm">เพิ่มการแจ้งเตือนเพื่อรับแจ้งเตือนเมื่อราคาถึงเป้าหมาย</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      currentPrice={currentPrice}
                      onToggle={() => toggleAlert(alert.id)}
                      onRemove={() => handleRemoveAlert(alert.id)}
                      wasNotified={!!alert.lastNotified}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Notification Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-400 font-medium mb-1">การแจ้งเตือน</p>
                  <p className="text-muted-foreground">
                    การแจ้งเตือนจะแสดงทั้งในหน้าเว็บและแจ้งเตือนในเบราว์เซอร์ (หากเปิดใช้งาน) 
                    เมื่อราคาถึงเป้าหมาย ข้อมูลจะถูกบันทึกไว้ในเบราว์เซอร์ของคุณ
                  </p>
                  {permissionStatus === 'denied' && (
                    <p className="text-rose-400 text-xs mt-2">
                      ⚠️ การแจ้งเตือนในเบราว์เซอร์ถูกบล็อก กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
