import { TrendingUp, ExternalLink, AlertTriangle, Heart } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-4">
        {/* Risk Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2">
                คำเตือนความเสี่ยง
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนการตัดสินใจ 
                ราคาทองคำมีความผันผวนสูงและอาจมีการเปลี่ยนแปลงได้ตลอดเวลา 
                ข้อมูลบนเว็บไซต์นี้เป็นเพียงข้อมูลอ้างอิง ไม่ใช่คำแนะนำการลงทุน 
                ผู้ลงทุนควรใช้วิจารณญาณในการตัดสินใจและปรึกษาที่ปรึกษาทางการเงินหากจำเป็น
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-background" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">GoldTracker</h2>
                <p className="text-xs text-muted-foreground">Thai Gold Price</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              เว็บไซต์ติดตามราคาทองคำแบบ Real-time สำหรับตลาดไทย 
              พร้อมระบบวิเคราะห์ทางเทคนิคและเครื่องมือช่วยตัดสินใจลงทุน
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>for Thai Investors</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">ลิงก์ด่วน</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#price" 
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  ราคาทองคำ
                </a>
              </li>
              <li>
                <a 
                  href="#chart" 
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  กราฟราคา
                </a>
              </li>
              <li>
                <a 
                  href="#signal" 
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  สัญญาณซื้อขาย
                </a>
              </li>
              <li>
                <a 
                  href="#calculator" 
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  คำนวณกำไร
                </a>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">แหล่งข้อมูล</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.goldtraders.or.th" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  สมาคมค้าทองคำ
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.bot.or.th" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  ธนาคารแห่งประเทศไทย
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.federalreserve.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  ธนาคารกลางสหรัฐ (Fed)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.gold.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                >
                  World Gold Council
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} GoldTracker. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>ข้อมูลจาก: สมาคมค้าทองคำ</span>
              <span>•</span>
              <span>อัปเดต: Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
