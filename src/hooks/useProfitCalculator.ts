import { useState, useCallback, useMemo } from 'react';
import type { ProfitLossResult } from '@/types/gold';

interface CalculatorState {
  buyPrice: string;
  currentPrice: string;
  weight: string;
  weightUnit: 'baht' | 'gram';
}

const BAHT_TO_GRAM = 15.244; // 1 บาททอง = 15.244 กรัม

export const useProfitCalculator = (defaultCurrentPrice: number) => {
  const [state, setState] = useState<CalculatorState>({
    buyPrice: '',
    currentPrice: defaultCurrentPrice.toString(),
    weight: '',
    weightUnit: 'baht',
  });

  const updateBuyPrice = useCallback((value: string) => {
    setState(prev => ({ ...prev, buyPrice: value }));
  }, []);

  const updateCurrentPrice = useCallback((value: string) => {
    setState(prev => ({ ...prev, currentPrice: value }));
  }, []);

  const updateWeight = useCallback((value: string) => {
    setState(prev => ({ ...prev, weight: value }));
  }, []);

  const updateWeightUnit = useCallback((unit: 'baht' | 'gram') => {
    setState(prev => ({ ...prev, weightUnit: unit }));
  }, []);

  const result: ProfitLossResult | null = useMemo(() => {
    const buyPrice = parseFloat(state.buyPrice);
    const currentPrice = parseFloat(state.currentPrice);
    const weight = parseFloat(state.weight);

    if (isNaN(buyPrice) || isNaN(currentPrice) || isNaN(weight) || buyPrice <= 0 || weight <= 0) {
      return null;
    }

    // Convert weight to baht if in grams
    const weightInBaht = state.weightUnit === 'gram' ? weight / BAHT_TO_GRAM : weight;

    const totalCost = buyPrice * weightInBaht;
    const totalValue = currentPrice * weightInBaht;
    const profitLoss = totalValue - totalCost;
    const profitLossPercent = (profitLoss / totalCost) * 100;

    return {
      buyPrice,
      currentPrice,
      weight,
      weightUnit: state.weightUnit,
      profitLoss,
      profitLossPercent,
      totalValue,
      totalCost,
    };
  }, [state]);

  const reset = useCallback(() => {
    setState({
      buyPrice: '',
      currentPrice: defaultCurrentPrice.toString(),
      weight: '',
      weightUnit: 'baht',
    });
  }, [defaultCurrentPrice]);

  return {
    ...state,
    result,
    updateBuyPrice,
    updateCurrentPrice,
    updateWeight,
    updateWeightUnit,
    reset,
  };
};

// Format number with Thai number formatting
export const formatThaiNumber = (num: number, decimals: number = 2): string => {
  if (isNaN(num)) return '-';
  
  const formatted = num.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatted;
};

// Format currency in Thai Baht
export const formatThaiCurrency = (num: number): string => {
  if (isNaN(num)) return '-';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(2)} ล้านบาท`;
  } else if (absNum >= 1000) {
    return `${formatThaiNumber(num)} บาท`;
  }
  
  return `${formatThaiNumber(num)} บาท`;
};

// Format weight with unit
export const formatWeight = (weight: number, unit: 'baht' | 'gram'): string => {
  if (isNaN(weight)) return '-';
  
  if (unit === 'baht') {
    return `${formatThaiNumber(weight, 4)} บาททอง`;
  }
  
  return `${formatThaiNumber(weight, 2)} กรัม`;
};
