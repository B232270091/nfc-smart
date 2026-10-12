import Link from "next/link";
import { ArrowUpRight, Nfc } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container footer-top">
        <div><Link href="/" className="brand-mark"><span className="brand-icon"><Nfc size={22} /></span><span>NFC<span className="brand-word">Smart</span><span className="brand-dot">.</span></span></Link><p>Бодит бизнесийг дижитал боломжтой холбоно.</p></div>
        <div className="footer-links"><Link href="/features">Боломжууд</Link><Link href="/pricing">Үнийн мэдээлэл</Link><Link href="/contact">Холбоо барих</Link><Link href="/register">Эхлэх <ArrowUpRight size={14} /></Link></div>
      </div>
      <div className="marketing-container footer-bottom"><span>© {new Date().getFullYear()} NFC Smart</span><span className="footer-location"><span /> Монгол бизнесүүдэд зориулав</span></div>
    </footer>
  );
}
