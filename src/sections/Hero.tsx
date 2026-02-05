import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GoldPriceData } from '@/types/gold';

interface HeroProps {
  priceData: GoldPriceData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const Hero = ({ priceData, loading, onRefresh }: HeroProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToPrice = () => {
    const element = document.querySelector('#price');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goldBar = priceData?.goldBar;
  const isPositive = (goldBar?.change || 0) >= 0;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className={`relative z-10 container mx-auto px-4 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
        {/* Badge
        <Badge 
          variant="outline" 
          className="mb-6 border-gold/50 text-gold bg-gold/10 px-4 py-1"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
          Real-time Updates
        </Badge> */}

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 mt-16">
          <span className="text-foreground">ติดตามราคา</span>

          <p className="text-gold text-shadow-gold mt-4">ทองคำไทย</p>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          ข้อมูลราคาทองคำ 96.5% แบบ Real-time พร้อมกราฟแนวโน้ม
          สัญญาณซื้อขาย และเครื่องมือวิเคราะห์ครบครัน
        </p>

        {/* Current Price Preview */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">ทองคำแท่ง 96.5%</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {priceData?.lastUpdate || '-'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-12 w-48 shimmer rounded mx-auto" />
                <div className="h-6 w-32 shimmer rounded mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-4xl sm:text-5xl font-bold text-gold number-thai mb-2">
                  {goldBar?.sell.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${isPositive
                      ? 'border-emerald-500/30 text-emerald-400'
                      : 'border-rose-500/30 text-rose-400'
                      }`}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {isPositive ? '+' : ''}{goldBar?.change.toLocaleString('th-TH')}
                    ({isPositive ? '+' : ''}{goldBar?.changePercent.toFixed(2)}%)
                  </Badge>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-1">รับซื้อ</p>
                <p className="text-lg font-semibold text-foreground number-thai">
                  {goldBar?.buy.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">ขายออก</p>
                <p className="text-lg font-semibold text-foreground number-thai">
                  {goldBar?.sell.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={scrollToPrice}
            className="bg-gold text-primary-foreground hover:bg-gold-dark px-8"
          >
            ดูราคาทั้งหมด
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onRefresh}
            disabled={loading}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
          {[
            { label: 'Real-time', value: 'อัปเดตสด' },
            { label: 'Technical', value: 'วิเคราะห์' },
            { label: 'Alerts', value: 'แจ้งเตือน' },
            { label: 'Calculator', value: 'คำนวณ' },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-secondary/30 rounded-lg p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </div>
    </section>
  );
};
