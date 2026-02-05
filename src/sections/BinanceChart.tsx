import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useBinanceChart, type TimeFrame, type CandleData } from '@/hooks/useBinanceChart';

// Dynamic import lightweight-charts
const loadLightweightCharts = async () => {
  const mod = await import('lightweight-charts');
  return mod;
};

const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
  '5m': 'M5',
  '15m': 'M15',
  '30m': 'M30',
  '1h': 'H1',
  '4h': 'H4',
  '1d': 'D1',
  '1w': 'W1',
};

interface BinanceChartProps {
  symbol?: string;
  defaultTimeframe?: TimeFrame;
}

export const BinanceChart = ({ 
  symbol = 'XAUUSDT', 
  defaultTimeframe = '1h' 
}: BinanceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [chartReady, setChartReady] = useState(false);
  
  const {
    candleData,
    timeframe,
    changeTimeframe,
    loading,
    error,
    isConnected,
    refresh,
  } = useBinanceChart(symbol, defaultTimeframe);

  const [hoverData, setHoverData] = useState<CandleData | null>(null);

  // Initialize chart
  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const initChart = async () => {
      if (!chartContainerRef.current || !isMounted) return;

      console.log('[Chart] Starting chart initialization...');

      try {
        // Dynamic import
        const { createChart, CrosshairMode, CandlestickSeries, HistogramSeries } = await loadLightweightCharts();
        
        if (!chartContainerRef.current || !isMounted) return;

        const container = chartContainerRef.current;
        
        // Wait for container to have size
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!chartContainerRef.current || !isMounted) return;

        console.log('[Chart] Creating chart...');

        const chart = createChart(container, {
          width: container.clientWidth || 800,
          height: 280,
          layout: {
            background: { color: 'transparent' },
            textColor: '#94a3b8',
          },
          grid: {
            vertLines: { color: 'rgba(148, 163, 184, 0.25)', style: 1 },
            horzLines: { color: 'rgba(148, 163, 184, 0.25)', style: 1 },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: '#64748b', labelBackgroundColor: '#64748b' },
            horzLine: { color: '#64748b', labelBackgroundColor: '#64748b' },
          },
          rightPriceScale: {
            borderColor: 'rgba(148, 163, 184, 0.3)',
            scaleMargins: { top: 0.1, bottom: 0.2 },
          },
          timeScale: {
            borderColor: 'rgba(148, 163, 184, 0.3)',
            timeVisible: true,
            secondsVisible: false,
          },
          handleScroll: { vertTouchDrag: false },
        });

        console.log('[Chart] Adding series...');

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#f43f5e',
          borderUpColor: '#10b981',
          borderDownColor: '#f43f5e',
          wickUpColor: '#10b981',
          wickDownColor: '#f43f5e',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#3b82f6',
          priceFormat: { type: 'volume' },
          priceScaleId: '',
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });

        chart.subscribeCrosshairMove((param: any) => {
          if (param.time && param.point && candleData.length > 0) {
            const candle = candleData.find(c => c.time === (param.time as number));
            if (candle) setHoverData(candle);
          }
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Handle resize
        resizeObserver = new ResizeObserver(() => {
          if (chartContainerRef.current && chartRef.current) {
            const { width, height } = chartContainerRef.current.getBoundingClientRect();
            if (width > 0 && height > 0) {
              chartRef.current.applyOptions({ width, height });
            }
          }
        });
        resizeObserver.observe(container);

        console.log('[Chart] Chart initialized successfully');
        setChartReady(true);

      } catch (err) {
        console.error('[Chart] Error initializing chart:', err);
      }
    };

    initChart();

    return () => {
      isMounted = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    console.log('[Chart] Data effect:', { 
      chartReady, 
      hasChart: !!chartRef.current,
      candleCount: candleData.length 
    });

    if (!chartReady || !chartRef.current || !candlestickSeriesRef.current || candleData.length === 0) {
      console.log('[Chart] Skipping data update - conditions not met');
      return;
    }

    try {
      console.log('[Chart] Updating data...');
      
      const formattedData = candleData.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const volumeData = candleData.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)',
      }));

      candlestickSeriesRef.current.setData(formattedData);
      volumeSeriesRef.current.setData(volumeData);
      chartRef.current.timeScale().fitContent();
      
      console.log('[Chart] Data updated successfully');
    } catch (err) {
      console.error('[Chart] Error updating data:', err);
    }
  }, [candleData, chartReady]);

  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
  }, []);

  const stats = (() => {
    if (candleData.length === 0) return null;
    const lastCandle = candleData[candleData.length - 1];
    const firstCandle = candleData[0];
    const high = Math.max(...candleData.map(d => d.high));
    const low = Math.min(...candleData.map(d => d.low));
    const change = lastCandle.close - firstCandle.open;
    const changePercent = (change / firstCandle.open) * 100;
    const volume = candleData.reduce((sum, d) => sum + d.volume, 0);
    return { high, low, open: firstCandle.open, change, changePercent, volume };
  })();

  const displayData = hoverData || (candleData.length > 0 ? candleData[candleData.length - 1] : null);

  return (
    <section className="py-4 md:py-8">
      <div className="container mx-auto px-2 md:px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2 md:pb-4 px-3 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                  <span className="whitespace-nowrap">กราฟ {symbol.replace('USDT', '/USD')}</span>
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">Binance</Badge>
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">กราฟแท่งเทียนแบบ Real-time</p>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide">
                {(Object.keys(TIMEFRAME_LABELS) as TimeFrame[]).map((tf) => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeTimeframe(tf)}
                    className={`flex-shrink-0 text-xs md:text-sm px-2 md:px-3 py-1 h-7 md:h-8 ${
                      timeframe === tf 
                        ? 'bg-gold text-primary-foreground hover:bg-gold-dark' 
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {TIMEFRAME_LABELS[tf]}
                  </Button>
                ))}
                <Button variant="outline" size="icon" onClick={refresh} disabled={loading} className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 ml-1">
                  <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mt-2 md:mt-4">
              <Badge variant="outline" className={`text-xs ${isConnected ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                {isConnected ? <><Wifi className="w-3 h-3 mr-1" /> <span className="hidden sm:inline">Real-time</span><span className="sm:hidden">Live</span></>
                : <><WifiOff className="w-3 h-3 mr-1" /> <span className="hidden sm:inline">ไม่เชื่อมต่อ</span><span className="sm:hidden">Offline</span></>}
              </Badge>

              {stats && (
                <>
                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 hidden sm:inline-flex">เปิด: {stats.open.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Badge>
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400"><span className="hidden md:inline">สูง: </span><span className="md:hidden">H: </span>{stats.high.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Badge>
                  <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-400"><span className="hidden md:inline">ต่ำ: </span><span className="md:hidden">L: </span>{stats.low.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Badge>
                  <Badge variant="outline" className={`text-xs ${stats.change >= 0 ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                    {stats.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                  </Badge>
                </>
              )}
            </div>

            {displayData && (
              <div className="mt-2 md:mt-4 p-2 md:p-3 bg-secondary/30 rounded-lg">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 sm:gap-4">
                  <div className="flex items-baseline gap-1.5 sm:block">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">ราคา</span>
                    <div className={`text-sm sm:text-base md:text-lg font-bold ${displayData.close >= displayData.open ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {displayData.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 sm:block">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">เปิด</span>
                    <div className="text-xs sm:text-sm font-semibold">{displayData.open.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex items-baseline gap-1 sm:block">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">สูง</span>
                    <div className="text-xs sm:text-sm font-semibold text-emerald-400">{displayData.high.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex items-baseline gap-1 sm:block">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">ต่ำ</span>
                    <div className="text-xs sm:text-sm font-semibold text-rose-400">{displayData.low.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-2 md:px-6 pb-3 md:pb-6">
            <div 
              ref={chartContainerRef}
              onMouseLeave={handleMouseLeave}
              className="w-full h-[280px] relative rounded-lg overflow-hidden bg-secondary/20"
            >
              {!chartReady && !loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">กำลังโหลดกราฟ...</span>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 md:w-8 md:h-8 animate-spin text-gold" />
                    <span className="text-xs md:text-sm text-muted-foreground">กำลังโหลด...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <WifiOff className="w-6 h-6 md:w-8 md:h-8 text-rose-500" />
                    <span className="text-xs md:text-sm text-muted-foreground">{error}</span>
                    <Button variant="outline" size="sm" onClick={refresh} className="text-xs">ลองใหม่</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 md:gap-6 mt-3 md:mt-4 text-xs md:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">ขึ้น</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-rose-500" />
                <span className="text-muted-foreground">ลง</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-blue-500/50" />
                <span className="text-muted-foreground">โวลุ่ม</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default BinanceChart;
