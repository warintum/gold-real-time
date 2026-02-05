import { useState } from 'react';
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
  VolumeX
} from 'lucide-react';
import { usePriceAlerts } from '@/hooks/useGoldPrice';
import type { PriceAlert } from '@/types/gold';

interface PriceAlertSectionProps {
  currentPrice: number;
}

const AlertItem = ({ 
  alert, 
  currentPrice, 
  onToggle, 
  onRemove 
}: { 
  alert: PriceAlert; 
  currentPrice: number;
  onToggle: () => void;
  onRemove: () => void;
}) => {
  const isTriggered = alert.type === 'above' 
    ? currentPrice >= alert.targetPrice 
    : currentPrice <= alert.targetPrice;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isTriggered 
        ? 'bg-gold/10 border-gold/50' 
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
          <Badge className="bg-gold/20 text-gold border-gold/50">
            <AlertCircle className="w-3 h-3 mr-1" />
            ถึงเป้าแล้ว!
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
  const { alerts, addAlert, removeAlert, toggleAlert, checkAlerts } = usePriceAlerts();
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggeredAlerts = checkAlerts(currentPrice);

  const handleAddAlert = () => {
    const price = parseFloat(newAlertPrice);
    if (price > 0) {
      addAlert(price, newAlertType);
      setNewAlertPrice('');
    }
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
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-muted-foreground"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
                      onRemove={() => removeAlert(alert.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Notification Permission */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-400 font-medium mb-1">การแจ้งเตือน</p>
                  <p className="text-muted-foreground">
                    การแจ้งเตือนจะแสดงบนหน้าเว็บเมื่อราคาถึงเป้าหมาย 
                    ข้อมูลจะถูกบันทึกไว้ในเบราว์เซอร์ของคุณ
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
