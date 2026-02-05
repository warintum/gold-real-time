import { useState, useEffect, useCallback } from 'react';
import type { NewsItem } from '@/types/gold';

// Fetch gold-related news from multiple sources
const fetchGoldNews = async (): Promise<NewsItem[]> => {
  const news: NewsItem[] = [];
  
  // Try to fetch from NewsAPI (gold-related news)
  try {
    const response = await fetch(
      'https://newsapi.org/v2/everything?' +
      'q=gold+price+OR+gold+market+OR+federal+reserve+OR+USD+THB&' +
      'sortBy=publishedAt&' +
      'language=en&' +
      'pageSize=20'
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.articles) {
        return data.articles.map((article: any, index: number) => {
          const title = article.title?.toLowerCase() || '';
          
          // Categorize news
          let category: 'fed' | 'currency' | 'geopolitical' | 'market' = 'market';
          let impact: 'high' | 'medium' | 'low' = 'medium';
          
          if (title.includes('fed') || title.includes('federal reserve') || title.includes('interest rate')) {
            category = 'fed';
            impact = 'high';
          } else if (title.includes('usd') || title.includes('baht') || title.includes('currency') || title.includes('dollar')) {
            category = 'currency';
            impact = 'medium';
          } else if (title.includes('war') || title.includes('conflict') || title.includes('tension') || title.includes('geopolitical')) {
            category = 'geopolitical';
            impact = 'high';
          }
          
          // Adjust impact based on keywords
          if (title.includes('surge') || title.includes('plunge') || title.includes('crash') || title.includes('soar')) {
            impact = 'high';
          }
          
          return {
            id: `news-${index}`,
            title: article.title,
            summary: article.description || 'ไม่มีคำอธิบาย',
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt,
            category,
            impact,
          };
        });
      }
    }
  } catch (error) {
    console.warn('NewsAPI fetch failed:', error);
  }
  
  // Fallback: Fetch from alternative sources
  try {
    // Try to get data from Reddit r/gold
    const redditResponse = await fetch('https://www.reddit.com/r/gold/hot.json?limit=10');
    if (redditResponse.ok) {
      const redditData = await redditResponse.json();
      const posts = redditData.data?.children || [];
      
      posts.forEach((post: any, index: number) => {
        const data = post.data;
        if (data && data.title) {
          news.push({
            id: `reddit-${index}`,
            title: data.title,
            summary: data.selftext?.substring(0, 200) || 'ไม่มีคำอธิบาย',
            source: 'Reddit r/gold',
            publishedAt: new Date(data.created_utc * 1000).toISOString(),
            category: 'market',
            impact: data.score > 100 ? 'high' : 'medium',
          });
        }
      });
    }
  } catch (error) {
    console.warn('Reddit fetch failed:', error);
  }
  
  // If no news fetched, return empty array (component will show appropriate message)
  return news;
};

// Fetch economic calendar events that affect gold
const fetchEconomicEvents = async (): Promise<NewsItem[]> => {
  const events: NewsItem[] = [];
  
  // Major economic events that typically affect gold prices
  const today = new Date();
  
  // These are scheduled events - in production, you'd fetch from an economic calendar API
  const scheduledEvents = [
    {
      title: 'FOMC Meeting Minutes',
      summary: 'การประชุมคณะกรรมการนโยบายการเงินของ Fed มีผลต่อทิศทางอัตราดอกเบี้ย',
      source: 'Federal Reserve',
      category: 'fed' as const,
      impact: 'high' as const,
    },
    {
      title: 'US Non-Farm Payrolls',
      summary: 'ตัวเลขการจ้างงานนอกภาคเกษตรของสหรัฐ ตัวชี้วัดสำคัญของเศรษฐกิจ',
      source: 'US Bureau of Labor Statistics',
      category: 'fed' as const,
      impact: 'high' as const,
    },
    {
      title: 'CPI Inflation Data',
      summary: 'ตัวเลขเงินเฟ้อผู้บริโภค มีผลต่อนโยบายการเงินของ Fed',
      source: 'US Bureau of Labor Statistics',
      category: 'fed' as const,
      impact: 'high' as const,
    },
  ];
  
  scheduledEvents.forEach((event, index) => {
    const eventDate = new Date(today);
    eventDate.setDate(eventDate.getDate() + (index * 7)); // Spread events across weeks
    
    events.push({
      id: `event-${index}`,
      title: event.title,
      summary: event.summary,
      source: event.source,
      publishedAt: eventDate.toISOString(),
      category: event.category,
      impact: event.impact,
    });
  });
  
  return events;
};

export const useGoldNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      
      const [fetchedNews, economicEvents] = await Promise.all([
        fetchGoldNews(),
        fetchEconomicEvents(),
      ]);
      
      // Combine and sort by date
      const allNews = [...fetchedNews, ...economicEvents].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      setNews(allNews);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    
    // Refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchNews]);

  return {
    news,
    loading,
    error,
    refresh: fetchNews,
  };
};
