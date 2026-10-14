import { messages } from '@/lib/messages/mn';
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Building2, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: messages.appMarketingContactPage.title, description: messages.appMarketingContactPage.description };

export default function ContactPage() {
  const configuredEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const supportEmail = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : null;
  return <>
    <section className="marketing-container subpage-hero"><div className="eyebrow">{messages.appMarketingContactPage.div}</div><h1>{messages.appMarketingContactPage.h1}<br /><span>{messages.appMarketingContactPage.span}</span></h1><p>{messages.appMarketingContactPage.p}<br className="desktop-break" />{messages.appMarketingContactPage.p2}</p></section>
    <section className="marketing-container contact-grid"><article className="contact-primary"><span className="feature-icon"><MessageCircle size={28} /></span><h2>{messages.appMarketingContactPage.h2}</h2>{supportEmail ? <><p>{messages.appMarketingContactPage.p3}</p><a href={`mailto:${supportEmail}`} className="contact-email"><Mail size={21} />{supportEmail}<ArrowUpRight size={19} /></a></> : <><p>{messages.appMarketingContactPage.p4}</p><span className="contact-status"><span />{messages.appMarketingContactPage.span2}</span></>}<p className="contact-note">{messages.appMarketingContactPage.p5}</p></article><div className="contact-secondary"><article><Building2 size={27} /><h3>{messages.appMarketingContactPage.h3}</h3><p>{messages.appMarketingContactPage.p6}</p><Link href="/register" className="marketing-text-link">{messages.appMarketingContactPage.Link}<ArrowUpRight size={17} /></Link></article><article><BookOpen size={27} /><h3>{messages.appMarketingContactPage.h32}</h3><p>{messages.appMarketingContactPage.p7}</p><Link href="/features" className="marketing-text-link">{messages.appMarketingContactPage.Link2}<ArrowUpRight size={17} /></Link></article></div></section>
  </>;
}
