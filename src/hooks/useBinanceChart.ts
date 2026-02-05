import { useState, useEffect, useRef, useCallback } from 'react';

export type TimeFrame = '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BinanceKline {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
  6: number; // Close time
  7: string; // Quote asset volume
  8: number; // Number of trades
  9: string; // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Ignore
}

const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
  '5m': 'M5',
  '15m': 'M15',
  '30m': 'M30',
  '1h': 'H1',
  '4h': 'H4',
  '1d': 'D1',
  '1w': 'W1',
};

const TIMEFRAME_MINUTES: Record<TimeFrame, number> = {
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '4h': 240,
  '1d': 1440,
  '1w': 10080,
};

// Convert Binance kline data to CandleData
const parseKline = (kline: BinanceKline): CandleData => ({
  time: Math.floor(kline[0] / 1000), // Convert to seconds
  open: parseFloat(kline[1]),
  high: parseFloat(kline[2]),
  low: parseFloat(kline[3]),
  close: parseFloat(kline[4]),
  volume: parseFloat(kline[5]),
});

// CORS Proxy URL - ใช้สำหรับ Production (GitHub Pages)
// thingproxy รองรับ GitHub Pages ดีกว่า
const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';

const getApiBaseUrl = (): string => {
  // สำหรับ Vite dev server: ใช้ proxy
  if (import.meta.env.DEV) {
    return '/api/binance';
  }
  // Production: ใช้ CORS Proxy
  return `${CORS_PROXY}https://fapi.binance.com`;
};

// Fetch historical klines from Binance FUTURES API (มี XAUUSDT)
const fetchKlines = async (
  symbol: string,
  interval: TimeFrame,
  limit: number = 500
): Promise<CandleData[]> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  console.log('[Binance Futures] Fetching klines:', url);

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error('[Binance Futures] API error:', response.status, text);
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  const data: BinanceKline[] = await response.json();
  console.log('[Binance Futures] Received', data.length, 'candles');
  return data.map(parseKline);
};

// Fetch current price from Binance FUTURES API
const fetchCurrentPrice = async (symbol: string): Promise<number> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/fapi/v1/ticker/price?symbol=${symbol}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return parseFloat(data.price);
};

export const useBinanceChart = (
  symbol: string = 'XAUUSDT',
  defaultTimeframe: TimeFrame = '1h'
) => {
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<TimeFrame>(defaultTimeframe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const lastCandleRef = useRef<CandleData | null>(null);

  // Fetch initial historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Binance Futures] Fetching historical data for', symbol, timeframe);

      const data = await fetchKlines(symbol, timeframe, 200);
      console.log('[Binance Futures] Historical data loaded:', data.length, 'candles');

      if (data.length === 0) {
        throw new Error('ไม่พบข้อมูลกราฟ');
      }

      setCandleData(data);
      lastCandleRef.current = data[data.length - 1] || null;

      // Fetch current price
      const price = await fetchCurrentPrice(symbol);
      setCurrentPrice(price);

      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('[Binance Futures] Error fetching historical data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Connect to WebSocket for real-time updates (Futures Stream)
  const connectWebSocket = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsSymbol = symbol.toLowerCase();
    // Binance Futures WebSocket
    const wsUrl = `wss://fstream.binance.com/ws/${wsSymbol}@kline_${timeframe}`;

    console.log('[Binance Futures] Connecting WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`[Binance Futures] WebSocket connected: ${symbol} @ ${timeframe}`);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.k) {
          const kline = data.k;
          const newCandle: CandleData = {
            time: Math.floor(kline.t / 1000),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
          };

          setCurrentPrice(newCandle.close);

          setCandleData((prev) => {
            const newData = [...prev];
            const lastIndex = newData.length - 1;

            if (lastIndex >= 0 && newData[lastIndex].time === newCandle.time) {
              // Update existing candle
              newData[lastIndex] = newCandle;
            } else {
              // Add new candle
              newData.push(newCandle);
              // Keep only last 500 candles
              if (newData.length > 500) {
                newData.shift();
              }
            }

            return newData;
          });

          lastCandleRef.current = newCandle;
        }
      };

      ws.onerror = (error) => {
        console.error('[Binance Futures] WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[Binance Futures] WebSocket disconnected');
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[Binance Futures] WebSocket connection failed:', err);
      setIsConnected(false);
    }
  }, [symbol, timeframe]);

  // Change timeframe
  const changeTimeframe = useCallback((newTimeframe: TimeFrame) => {
    setTimeframe(newTimeframe);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Connect WebSocket when data is loaded
  useEffect(() => {
    if (candleData.length > 0 && !loading) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [candleData.length, loading, connectWebSocket]);

  // Reconnect WebSocket every 30 minutes to prevent timeout
  useEffect(() => {
    const reconnectInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        connectWebSocket();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(reconnectInterval);
  }, [connectWebSocket]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh data when tab becomes visible
        fetchHistoricalData();
        connectWebSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchHistoricalData, connectWebSocket]);

  return {
    candleData,
    currentPrice,
    timeframe,
    changeTimeframe,
    loading,
    error,
    isConnected,
    refresh: fetchHistoricalData,
    timeframeLabels: TIMEFRAME_LABELS,
    timeframeMinutes: TIMEFRAME_MINUTES,
  };
};

export default useBinanceChart;
