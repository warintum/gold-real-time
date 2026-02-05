import { useGoldPrice } from '@/hooks/useGoldPrice';
import { useTechnicalAnalysis } from '@/hooks/useTechnicalAnalysis';
import { Header } from '@/sections/Header';
import { Hero } from '@/sections/Hero';
import { PriceDisplay } from '@/sections/PriceDisplay';
import { PriceChart } from '@/sections/PriceChart';
import { PriceUpdates } from '@/sections/PriceUpdates';
import { TradingSignal } from '@/sections/TradingSignal';
import { ProfitCalculator } from '@/sections/ProfitCalculator';
import { PriceAlertSection } from '@/sections/PriceAlert';
import { NewsSection } from '@/sections/NewsSection';
import { Footer } from '@/sections/Footer';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  const { priceData, loading, historicalData, priceHistory, stats, refresh } = useGoldPrice(60000); // Refresh every 60 seconds
  
  const currentPrice = priceData?.goldBar.sell || 0;
  const priceChange = priceData?.goldBar.change || 0;
  
  const { signal } = useTechnicalAnalysis(
    historicalData['7d'] || [],
    currentPrice
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        currentPrice={currentPrice} 
        priceChange={priceChange} 
      />
      
      <main>
        <Hero 
          priceData={priceData} 
          loading={loading} 
          onRefresh={refresh} 
        />
        
        <div id="price">
          <PriceDisplay 
            priceData={priceData} 
            loading={loading} 
            onRefresh={refresh} 
          />
        </div>
        
        <div id="updates">
          <PriceUpdates priceHistory={priceHistory} stats={stats} />
        </div>
        
        <div id="chart">
          <PriceChart 
            historicalData={historicalData} 
            currentPrice={currentPrice} 
          />
        </div>
        
        <div id="signal">
          <TradingSignal signal={signal} />
        </div>
        
        <div id="calculator">
          <ProfitCalculator currentPrice={currentPrice} />
        </div>
        
        <div id="alert">
          <PriceAlertSection currentPrice={currentPrice} />
        </div>
        
        <div id="news">
          <NewsSection />
        </div>
      </main>
      
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
