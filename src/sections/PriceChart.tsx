import { useState, useMemo } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Maximize2, Minimize2 } from 'lucide-react';
import type { HistoricalData, TimeRange } from '@/types/gold';

interface PriceChartProps {
  historicalData: Record<TimeRange, HistoricalData[]>;
  currentPrice: number;
}

const timeRangeLabels: Record<TimeRange, string> = {
  '24h': '24 ชั่วโมง',
  '7d': '7 วัน',
  '30d': '30 วัน',
  '1y': '1 ปี',
};

const CustomTooltip = ({ active, payload, label, selectedRange }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isIntraday = selectedRange === '24h';
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">{isIntraday ? 'ราคา: ' : 'ราคาปิด: '}</span>
            <span className="font-semibold text-gold number-thai">
              {data.close.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">เปิด: </span>
            <span className="font-semibold text-blue-400 number-thai">
              {data.open.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">สูงสุด: </span>
            <span className="font-semibold text-emerald-400 number-thai">
              {data.high.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">ต่ำสุด: </span>
            <span className="font-semibold text-rose-400 number-thai">
              {data.low.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const PriceChart = ({ historicalData, currentPrice }: PriceChartProps) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [showMA, setShowMA] = useState(true);

  const data = useMemo(() => {
    const rangeData = historicalData[selectedRange] || [];
    return rangeData.map((item) => {
      const date = new Date(item.date);
      let formattedDate: string;
      
      if (selectedRange === '24h') {
        // For intraday, show time with hour and minute
        formattedDate = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      } else if (selectedRange === '7d') {
        // For 7 days, show day name and date
        formattedDate = date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });
      } else {
        // For 30d and 1y, show day and month
        formattedDate = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
      }
      
      // Calculate price direction for coloring
      const isUp = item.close >= item.open;
      
      return {
        ...item,
        date: formattedDate,
        fullDate: item.date, // Keep full date for MA calculation
        ma5: selectedRange === '24h' ? null : calculateMA(rangeData, item.date, 5),
        ma20: selectedRange === '24h' ? null : calculateMA(rangeData, item.date, 20),
        isUp,
        color: isUp ? '#10b981' : '#f43f5e', // emerald-500 or rose-500
      };
    });
  }, [historicalData, selectedRange]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const prices = data.map(d => d.close);
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const startPrice = data[0]?.open || prices[0]; // Use opening price of first candle
    const endPrice = prices[prices.length - 1];
    const change = endPrice - startPrice;
    const changePercent = (change / startPrice) * 100;

    return {
      high,
      low,
      open: startPrice,
      change,
      changePercent,
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [data]);

  const formatYAxis = (value: number) => {
    return value.toLocaleString('th-TH', { maximumFractionDigits: 0 });
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  กราฟแนวโน้มราคา
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  วิเคราะห์แนวโน้มราคาทองคำย้อนหลัง
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={selectedRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRange(range)}
                    className={selectedRange === range 
                      ? 'bg-gold text-primary-foreground hover:bg-gold-dark' 
                      : 'border-border hover:bg-secondary'
                    }
                  >
                    {timeRangeLabels[range]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                  เปิด: {stats.open.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                  <Maximize2 className="w-3 h-3 mr-1" />
                  สูงสุด: {stats.high.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </Badge>
                <Badge variant="outline" className="border-rose-500/30 text-rose-400">
                  <Minimize2 className="w-3 h-3 mr-1" />
                  ต่ำสุด: {stats.low.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={stats.change >= 0 
                    ? 'border-emerald-500/30 text-emerald-400' 
                    : 'border-rose-500/30 text-rose-400'
                  }
                >
                  {stats.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  เปลี่ยนแปลง: {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </Badge>
                {selectedRange !== '24h' && (
                  <Badge variant="outline" className="border-gold/30 text-gold">
                    ค่าเฉลี่ย: {stats.avg.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </Badge>
                )}
                {selectedRange !== '24h' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMA(!showMA)}
                    className="text-xs"
                  >
                    {showMA ? 'ซ่อน' : 'แสดง'} เส้นค่าเฉลี่ย
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatYAxis}
                    domain={['dataMin - 500', 'dataMax + 500']}
                  />
                  <Tooltip content={(props) => <CustomTooltip {...props} selectedRange={selectedRange} />} />
                  
                  {/* Opening Price Reference Line - Only for 24h view */}
                  {selectedRange === '24h' && stats && (
                    <ReferenceLine 
                      y={stats.open} 
                      stroke="#3b82f6" 
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      label={{ 
                        value: `เปิด: ${stats.open.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`, 
                        fill: '#3b82f6',
                        fontSize: 11,
                        position: 'left'
                      }}
                    />
                  )}
                  
                  {/* Current Price Reference Line */}
                  <ReferenceLine 
                    y={currentPrice} 
                    stroke="#eab308" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: `ปัจจุบัน: ${currentPrice.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`, 
                      fill: '#eab308',
                      fontSize: 12,
                      position: 'right'
                    }}
                  />

                  {/* Price Line - Always show for all ranges */}
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#eab308"
                    strokeWidth={selectedRange === '24h' ? 3 : 2}
                    dot={selectedRange === '24h' ? { r: 4, strokeWidth: 2, fill: '#1a1a1a' } : false}
                    activeDot={{ r: 6, stroke: '#eab308', strokeWidth: 2, fill: '#1a1a1a' }}
                  />
                  
                  {/* Area fill for non-24h views */}
                  {selectedRange !== '24h' && (
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="none"
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  )}

                  {/* Moving Averages - Hidden for 24h view */}
                  {showMA && selectedRange !== '24h' && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="ma5"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        dot={false}
                        name="MA5"
                      />
                      <Line
                        type="monotone"
                        dataKey="ma20"
                        stroke="#8b5cf6"
                        strokeWidth={1.5}
                        dot={false}
                        name="MA20"
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold" />
                <span className="text-muted-foreground">ราคา</span>
              </div>
              {showMA && selectedRange !== '24h' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">MA5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">MA20</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Helper function to calculate moving average
function calculateMA(data: HistoricalData[], targetDate: string, period: number): number | null {
  const index = data.findIndex(d => d.date === targetDate);
  if (index < period - 1) return null;
  
  const slice = data.slice(index - period + 1, index + 1);
  const sum = slice.reduce((acc, item) => acc + item.close, 0);
  return sum / period;
}
