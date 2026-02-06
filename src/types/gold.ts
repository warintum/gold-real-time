export interface GoldPrice {
  buy: number;
  sell: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface GoldPriceData {
  goldBar: GoldPrice;
  goldOrnament: GoldPrice;
  lastUpdate: string;
  round?: number;
}

export interface PriceUpdate {
  timestamp: string;
  round: number;
  goldBar: GoldPrice;
  goldOrnament: GoldPrice;
}

export interface PriceAlert {
  id: string;
  targetPrice: number;
  type: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  lastNotified?: string | null;
}

export interface HistoricalData {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TechnicalIndicator {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    ma5: number;
    ma10: number;
    ma20: number;
    ma50: number;
  };
}

export type SignalType = 'buy' | 'sell' | 'hold';

export interface TradingSignal {
  type: SignalType;
  strength: 'strong' | 'moderate' | 'weak';
  reason: string;
  details: string[];
  supportLevel: number;
  resistanceLevel: number;
}

export interface ProfitLossResult {
  buyPrice: number;
  currentPrice: number;
  weight: number;
  weightUnit: 'baht' | 'gram';
  profitLoss: number;
  profitLossPercent: number;
  totalValue: number;
  totalCost: number;
}

export type TimeRange = '24h' | '7d' | '30d' | '1y';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: 'fed' | 'currency' | 'geopolitical' | 'market';
  impact: 'high' | 'medium' | 'low';
}
