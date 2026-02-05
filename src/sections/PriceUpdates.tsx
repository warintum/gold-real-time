import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown,
  History,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { PriceUpdate } from '@/types/gold';

interface PriceUpdatesProps {
  priceHistory: PriceUpdate[];
  stats: {
    maxSell: number;
    minSell: number;
    maxBuy: number;
    minBuy: number;
    totalChange: number;
    totalChangePercent: number;
    ups: number;
    downs: number;
    updateCount: number;
  } | null;
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const PriceUpdates = ({ priceHistory, stats }: PriceUpdatesProps) => {
  const [showAll, setShowAll] = useState(false);
  
  // Sort by timestamp descending (newest first) for display
  const sortedHistory = [...priceHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Show only last 5 by default, or all if expanded
  const displayHistory = showAll ? sortedHistory : sortedHistory.slice(0, 5);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-gold" />
                  การปรับเปลี่ยนระหว่างวัน
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ประวัติการปรับเปลี่ยนราคาทองคำในวันนี้
                </p>
              </div>
              <Badge variant="outline" className="border-gold/30 text-gold">
                <Clock className="w-3 h-3 mr-1" />
                {stats?.updateCount || priceHistory.length} ครั้ง
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {sortedHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีข้อมูลการปรับเปลี่ยนในวันนี้</p>
                <p className="text-sm">รอการอัปเดตราคาจากสมาคมค้าทองคำ</p>
              </div>
            ) : (
              <>
                {/* Statistics */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ArrowUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-muted-foreground">สูงสุด</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-400 number-thai">
                        {formatNumber(stats.maxSell)}
                      </p>
                      <p className="text-xs text-muted-foreground">ขายออก</p>
                    </div>
                    
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ArrowDown className="w-3 h-3 text-rose-400" />
                        <span className="text-xs text-muted-foreground">ต่ำสุด</span>
                      </div>
                      <p className="text-lg font-bold text-rose-400 number-thai">
                        {formatNumber(stats.minSell)}
                      </p>
                      <p className="text-xs text-muted-foreground">ขายออก</p>
                    </div>
                    
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart3 className="w-3 h-3 text-gold" />
                        <span className="text-xs text-muted-foreground">เปลี่ยนแปลง</span>
                      </div>
                      <p className={`text-lg font-bold number-thai ${
                        stats.totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {stats.totalChange >= 0 ? '+' : ''}{stats.totalChange.toFixed(0)}
                      </p>
                      <p className={`text-xs ${
                        stats.totalChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        ({stats.totalChangePercent >= 0 ? '+' : ''}{stats.totalChangePercent.toFixed(2)}%)
                      </p>
                    </div>
                    
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-muted-foreground">ขึ้น/ลง</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-emerald-400 font-bold">{stats.ups}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-rose-400 font-bold">{stats.downs}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">ครั้ง</p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                          เวลา
                        </th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                          ครั้งที่
                        </th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                          ทองแท่ง รับซื้อ
                        </th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                          ทองแท่ง ขายออก
                        </th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                          ทองรูปพรรณ รับซื้อ
                        </th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                          ทองรูปพรรณ ขายออก
                        </th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                          ขึ้น/ลง
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayHistory.map((update, index) => {
                        // Calculate change from next item (which is chronologically previous)
                        const nextItem = displayHistory[index + 1];
                        const change = nextItem ? update.goldBar.sell - nextItem.goldBar.sell : 0;
                        const isPositive = change > 0;
                        
                        return (
                          <tr 
                            key={update.timestamp} 
                            className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                          >
                            <td className="py-3 px-2 text-sm text-foreground">
                              {formatTime(update.timestamp)}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <Badge variant="outline" className="text-xs">
                                {update.round}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-right text-sm number-thai">
                              {formatNumber(update.goldBar.buy)}
                            </td>
                            <td className="py-3 px-2 text-right text-sm font-medium text-gold number-thai">
                              {formatNumber(update.goldBar.sell)}
                            </td>
                            <td className="py-3 px-2 text-right text-sm number-thai">
                              {formatNumber(update.goldOrnament.buy)}
                            </td>
                            <td className="py-3 px-2 text-right text-sm number-thai">
                              {formatNumber(update.goldOrnament.sell)}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {change === 0 ? (
                                <span className="text-muted-foreground">-</span>
                              ) : isPositive ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  +{change.toFixed(0)}
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  {change.toFixed(0)}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {sortedHistory.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-gold hover:text-gold-light hover:bg-gold/10"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        แสดงน้อยลง
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        ดูทั้งหมด ({sortedHistory.length} รายการ)
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
