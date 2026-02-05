import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  CrosshairMode, 
  CandlestickSeries, 
  HistogramSeries,
  type IChartApi, 
  type CandlestickData, 
  type Time 
} from 'lightweight-charts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useBinanceChart, type TimeFrame, type CandleData } from '@/hooks/useBinanceChart';

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
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  
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
    if (!chartContainerRef.current) return;

    console.log('[Chart] Initializing chart...');

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.25)', style: 1 },
        horzLines: { color: 'rgba(148, 163, 184, 0.25)', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#64748b',
          labelBackgroundColor: '#64748b',
        },
        horzLine: {
          color: '#64748b',
          labelBackgroundColor: '#64748b',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.3)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.3)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.point) {
        const data = param.seriesData.get(candleSeries) as CandlestickData;
        if (data) {
          const candle = candleData.find(c => c.time === (param.time as number));
          if (candle) {
            setHoverData(candle);
          }
        }
      }
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    console.log('[Chart] Chart initialized, series created');

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        console.log('[Chart] Resizing to:', width, height);
        chartRef.current.applyOptions({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update chart data
  useEffect(() => {
    console.log('[Chart] Data effect triggered, candleData length:', candleData.length);
    console.log('[Chart] Series refs:', candlestickSeriesRef.current, volumeSeriesRef.current);
    
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || candleData.length === 0) {
      console.log('[Chart] Skipping data update - missing refs or empty data');
      return;
    }

    console.log('[Chart] Formatting data...');
    
    const formattedData: CandlestickData[] = candleData.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candleData.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)',
    }));

    console.log('[Chart] Setting data...', formattedData.length, 'candles');
    
    try {
      candlestickSeriesRef.current.setData(formattedData);
      volumeSeriesRef.current.setData(volumeData);
      console.log('[Chart] Data set successfully');
      
      // Fit content
      chartRef.current?.timeScale().fitContent();
      console.log('[Chart] Fit content applied');
    } catch (err) {
      console.error('[Chart] Error setting data:', err);
    }
  }, [candleData]);

  // Update hover data when mouse leaves chart
  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
  }, []);

  // Calculate stats
  const stats = (() => {
    if (candleData.length === 0) return null;
    const lastCandle = candleData[candleData.length - 1];
    const firstCandle = candleData[0];
    const high = Math.max(...candleData.map(d => d.high));
    const low = Math.min(...candleData.map(d => d.low));
    const change = lastCandle.close - firstCandle.open;
    const changePercent = (change / firstCandle.open) * 100;
    const volume = candleData.reduce((sum, d) => sum + d.volume, 0);

    return {
      high,
      low,
      open: firstCandle.open,
      change,
      changePercent,
      volume,
    };
  })();

  const displayData = hoverData || (candleData.length > 0 ? candleData[candleData.length - 1] : null);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gold" />
                  กราฟ {symbol.replace('USDT', '/USD')}
                  <Badge variant="outline" className="ml-2 text-xs">
                    Binance
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  กราฟแท่งเทียนแบบ Real-time
                </p>
              </div>

              <div className="flex items-center gap-1">
                {/* Timeframe buttons */}
                {(Object.keys(TIMEFRAME_LABELS) as TimeFrame[]).map((tf) => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeTimeframe(tf)}
                    className={timeframe === tf 
                      ? 'bg-gold text-primary-foreground hover:bg-gold-dark min-w-[44px]' 
                      : 'border-border hover:bg-secondary min-w-[44px]'
                    }
                  >
                    {TIMEFRAME_LABELS[tf]}
                  </Button>
                ))}
                
                {/* Refresh button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refresh}
                  disabled={loading}
                  className="border-border hover:bg-secondary ml-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Stats and Connection Status */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {/* Connection status */}
              <Badge 
                variant="outline" 
                className={isConnected 
                  ? 'border-emerald-500/30 text-emerald-400' 
                  : 'border-rose-500/30 text-rose-400'
                }
              >
                {isConnected ? (
                  <><Wifi className="w-3 h-3 mr-1" /> Real-time</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> ไม่เชื่อมต่อ</>
                )}
              </Badge>

              {stats && (
                <>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    เปิด: {stats.open.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    สูงสุด: {stats.high.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Badge>
                  <Badge variant="outline" className="border-rose-500/30 text-rose-400">
                    ต่ำสุด: {stats.low.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={stats.change >= 0 
                      ? 'border-emerald-500/30 text-emerald-400' 
                      : 'border-rose-500/30 text-rose-400'
                    }
                  >
                    {stats.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    <Activity className="w-3 h-3 mr-1" />
                    Vol: {(stats.volume / 1000000).toFixed(2)}M
                  </Badge>
                </>
              )}
            </div>

            {/* Current/Hover Price Display */}
            {displayData && (
              <div className="flex flex-wrap items-center gap-4 mt-4 p-3 bg-secondary/30 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground">ราคา</span>
                  <div className={`text-lg font-bold ${displayData.close >= displayData.open ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {displayData.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">เปิด</span>
                  <div className="text-sm font-semibold">
                    {displayData.open.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">สูงสุด</span>
                  <div className="text-sm font-semibold text-emerald-400">
                    {displayData.high.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">ต่ำสุด</span>
                  <div className="text-sm font-semibold text-rose-400">
                    {displayData.low.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">โวลุ่ม</span>
                  <div className="text-sm font-semibold">
                    {(displayData.volume / 1000).toFixed(1)}K
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">เวลา</span>
                  <div className="text-sm font-semibold">
                    {new Date(displayData.time * 1000).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Chart Container */}
            <div 
              ref={chartContainerRef}
              onMouseLeave={handleMouseLeave}
              className="w-full min-h-[400px] relative"
              style={{ height: '400px' }}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-gold" />
                    <span className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</span>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <WifiOff className="w-8 h-8 text-rose-500" />
                    <span className="text-sm text-muted-foreground">{error}</span>
                    <Button variant="outline" size="sm" onClick={refresh}>
                      ลองใหม่
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">ขึ้น</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-muted-foreground">ลง</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500/50" />
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
