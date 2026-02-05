import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Newspaper, 
  TrendingUp, 
  Globe, 
  Landmark, 
  Scale,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useGoldNews } from '@/hooks/useGoldNews';
import type { NewsItem } from '@/types/gold';

const categoryConfig = {
  fed: { icon: Landmark, label: 'นโยบาย Fed', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  currency: { icon: Scale, label: 'ค่าเงิน', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  geopolitical: { icon: Globe, label: 'ภูมิรัฐศาสตร์', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  market: { icon: TrendingUp, label: 'ตลาด', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

const impactConfig = {
  high: { label: 'สูง', color: 'text-rose-400', border: 'border-rose-500/30' },
  medium: { label: 'ปานกลาง', color: 'text-amber-400', border: 'border-amber-500/30' },
  low: { label: 'ต่ำ', color: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const NewsCard = ({ news }: { news: NewsItem }) => {
  const config = categoryConfig[news.category];
  const impact = impactConfig[news.impact];
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'เมื่อสักครู่';
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full ${config.bg} ${config.color} flex items-center justify-center`}>
              <Icon className="w-3 h-3" />
            </div>
            <span className={`text-xs ${config.color}`}>{config.label}</span>
            <Badge variant="outline" className={`text-xs ${impact.color} ${impact.border}`}>
              ผลกระทบ{impact.label}
            </Badge>
          </div>
          <h4 className="font-medium text-foreground mb-1 line-clamp-2">
            {news.title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {news.summary}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {news.source} • {formatDate(news.publishedAt)}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gold hover:text-gold-light h-auto py-1"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(news.title)}`, '_blank')}
            >
              อ่านเพิ่มเติม
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsSkeleton = () => (
  <div className="p-4 bg-secondary/30 rounded-lg border border-border">
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="w-6 h-6 rounded-full" />
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-16 h-4" />
    </div>
    <Skeleton className="w-full h-5 mb-2" />
    <Skeleton className="w-3/4 h-4 mb-2" />
    <div className="flex items-center justify-between">
      <Skeleton className="w-32 h-3" />
      <Skeleton className="w-20 h-6" />
    </div>
  </div>
);

export const NewsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { news, loading, error, refresh } = useGoldNews();

  const filteredNews = selectedCategory
    ? news.filter(n => n.category === selectedCategory)
    : news;

  const categories = [
    { key: null, label: 'ทั้งหมด', icon: Newspaper },
    { key: 'fed', label: 'Fed', icon: Landmark },
    { key: 'currency', label: 'ค่าเงิน', icon: Scale },
    { key: 'geopolitical', label: 'โลก', icon: Globe },
    { key: 'market', label: 'ตลาด', icon: TrendingUp },
  ];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-gold" />
                  ข่าวสารที่มีผลต่อราคาทอง
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ปัจจัยสำคัญที่ส่งผลต่อราคาทองคำ
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.key || 'all'}
                    variant={selectedCategory === cat.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={selectedCategory === cat.key 
                      ? 'bg-gold text-primary-foreground hover:bg-gold-dark' 
                      : 'border-border hover:bg-secondary'
                    }
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-400 font-medium mb-1">ไม่สามารถโหลดข่าวได้</p>
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <NewsSkeleton key={i} />
                ))
              ) : filteredNews.length > 0 ? (
                filteredNews.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ไม่พบข่าวในหมวดหมู่นี้</p>
                </div>
              )}
            </div>

            {!loading && news.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-4 border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => window.open('https://www.google.com/search?q=gold+price+news', '_blank')}
              >
                ดูข่าวทั้งหมด
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
