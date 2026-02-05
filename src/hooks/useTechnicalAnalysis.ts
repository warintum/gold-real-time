import { useMemo, useCallback } from 'react';
import type { HistoricalData, TechnicalIndicator, TradingSignal, SignalType } from '@/types/gold';

// Calculate RSI (Relative Strength Index)
const calculateRSI = (prices: number[], period: number = 14): number => {
  const actualPeriod = Math.min(period, prices.length - 1);
  if (actualPeriod < 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial averages
  for (let i = 1; i <= actualPeriod; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / actualPeriod;
  let avgLoss = losses / actualPeriod;
  
  // Avoid division by zero
  if (avgLoss === 0) return avgGain > 0 ? 100 : 50;
  
  // Calculate RSI
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.min(100, Math.max(0, rsi));
};

// Calculate MACD
const calculateMACD = (prices: number[]): { macd: number; signal: number; histogram: number } => {
  // Adjust periods based on available data
  const fastPeriod = Math.min(12, Math.floor(prices.length / 2));
  const slowPeriod = Math.min(26, Math.floor(prices.length * 0.8));
  const signalPeriod = Math.min(9, Math.floor(prices.length / 3));
  
  if (fastPeriod < 2 || slowPeriod <= fastPeriod) {
    // Not enough data, return neutral values based on recent trend
    const recentChange = prices.length > 1 ? prices[prices.length - 1] - prices[prices.length - 2] : 0;
    return { 
      macd: recentChange, 
      signal: recentChange * 0.5, 
      histogram: recentChange * 0.5 
    };
  }
  
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  const macd = emaFast - emaSlow;
  
  // Signal line is EMA of MACD
  const macdSeries: number[] = [];
  for (let i = slowPeriod; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const fast = calculateEMA(slice, fastPeriod);
    const slow = calculateEMA(slice, slowPeriod);
    macdSeries.push(fast - slow);
  }
  
  const signal = macdSeries.length > 0 ? calculateEMA(macdSeries, Math.min(signalPeriod, macdSeries.length)) : macd * 0.5;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
};

// Calculate EMA (Exponential Moving Average)
const calculateEMA = (prices: number[], period: number): number => {
  const actualPeriod = Math.min(period, prices.length);
  if (actualPeriod < 1) return prices[prices.length - 1] || 0;
  if (actualPeriod === 1) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (actualPeriod + 1);
  let ema = prices.slice(0, actualPeriod).reduce((a, b) => a + b, 0) / actualPeriod;
  
  for (let i = actualPeriod; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

// Calculate SMA (Simple Moving Average)
const calculateSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

// Calculate Bollinger Bands
const calculateBollingerBands = (prices: number[], period: number = 20, multiplier: number = 2) => {
  const actualPeriod = Math.min(period, prices.length);
  const sma = calculateSMA(prices, actualPeriod);
  
  const slice = prices.slice(-actualPeriod);
  const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / actualPeriod;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * multiplier),
    middle: sma,
    lower: sma - (stdDev * multiplier),
  };
};

// Calculate all technical indicators
export const calculateIndicators = (historicalData: HistoricalData[]): TechnicalIndicator => {
  const prices = historicalData.map(d => d.close);
  
  // Need at least 5 data points for basic calculation
  if (prices.length < 5) {
    return {
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      bollingerBands: { upper: 0, middle: 0, lower: 0 },
      movingAverages: { ma5: prices[prices.length - 1] || 0, ma10: prices[prices.length - 1] || 0, ma20: prices[prices.length - 1] || 0, ma50: prices[prices.length - 1] || 0 },
    };
  }
  
  // Adjust periods based on available data
  const dataLength = prices.length;
  const rsiPeriod = Math.min(14, dataLength - 1);
  const bbPeriod = Math.min(20, dataLength);
  const ma5Period = Math.min(5, dataLength);
  const ma10Period = Math.min(10, dataLength);
  const ma20Period = Math.min(20, dataLength);
  const ma50Period = Math.min(50, dataLength);
  
  return {
    rsi: calculateRSI(prices, rsiPeriod),
    macd: calculateMACD(prices),
    bollingerBands: calculateBollingerBands(prices, bbPeriod),
    movingAverages: {
      ma5: calculateSMA(prices, ma5Period),
      ma10: calculateSMA(prices, ma10Period),
      ma20: calculateSMA(prices, ma20Period),
      ma50: calculateSMA(prices, ma50Period),
    },
  };
};

// Generate trading signal based on technical analysis
export const generateTradingSignal = (
  currentPrice: number,
  indicators: TechnicalIndicator,
  historicalData?: HistoricalData[]
): TradingSignal => {
  const { rsi, macd, bollingerBands, movingAverages } = indicators;
  const reasons: string[] = [];
  let buySignals = 0;
  let sellSignals = 0;
  
  // Calculate support/resistance levels
  let supportLevel = bollingerBands.lower;
  let resistanceLevel = bollingerBands.upper;
  
  // If Bollinger Bands are 0 or invalid, calculate from historical data
  if ((supportLevel === 0 || resistanceLevel === 0) && historicalData && historicalData.length > 0) {
    const prices = historicalData.map(d => d.close);
    const highs = historicalData.map(d => d.high);
    const lows = historicalData.map(d => d.low);
    
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Calculate volatility (standard deviation)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    // Set support/resistance based on price range and volatility
    resistanceLevel = maxPrice + stdDev * 0.5;
    supportLevel = minPrice - stdDev * 0.5;
  }
  
  // Fallback: if still 0, use current price with default spread
  if (supportLevel === 0) supportLevel = currentPrice * 0.98;
  if (resistanceLevel === 0) resistanceLevel = currentPrice * 1.02;
  
  // RSI Analysis
  if (rsi < 30) {
    buySignals += 2;
    reasons.push('RSI ต่ำกว่า 30 (Oversold) - ราคาอยู่ในโซนขายมากเกินไป');
  } else if (rsi > 70) {
    sellSignals += 2;
    reasons.push('RSI สูงกว่า 70 (Overbought) - ราคาอยู่ในโซนซื้อมากเกินไป');
  } else if (rsi < 45) {
    buySignals += 1;
    reasons.push('RSI อยู่ในระดับต่ำ - มีแนวโน้มขึ้น');
  } else if (rsi > 55) {
    sellSignals += 1;
    reasons.push('RSI อยู่ในระดับสูง - มีแนวโน้มลง');
  }
  
  // MACD Analysis
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    buySignals += 1;
    reasons.push('MACD ตัดขึ้นเหนือ Signal Line - สัญญาณซื้อ');
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    sellSignals += 1;
    reasons.push('MACD ตัดลงต่ำกว่า Signal Line - สัญญาณขาย');
  }
  
  // Bollinger Bands / Support-Resistance Analysis
  if (currentPrice <= supportLevel * 1.005) {
    buySignals += 2;
    reasons.push('ราคาอยู่ใกล้แนวรับ - มีโอกาสกลับตัวขึ้น');
  } else if (currentPrice >= resistanceLevel * 0.995) {
    sellSignals += 2;
    reasons.push('ราคาอยู่ใกล้แนวต้าน - มีโอกาสกลับตัวลง');
  }
  
  // Moving Averages Analysis
  if (currentPrice > movingAverages.ma20 && currentPrice > movingAverages.ma50) {
    buySignals += 1;
    reasons.push('ราคาอยู่เหนือเส้นค่าเฉลี่ย MA20 และ MA50');
  } else if (currentPrice < movingAverages.ma20 && currentPrice < movingAverages.ma50) {
    sellSignals += 1;
    reasons.push('ราคาอยู่ต่ำกว่าเส้นค่าเฉลี่ย MA20 และ MA50');
  }
  
  // Golden Cross / Death Cross (only if we have valid MA values)
  if (movingAverages.ma20 > 0 && movingAverages.ma50 > 0) {
    if (movingAverages.ma20 > movingAverages.ma50) {
      buySignals += 1;
      reasons.push('MA20 อยู่เหนือ MA50 - แนวโน้มขาขึ้น');
    } else if (movingAverages.ma20 < movingAverages.ma50) {
      sellSignals += 1;
      reasons.push('MA20 อยู่ต่ำกว่า MA50 - แนวโน้มขาลง');
    }
  }
  
  // Determine signal type
  let type: SignalType = 'hold';
  let strength: 'strong' | 'moderate' | 'weak' = 'weak';
  
  if (buySignals > sellSignals) {
    type = 'buy';
    const diff = buySignals - sellSignals;
    strength = diff >= 3 ? 'strong' : diff >= 2 ? 'moderate' : 'weak';
  } else if (sellSignals > buySignals) {
    type = 'sell';
    const diff = sellSignals - buySignals;
    strength = diff >= 3 ? 'strong' : diff >= 2 ? 'moderate' : 'weak';
  }
  
  if (reasons.length === 0) {
    reasons.push('ไม่มีสัญญาณชัดเจน - แนะนำให้รอดูทิศทางต่อไป');
  }
  
  return {
    type,
    strength,
    reason: reasons[0],
    details: reasons,
    supportLevel: Math.round(supportLevel),
    resistanceLevel: Math.round(resistanceLevel),
  };
};

export const useTechnicalAnalysis = (historicalData: HistoricalData[], currentPrice: number) => {
  const indicators = useMemo(() => {
    return calculateIndicators(historicalData);
  }, [historicalData]);
  
  const signal = useMemo(() => {
    return generateTradingSignal(currentPrice, indicators, historicalData);
  }, [currentPrice, indicators, historicalData]);
  
  const getSignalColor = useCallback((type: SignalType) => {
    switch (type) {
      case 'buy': return 'text-emerald-400';
      case 'sell': return 'text-rose-400';
      case 'hold': return 'text-amber-400';
    }
  }, []);
  
  const getSignalBgColor = useCallback((type: SignalType) => {
    switch (type) {
      case 'buy': return 'bg-emerald-500/20 border-emerald-500/50';
      case 'sell': return 'bg-rose-500/20 border-rose-500/50';
      case 'hold': return 'bg-amber-500/20 border-amber-500/50';
    }
  }, []);
  
  const getSignalIcon = useCallback((type: SignalType) => {
    switch (type) {
      case 'buy': return '↑';
      case 'sell': return '↓';
      case 'hold': return '→';
    }
  }, []);
  
  const getSignalText = useCallback((type: SignalType) => {
    switch (type) {
      case 'buy': return 'ควรซื้อ';
      case 'sell': return 'ควรขาย';
      case 'hold': return 'ถือต่อ';
    }
  }, []);
  
  const getStrengthText = useCallback((strength: string) => {
    switch (strength) {
      case 'strong': return 'แรงมาก';
      case 'moderate': return 'ปานกลาง';
      case 'weak': return 'อ่อน';
    }
  }, []);
  
  return {
    indicators,
    signal,
    getSignalColor,
    getSignalBgColor,
    getSignalIcon,
    getSignalText,
    getStrengthText,
  };
};
