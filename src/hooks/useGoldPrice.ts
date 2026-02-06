import { useState, useEffect, useCallback, useRef } from 'react';
import type { GoldPriceData, PriceAlert, HistoricalData, TimeRange, PriceUpdate } from '@/types/gold';
import { serviceWorkerManager } from '@/utils/serviceWorker';

// Parse Thai number format (e.g., "71,631.00" -> 71631)
const parseThaiNumber = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, ''));
};

// Fetch gold price from Thai Gold API
const fetchGoldPrice = async (): Promise<GoldPriceData> => {
  const response = await fetch('https://api.chnwt.dev/thai-gold-api/latest');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'success' && data.response) {
    const price = data.response;
    
    const goldBarBuy = parseThaiNumber(price.price?.gold_bar?.buy);
    const goldBarSell = parseThaiNumber(price.price?.gold_bar?.sell);
    const goldBuy = parseThaiNumber(price.price?.gold?.buy);
    const goldSell = parseThaiNumber(price.price?.gold?.sell);
    
    // Parse update time and round number
    const updateTimeStr = price.update_time || '';
    const roundMatch = updateTimeStr.match(/ครั้งที่\s*(\d+)/);
    const round = roundMatch ? parseInt(roundMatch[1]) : 1;
    
    return {
      goldBar: {
        buy: goldBarBuy,
        sell: goldBarSell,
        change: 0,
        changePercent: 0,
        timestamp: new Date().toISOString(),
      },
      goldOrnament: {
        buy: goldBuy,
        sell: goldSell,
        change: 0,
        changePercent: 0,
        timestamp: new Date().toISOString(),
      },
      lastUpdate: `${price.update_date} ${price.update_time}`,
      round,
    };
  }
  
  throw new Error('Invalid API response structure');
};

// Load price history from localStorage
const loadPriceHistory = (): PriceUpdate[] => {
  try {
    const saved = localStorage.getItem('goldPriceHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Keep only today's data
      const today = new Date().toDateString();
      const todayData = parsed.filter((p: PriceUpdate) => new Date(p.timestamp).toDateString() === today);
      
      // Sort by timestamp ascending (oldest first)
      return todayData.sort((a: PriceUpdate, b: PriceUpdate) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }
  } catch {
    // Ignore errors
  }
  return [];
};

// Load or initialize today's opening prices
interface OpeningPriceData {
  goldBarSell: number;
  goldOrnamentSell: number;
  date: string;
}

const getOpeningPrices = (goldBarSell: number, goldOrnamentSell: number): OpeningPriceData => {
  try {
    const today = new Date().toDateString();
    const savedOpening = localStorage.getItem(`goldOpeningPrice_${today}`);
    if (savedOpening) {
      return JSON.parse(savedOpening);
    }
    // First visit of the day - save current prices as opening prices
    const openingData: OpeningPriceData = {
      goldBarSell,
      goldOrnamentSell,
      date: today,
    };
    localStorage.setItem(`goldOpeningPrice_${today}`, JSON.stringify(openingData));
    return openingData;
  } catch {
    return { goldBarSell, goldOrnamentSell, date: new Date().toDateString() };
  }
};

// Save price history to localStorage
const savePriceHistory = (history: PriceUpdate[]) => {
  try {
    localStorage.setItem('goldPriceHistory', JSON.stringify(history));
  } catch {
    // Ignore errors
  }
};

// Generate intraday data (hourly) for 24h view
const generateIntradayData = (basePrice: number): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Market opens at 9:00 AM (simulate opening price slightly different from current)
  const marketOpenHour = 9;
  let openPrice = basePrice * (1 + (Math.random() - 0.5) * 0.01); // ±0.5% from current
  
  // Generate hourly data from market open to current time
  let currentPrice = openPrice;
  let dayHigh = openPrice;
  let dayLow = openPrice;
  
  // If before market open, start from yesterday's close pattern
  const startHour = currentHour < marketOpenHour ? marketOpenHour : marketOpenHour;
  const endHour = currentHour;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const date = new Date(now);
    date.setHours(hour, 0, 0, 0);
    
    // For the current hour, use actual current time
    if (hour === endHour) {
      date.setHours(hour, currentMinute, 0, 0);
    }
    
    // Simulate intraday price movement
    // Gold typically moves 0.1-0.3% per hour during trading hours
    const volatility = 0.0015; // 0.15% hourly volatility
    const trend = (basePrice - openPrice) / (endHour - startHour + 1) / openPrice; // Trend towards current price
    const randomWalk = (Math.random() - 0.5) * volatility * 2;
    const hourlyChange = trend + randomWalk;
    
    const prevClose = currentPrice;
    currentPrice = currentPrice * (1 + hourlyChange);
    
    // Calculate OHLC for this hour
    const hourOpen = prevClose;
    const hourClose = currentPrice;
    const hourHigh = Math.max(hourOpen, hourClose) * (1 + Math.random() * 0.002);
    const hourLow = Math.min(hourOpen, hourClose) * (1 - Math.random() * 0.002);
    
    // Update day high/low
    dayHigh = Math.max(dayHigh, hourHigh);
    dayLow = Math.min(dayLow, hourLow);
    
    data.push({
      date: date.toISOString(),
      price: hourClose,
      open: hourOpen,
      high: hourHigh,
      low: hourLow,
      close: hourClose,
    });
  }
  
  return data;
};

// Generate historical data based on current price
const generateHistoricalData = (days: number, basePrice: number): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const now = new Date();
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Use realistic gold price movements (typically 0.5-2% daily)
    const changePercent = (Math.random() - 0.5) * 0.02;
    currentPrice = currentPrice * (1 + changePercent);
    
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.005);
    const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.008);
    const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.008);
    const close = currentPrice;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: close,
      open,
      high,
      low,
      close,
    });
  }
  
  return data;
};

// Load opening price for stats calculation
const loadOpeningPriceForStats = (): { goldBarSell: number; goldOrnamentSell: number } | null => {
  try {
    const today = new Date().toDateString();
    const savedOpening = localStorage.getItem(`goldOpeningPrice_${today}`);
    if (savedOpening) {
      return JSON.parse(savedOpening);
    }
  } catch {
    // Ignore errors
  }
  return null;
};

// Calculate statistics from price history
const calculateStats = (history: PriceUpdate[]) => {
  if (history.length === 0) return null;
  
  const goldBarSells = history.map(h => h.goldBar.sell);
  const goldBarBuys = history.map(h => h.goldBar.buy);
  
  const maxSell = Math.max(...goldBarSells);
  const minSell = Math.min(...goldBarSells);
  const maxBuy = Math.max(...goldBarBuys);
  const minBuy = Math.min(...goldBarBuys);
  
  // Use stored opening price if available, otherwise use first history entry
  const openingPriceData = loadOpeningPriceForStats();
  const firstPrice = openingPriceData?.goldBarSell ?? history[0].goldBar.sell;
  
  const lastPrice = history[history.length - 1].goldBar.sell;
  const totalChange = lastPrice - firstPrice;
  const totalChangePercent = firstPrice !== 0 ? (totalChange / firstPrice) * 100 : 0;
  
  // Count ups and downs
  let ups = 0;
  let downs = 0;
  for (let i = 1; i < history.length; i++) {
    const change = history[i].goldBar.sell - history[i - 1].goldBar.sell;
    if (change > 0) ups++;
    else if (change < 0) downs++;
  }
  
  return {
    maxSell,
    minSell,
    maxBuy,
    minBuy,
    totalChange,
    totalChangePercent,
    ups,
    downs,
    updateCount: history.length,
  };
};

export const useGoldPrice = (refreshInterval: number = 60000) => {
  const [priceData, setPriceData] = useState<GoldPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<Record<TimeRange, HistoricalData[]>>({
    '24h': [],
    '7d': [],
    '30d': [],
    '1y': [],
  });
  const [priceHistory, setPriceHistory] = useState<PriceUpdate[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof calculateStats>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousPriceRef = useRef<GoldPriceData | null>(null);
  const isInitializedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch current price
      const data = await fetchGoldPrice();
      
      // Load existing history
      let existingHistory = loadPriceHistory();
      
      // Calculate change from day's opening price
      // Use stored opening price or current price if first visit of the day
      const openingPrices = getOpeningPrices(data.goldBar.sell, data.goldOrnament.sell);
      
      data.goldBar.change = data.goldBar.sell - openingPrices.goldBarSell;
      data.goldBar.changePercent = openingPrices.goldBarSell !== 0 
        ? ((data.goldBar.sell - openingPrices.goldBarSell) / openingPrices.goldBarSell) * 100 
        : 0;
        
      data.goldOrnament.change = data.goldOrnament.sell - openingPrices.goldOrnamentSell;
      data.goldOrnament.changePercent = openingPrices.goldOrnamentSell !== 0 
        ? ((data.goldOrnament.sell - openingPrices.goldOrnamentSell) / openingPrices.goldOrnamentSell) * 100 
        : 0;
      

      
      // Check if this is a new price update (different from last saved)
      const lastHistoryEntry = existingHistory[existingHistory.length - 1];
      const isNewUpdate = !lastHistoryEntry || 
        lastHistoryEntry.goldBar.sell !== data.goldBar.sell ||
        lastHistoryEntry.goldBar.buy !== data.goldBar.buy ||
        (data.round && lastHistoryEntry.round !== data.round);
      
      if (isNewUpdate) {
        const newUpdate: PriceUpdate = {
          timestamp: new Date().toISOString(),
          round: data.round || (lastHistoryEntry ? lastHistoryEntry.round + 1 : 1),
          goldBar: { ...data.goldBar },
          goldOrnament: { ...data.goldOrnament },
        };
        
        existingHistory = [...existingHistory, newUpdate];
        
        // Keep only last 100 entries to prevent localStorage overflow
        if (existingHistory.length > 100) {
          existingHistory = existingHistory.slice(-100);
        }
        
        savePriceHistory(existingHistory);
      }
      
      // Update state
      setPriceHistory(existingHistory);
      setStats(calculateStats(existingHistory));
      
      previousPriceRef.current = data;
      setPriceData(data);
      setError(null);
      
      // Generate historical data if not already loaded
      if (historicalData['7d'].length === 0) {
        const basePrice = data.goldBar.sell;
        setHistoricalData({
          '24h': generateIntradayData(basePrice),
          '7d': generateHistoricalData(7, basePrice),
          '30d': generateHistoricalData(30, basePrice),
          '1y': generateHistoricalData(365, basePrice),
        });
      }
      
      isInitializedRef.current = true;
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [historicalData]);

  useEffect(() => {
    // Load history on mount
    const savedHistory = loadPriceHistory();
    setPriceHistory(savedHistory);
    setStats(calculateStats(savedHistory));
    
    fetchData();
    
    // Set up auto-refresh
    intervalRef.current = setInterval(fetchData, refreshInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    priceData,
    loading,
    error,
    historicalData,
    priceHistory,
    stats,
    refresh,
  };
};

// Price alerts hook with notifications and sound
export const usePriceAlerts = (currentPrice?: number) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('goldPriceAlerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old alerts to include lastNotified field
        return parsed.map((alert: PriceAlert) => ({
          ...alert,
          lastNotified: alert.lastNotified || null,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });
  
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);
  const previousTriggeredRef = useRef<Set<string>>(new Set());

  const addAlert = useCallback((targetPrice: number, type: 'above' | 'below') => {
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      targetPrice,
      type,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastNotified: null,
    };
    setAlerts(prev => {
      const updated = [...prev, newAlert];
      try {
        localStorage.setItem('goldPriceAlerts', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
    return newAlert.id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('goldPriceAlerts', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, isActive: !a.isActive } : a
      );
      try {
        localStorage.setItem('goldPriceAlerts', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  const checkAlerts = useCallback((price: number) => {
    return alerts.filter(alert => {
      if (!alert.isActive) return false;
      if (alert.type === 'above' && price >= alert.targetPrice) return true;
      if (alert.type === 'below' && price <= alert.targetPrice) return true;
      return false;
    });
  }, [alerts]);

  // Mark alert as notified
  const markAlertNotified = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, lastNotified: new Date().toISOString() } : a
      );
      try {
        localStorage.setItem('goldPriceAlerts', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Reset notification status for an alert
  const resetAlertNotification = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, lastNotified: null } : a
      );
      try {
        localStorage.setItem('goldPriceAlerts', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Check for price alerts when currentPrice changes
  useEffect(() => {
    if (currentPrice === undefined) return;

    const newTriggeredAlerts = checkAlerts(currentPrice);
    setTriggeredAlerts(newTriggeredAlerts);

    // Check for newly triggered alerts
    const newTriggeredIds = new Set(newTriggeredAlerts.map(a => a.id));
    const previousTriggeredIds = previousTriggeredRef.current;

    // Find alerts that just got triggered
    newTriggeredAlerts.forEach(alert => {
      if (!previousTriggeredIds.has(alert.id)) {
        // This is a newly triggered alert
        const lastNotified = alert.lastNotified ? new Date(alert.lastNotified).getTime() : 0;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // Only notify if not notified in last 5 minutes
        if (now - lastNotified > fiveMinutes) {
          // Send notification via service worker if available
          if (serviceWorkerManager.isServiceWorkerSupported()) {
            serviceWorkerManager.sendMessage('CHECK_PRICE_ALERTS', {
              currentPrice,
              alerts: [alert]
            });
          }
        }
      }
    });

    previousTriggeredRef.current = newTriggeredIds;
  }, [currentPrice, checkAlerts]);

  return {
    alerts,
    triggeredAlerts,
    addAlert,
    removeAlert,
    toggleAlert,
    checkAlerts,
    markAlertNotified,
    resetAlertNotification,
  };
};
