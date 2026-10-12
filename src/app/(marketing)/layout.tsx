import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import "@/components/marketing/marketing.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing-shell"><MarketingHeader /><main id="main-content">{children}</main><MarketingFooter /></div>;
}
