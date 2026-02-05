import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Minus, ChevronRight, BarChart3, Target, Shield, Activity } from 'lucide-react';
import type { TradingSignal as TradingSignalType } from '@/types/gold';

interface TradingSignalProps {
  signal: TradingSignalType;
}

const SignalIcon = ({ type }: { type: 'buy' | 'sell' | 'hold' }) => {
  switch (type) {
    case 'buy':
      return <TrendingUp className="w-8 h-8" />;
    case 'sell':
      return <TrendingDown className="w-8 h-8" />;
    case 'hold':
      return <Minus className="w-8 h-8" />;
  }
};

const SignalBadge = ({ type, strength }: { type: 'buy' | 'sell' | 'hold'; strength: string }) => {
  const configs = {
    buy: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      label: 'ควรซื้อ',
    },
    sell: {
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/50',
      text: 'text-rose-400',
      label: 'ควรขาย',
    },
    hold: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      label: 'ถือต่อ',
    },
  };

  const config = configs[type];
  const strengthText = {
    strong: 'แรงมาก',
    moderate: 'ปานกลาง',
    weak: 'อ่อน',
  }[strength] || strength;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${config.bg} ${config.border}`}>
      <div className={`${config.text}`}>
        <SignalIcon type={type} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${config.text}`}>{config.label}</p>
        <p className="text-sm text-muted-foreground">ความแรง: {strengthText}</p>
      </div>
    </div>
  );
};

export const TradingSignal = ({ signal }: TradingSignalProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gold" />
                  สัญญาณการซื้อขาย
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  วิเคราะห์จาก Technical Analysis
                </p>
              </div>
              <Badge variant="outline" className="border-gold/30 text-gold">
                <Activity className="w-3 h-3 mr-1" />
                Real-time
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Main Signal */}
            <SignalBadge type={signal.type} strength={signal.strength} />

            {/* Quick Reason */}
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">เหตุผลหลัก</p>
              <p className="text-foreground">{signal.reason}</p>
            </div>

            {/* Support/Resistance Levels */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-muted-foreground">แนวรับ</p>
                </div>
                <p className="text-xl font-bold text-emerald-400 number-thai">
                  {signal.supportLevel.toLocaleString('th-TH')}
                </p>
                <p className="text-xs text-muted-foreground">บาท/บาททอง</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-rose-400" />
                  <p className="text-sm text-muted-foreground">แนวต้าน</p>
                </div>
                <p className="text-xl font-bold text-rose-400 number-thai">
                  {signal.resistanceLevel.toLocaleString('th-TH')}
                </p>
                <p className="text-xs text-muted-foreground">บาท/บาททอง</p>
              </div>
            </div>

            {/* View Details Button */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-gold/30 text-gold hover:bg-gold/10"
                >
                  ดูเหตุผลเพิ่มเติม
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gold" />
                    รายละเอียดการวิเคราะห์
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Signal Summary */}
                  <SignalBadge type={signal.type} strength={signal.strength} />

                  {/* All Reasons */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      ปัจจัยที่พิจารณา
                    </h4>
                    <div className="space-y-2">
                      {signal.details.map((detail, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            detail.includes('ซื้อ') || detail.includes('ขึ้น') || detail.includes('ต่ำกว่า 30')
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : detail.includes('ขาย') || detail.includes('ลง') || detail.includes('สูงกว่า 70')
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {index + 1}
                          </div>
                          <p className="text-sm text-foreground">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Indicators Info */}
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      ตัวชี้วัดที่ใช้
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RSI (Relative Strength Index)</span>
                        <span className="text-foreground">วัดความแรงของแนวโน้ม</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MACD</span>
                        <span className="text-foreground">จับสัญญาณการกลับตัว</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bollinger Bands</span>
                        <span className="text-foreground">หาแนวรับ-แนวต้าน</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Moving Averages</span>
                        <span className="text-foreground">เส้นค่าเฉลี่ยเคลื่อนที่</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-xs text-amber-400">
                      <strong>หมายเหตุ:</strong> สัญญาณการซื้อขายนี้เป็นเพียงการวิเคราะห์ทางเทคนิค 
                      ไม่ใช่คำแนะนำการลงทุน ผู้ลงทุนควรศึกษาข้อมูลและใช้วิจารณญาณในการตัดสินใจ
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
