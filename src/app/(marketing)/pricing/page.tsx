import { messages } from '@/lib/messages/mn';
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, CircleHelp, Nfc } from "lucide-react";

export const metadata: Metadata = { title: messages.appMarketingPricingPage.title, description: messages.appMarketingPricingPage.description };

export default function PricingPage() {
  return <>
    <section className="marketing-container subpage-hero"><div className="eyebrow">{messages.appMarketingPricingPage.div}</div><h1>{messages.appMarketingPricingPage.h1}<br /><span>{messages.appMarketingPricingPage.span}</span></h1><p>{messages.appMarketingPricingPage.p}<br className="desktop-break" />{messages.appMarketingPricingPage.p2}</p></section>
    <section className="marketing-container pricing-section"><article className="pricing-card"><div className="pricing-intro"><span className="pricing-label"><Nfc size={16} /> NFC SMART PLATFORM</span><h2>{messages.appMarketingPricingPage.h2}<br />{messages.appMarketingPricingPage.h22}</h2><p>{messages.appMarketingPricingPage.p3}</p><div className="pricing-status">{messages.appMarketingPricingPage.div2}</div><p className="pricing-disclaimer">{messages.appMarketingPricingPage.p4}</p><Link href="/register" className="marketing-button">{messages.appMarketingPricingPage.Link}<ArrowUpRight size={18} /></Link></div><div className="pricing-inclusions"><h3>{messages.appMarketingPricingPage.h3}</h3><ul className="marketing-check-list">{[messages.appMarketingPricingPage.message, messages.appMarketingPricingPage.message2, messages.appMarketingPricingPage.message3, messages.appMarketingPricingPage.message4, messages.appMarketingPricingPage.message5, messages.appMarketingPricingPage.message6, messages.appMarketingPricingPage.message7, messages.appMarketingPricingPage.message8].map((text) => <li key={text}><Check size={17} />{text}</li>)}</ul><div className="pricing-hardware"><Nfc size={21} /><p><strong>{messages.appMarketingPricingPage.strong}</strong><br />{messages.appMarketingPricingPage.p5}</p></div></div></article></section>
    <section className="marketing-container faq-section"><div className="eyebrow"><CircleHelp size={15} />{messages.appMarketingPricingPage.div3}</div><h2>{messages.appMarketingPricingPage.h23}</h2><div className="faq-grid"><article><h3>{messages.appMarketingPricingPage.h32}</h3><p>{messages.appMarketingPricingPage.p6}</p></article><article><h3>{messages.appMarketingPricingPage.h33}</h3><p>{messages.appMarketingPricingPage.p7}</p></article><article><h3>{messages.appMarketingPricingPage.h34}</h3><p>{messages.appMarketingPricingPage.p8}</p></article><article><h3>{messages.appMarketingPricingPage.h35}</h3><p>{messages.appMarketingPricingPage.p9}</p></article></div></section>
  </>;
}
