import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GoldPriceData } from '@/types/gold';

interface PriceDisplayProps {
  priceData: GoldPriceData | null;
  loading: boolean;
  onRefresh: () => void;
}

const formatPrice = (price: number): string => {
  return price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const PriceCard = ({
  title,
  buyPrice,
  sellPrice,
  change,
  changePercent,
  loading,
}: {
  title: string;
  buyPrice: number;
  sellPrice: number;
  change: number;
  changePercent: number;
  loading: boolean;
}) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground/80">{title}</h3>
          <Badge 
            variant={isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'}
            className={`${
              isPositive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
              isNegative ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 
              'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
            {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
            {isNeutral && <Minus className="w-3 h-3 mr-1" />}
            {formatChange(change)} ({changePercent.toFixed(2)}%)
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">รับซื้อ (Bid)</p>
            {loading ? (
              <div className="h-8 w-32 shimmer rounded" />
            ) : (
              <p className={`text-2xl font-bold number-thai ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-foreground'}`}>
                {formatPrice(buyPrice)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">บาท/บาททอง</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">ขายออก (Ask)</p>
            {loading ? (
              <div className="h-8 w-32 shimmer rounded" />
            ) : (
              <p className={`text-2xl font-bold number-thai ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-foreground'}`}>
                {formatPrice(sellPrice)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">บาท/บาททอง</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PriceDisplay = ({ priceData, loading, onRefresh }: PriceDisplayProps) => {
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (priceData?.lastUpdate) {
      setLastUpdated(priceData.lastUpdate);
    }
  }, [priceData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-8 bg-gold rounded-full" />
              ราคาทองคำ 96.5%
            </h2>
            <p className="text-muted-foreground mt-1">
              อัปเดตตามประกาศสมาคมค้าทองคำ
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>อัปเดตล่าสุด: {lastUpdated || '-'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Price Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <PriceCard
            title="ทองคำแท่ง 96.5%"
            buyPrice={priceData?.goldBar.buy || 0}
            sellPrice={priceData?.goldBar.sell || 0}
            change={priceData?.goldBar.change || 0}
            changePercent={priceData?.goldBar.changePercent || 0}
            loading={loading}
          />
          
          <PriceCard
            title="ทองรูปพรรณ 96.5%"
            buyPrice={priceData?.goldOrnament.buy || 0}
            sellPrice={priceData?.goldOrnament.sell || 0}
            change={priceData?.goldOrnament.change || 0}
            changePercent={priceData?.goldOrnament.changePercent || 0}
            loading={loading}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">สเปรดซื้อ-ขาย</p>
            {loading ? (
              <div className="h-6 w-20 shimmer rounded mx-auto" />
            ) : (
              <p className="text-lg font-semibold text-gold number-thai">
                {formatPrice((priceData?.goldBar.sell || 0) - (priceData?.goldBar.buy || 0))}
              </p>
            )}
            <p className="text-xs text-muted-foreground">บาท/บาททอง</p>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">ราคาเฉลี่ย 24 ชม.</p>
            {loading ? (
              <div className="h-6 w-20 shimmer rounded mx-auto" />
            ) : (
              <p className="text-lg font-semibold text-foreground number-thai">
                {formatPrice((priceData?.goldBar.sell || 0) + (priceData?.goldBar.change || 0) * 0.5)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">บาท/บาททอง</p>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">ระดับความผันผวน</p>
            {loading ? (
              <div className="h-6 w-20 shimmer rounded mx-auto" />
            ) : (
              <p className="text-lg font-semibold text-amber-400">
                ปานกลาง
              </p>
            )}
            <p className="text-xs text-muted-foreground">จาก 7 วัน</p>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">แนวโน้ม</p>
            {loading ? (
              <div className="h-6 w-20 shimmer rounded mx-auto" />
            ) : (
              <p className={`text-lg font-semibold ${
                (priceData?.goldBar.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(priceData?.goldBar.change || 0) >= 0 ? 'ขาขึ้น' : 'ขาลง'}
              </p>
            )}
            <p className="text-xs text-muted-foreground">ระยะสั้น</p>
          </div>
        </div>
      </div>
    </section>
  );
};
