import { messages } from '@/lib/messages/mn';
import Link from "next/link";
import { ArrowUpRight, Nfc } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container footer-top">
        <div><Link href="/" className="brand-mark"><span className="brand-icon"><Nfc size={22} /></span><span>NFC<span className="brand-word">Smart</span><span className="brand-dot">.</span></span></Link><p>{messages.componentsMarketingFooter.p}</p></div>
        <div className="footer-links"><Link href="/features">{messages.componentsMarketingFooter.Link}</Link><Link href="/pricing">{messages.componentsMarketingFooter.Link2}</Link><Link href="/contact">{messages.componentsMarketingFooter.Link3}</Link><Link href="/register">{messages.componentsMarketingFooter.Link4}<ArrowUpRight size={14} /></Link></div>
      </div>
      <div className="marketing-container footer-bottom"><span>© {new Date().getFullYear()} NFC Smart</span><span className="footer-location"><span />{messages.componentsMarketingFooter.span}</span></div>
    </footer>
  );
}
