import { messages } from '@/lib/messages/mn';
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Check, CreditCard, Globe2, Layers3, Link2, MousePointer2, Nfc, QrCode, ShieldCheck, Smartphone, UtensilsCrossed } from "lucide-react";
import { ProductPreview } from "@/components/marketing/product-preview";

const features = [
  { icon: UtensilsCrossed, label: "01 / DIGITAL MENU", title: messages.appMarketingPage.title, description: messages.appMarketingPage.description, className: "feature-menu" },
  { icon: CreditCard, label: "02 / DIGITAL IDENTITY", title: messages.appMarketingPage.title2, description: messages.appMarketingPage.description2, className: "feature-identity" },
  { icon: Nfc, label: "03 / SMART CONNECTION", title: messages.appMarketingPage.title3, description: messages.appMarketingPage.description3, className: "feature-connect" },
  { icon: BarChart3, label: "04 / CLEAR INSIGHTS", title: messages.appMarketingPage.title4, description: messages.appMarketingPage.description4, className: "feature-insights" },
];

export default function HomePage() {
  return <>
    <section className="marketing-hero marketing-container">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-pulse" />{messages.appMarketingPage.div}</div>
        <h1>{messages.appMarketingPage.h1}<br /><span>{messages.appMarketingPage.span}</span></h1>
        <p className="hero-description">{messages.appMarketingPage.p}<br className="desktop-break" />{messages.appMarketingPage.p2}</p>
        <div className="hero-actions"><Link href="/register" className="marketing-button">{messages.appMarketingPage.Link}<ArrowUpRight size={19} /></Link><Link href="/features" className="marketing-text-link">{messages.appMarketingPage.Link2}<ArrowRight size={17} /></Link></div>
        <div className="hero-assurance"><span><Check size={14} />{messages.appMarketingPage.span2}</span><span><Check size={14} />{messages.appMarketingPage.span3}</span></div>
      </div>
      <ProductPreview />
    </section>
    <div className="use-case-band"><div className="marketing-container"><span className="use-case-caption">{messages.appMarketingPage.span4}<br /><b>{messages.appMarketingPage.b}</b></span><span><UtensilsCrossed size={20} />{messages.appMarketingPage.span5}</span><span><Globe2 size={20} />{messages.appMarketingPage.span6}</span><span><CreditCard size={20} />{messages.appMarketingPage.span7}</span><span><Link2 size={20} />{messages.appMarketingPage.span8}</span></div></div>
    <section className="marketing-container marketing-section" id="possibilities">
      <div className="section-heading"><div><div className="eyebrow">{messages.appMarketingPage.div2}</div><h2>{messages.appMarketingPage.h2}<br />{messages.appMarketingPage.h22}</h2></div><Link href="/features" className="marketing-text-link">{messages.appMarketingPage.Link3}<ArrowUpRight size={18} /></Link></div>
      <div className="feature-grid">{features.map(({ icon: Icon, ...feature }) => <article key={feature.label} className={`marketing-feature ${feature.className}`}><div className="feature-top"><span className="feature-icon"><Icon size={25} strokeWidth={1.65} /></span><ArrowUpRight size={20} className="feature-arrow" /></div><span className="feature-label">{feature.label}</span><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div>
    </section>
    <section className="how-section"><div className="marketing-container marketing-section"><div className="section-heading"><div><div className="eyebrow">{messages.appMarketingPage.div3}</div><h2>{messages.appMarketingPage.h23}</h2></div><p>{messages.appMarketingPage.p3}<br />{messages.appMarketingPage.p4}</p></div>
      <div className="steps-grid">{[{ n: "01", icon: Layers3, title: messages.appMarketingPage.title5, description: messages.appMarketingPage.description5 }, { n: "02", icon: MousePointer2, title: messages.appMarketingPage.title6, description: messages.appMarketingPage.description6 }, { n: "03", icon: Smartphone, title: messages.appMarketingPage.title7, description: messages.appMarketingPage.description7 }].map(({ icon: Icon, ...step }) => <article className="step-card" key={step.n}><div className="step-line"><span>{step.n}</span><Icon size={24} strokeWidth={1.5} /></div><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      <div className="permanent-link-note"><ShieldCheck size={22} /><p><strong>{messages.appMarketingPage.strong}</strong>{messages.appMarketingPage.p5}</p><Link href="/features#nfc" aria-label={messages.appMarketingPage.arialabel}><ArrowRight size={21} /></Link></div>
    </div></section>
    <section className="marketing-container cta-section"><div className="cta-panel"><div><div className="eyebrow">{messages.appMarketingPage.div4}</div><h2>{messages.appMarketingPage.h24}<br />{messages.appMarketingPage.h25}</h2><p>{messages.appMarketingPage.p6}</p><Link href="/register" className="marketing-button button-light">{messages.appMarketingPage.Link4}<ArrowUpRight size={19} /></Link></div><div className="cta-art" aria-hidden="true"><div className="cta-ring" /><div className="cta-ring inner" /><Nfc size={96} strokeWidth={1} /><QrCode className="cta-qr" size={36} strokeWidth={1.4} /></div></div></section>
  </>;
}
