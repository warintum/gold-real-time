import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Menu, 
  X, 
  Bell,
  Calculator,
  BarChart3,
  Newspaper,
  History
} from 'lucide-react';

interface HeaderProps {
  currentPrice?: number;
  priceChange?: number;
}

const navItems = [
  { label: 'ราคาทอง', href: '#price', icon: TrendingUp },
  { label: 'ปรับเปลี่ยน', href: '#updates', icon: History },
  { label: 'กราฟ', href: '#chart', icon: BarChart3 },
  { label: 'สัญญาณ', href: '#signal', icon: Bell },
  { label: 'คำนวณ', href: '#calculator', icon: Calculator },
  { label: 'ข่าว', href: '#news', icon: Newspaper },
];

export const Header = ({ currentPrice, priceChange }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-lg border-b border-border/50' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">GoldTracker</h1>
              <p className="text-xs text-muted-foreground">Thai Gold Price</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(item.href)}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Price Badge (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {currentPrice && (
              <Badge 
                variant="outline" 
                className={`${
                  (priceChange || 0) >= 0 
                    ? 'border-emerald-500/30 text-emerald-400' 
                    : 'border-rose-500/30 text-rose-400'
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {currentPrice.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                {(priceChange || 0) >= 0 ? ' ▲' : ' ▼'}
              </Badge>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    onClick={() => scrollToSection(item.href)}
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
            {currentPrice && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ราคาปัจจุบัน</span>
                  <span className={`font-bold number-thai ${
                    (priceChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {currentPrice.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
