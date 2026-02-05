import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calculator, RotateCcw, TrendingUp, TrendingDown, Wallet, Scale } from 'lucide-react';
import { useProfitCalculator, formatThaiNumber } from '@/hooks/useProfitCalculator';

interface ProfitCalculatorProps {
  currentPrice: number;
}

export const ProfitCalculator = ({ currentPrice }: ProfitCalculatorProps) => {
  const {
    buyPrice,
    currentPrice: calcCurrentPrice,
    weight,
    weightUnit,
    result,
    updateBuyPrice,
    updateCurrentPrice,
    updateWeight,
    updateWeightUnit,
    reset,
  } = useProfitCalculator(currentPrice);

  const [showResult, setShowResult] = useState(false);

  const handleCalculate = () => {
    if (result) {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    reset();
    setShowResult(false);
  };

  // Update current price when prop changes
  if (currentPrice !== parseFloat(calcCurrentPrice) && calcCurrentPrice === '') {
    updateCurrentPrice(currentPrice.toString());
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gold" />
                คำนวณกำไร/ขาดทุน
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                คำนวณผลตอบแทนจากการลงทุนทองคำ
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Input Form */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyPrice" className="text-sm text-muted-foreground">
                  ราคาซื้อ (บาท/บาททอง)
                </Label>
                <Input
                  id="buyPrice"
                  type="number"
                  placeholder="เช่น 70,000"
                  value={buyPrice}
                  onChange={(e) => updateBuyPrice(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPrice" className="text-sm text-muted-foreground">
                  ราคาปัจจุบัน (บาท/บาททอง)
                </Label>
                <Input
                  id="currentPrice"
                  type="number"
                  value={calcCurrentPrice}
                  onChange={(e) => updateCurrentPrice(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm text-muted-foreground">
                  จำนวนน้ำหนัก
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="เช่น 1"
                  value={weight}
                  onChange={(e) => updateWeight(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">หน่วยน้ำหนัก</Label>
                <RadioGroup
                  value={weightUnit}
                  onValueChange={(v) => updateWeightUnit(v as 'baht' | 'gram')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="baht" id="baht" />
                    <Label htmlFor="baht" className="text-sm cursor-pointer">บาททอง</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gram" id="gram" />
                    <Label htmlFor="gram" className="text-sm cursor-pointer">กรัม</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleCalculate}
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
                disabled={!result}
              >
                <Calculator className="w-4 h-4 mr-2" />
                คำนวณ
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-border hover:bg-secondary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                รีเซ็ต
              </Button>
            </div>

            {/* Result */}
            {showResult && result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-6 rounded-xl border-2 ${
                  result.profitLoss >= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        result.profitLoss >= 0 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {result.profitLoss >= 0 
                          ? <TrendingUp className="w-6 h-6" /> 
                          : <TrendingDown className="w-6 h-6" />
                        }
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {result.profitLoss >= 0 ? 'กำไร' : 'ขาดทุน'}
                        </p>
                        <p className={`text-3xl font-bold number-thai ${
                          result.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {result.profitLoss >= 0 ? '+' : ''}
                          {formatThaiNumber(result.profitLoss)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">เปอร์เซ็นต์</p>
                      <p className={`text-xl font-bold number-thai ${
                        result.profitLossPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {result.profitLossPercent >= 0 ? '+' : ''}
                        {result.profitLossPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-gold" />
                      <p className="text-sm text-muted-foreground">มูลค่าปัจจุบัน</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground number-thai">
                      {formatThaiNumber(result.totalValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">บาท</p>
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">ต้นทุน</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground number-thai">
                      {formatThaiNumber(result.totalCost)}
                    </p>
                    <p className="text-xs text-muted-foreground">บาท</p>
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-4 h-4 text-gold" />
                      <p className="text-sm text-muted-foreground">น้ำหนัก</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground number-thai">
                      {weightUnit === 'baht' 
                        ? `${formatThaiNumber(result.weight, 4)} บาททอง`
                        : `${formatThaiNumber(result.weight, 2)} กรัม`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weightUnit === 'baht' 
                        ? `(${formatThaiNumber(result.weight * 15.244, 2)} กรัม)`
                        : `(${formatThaiNumber(result.weight / 15.244, 4)} บาททอง)`
                      }
                    </p>
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-gold" />
                      <p className="text-sm text-muted-foreground">ราคาซื้อ/ขาย</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground number-thai">
                      {formatThaiNumber(result.buyPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {formatThaiNumber(result.currentPrice)} บาท
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Reference */}
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                ข้อมูลอ้างอิง
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="text-foreground">1 บาททอง</span> = 15.244 กรัม
                </p>
                <p className="text-muted-foreground">
                  <span className="text-foreground">1 กรัม</span> = 0.0656 บาททอง
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
