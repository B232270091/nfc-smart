import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Building2, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Холбоо барих | NFC Smart", description: "NFC Smart-тай холбогдох болон бизнесээ эхлүүлэх мэдээлэл." };

export default function ContactPage() {
  const configuredEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const supportEmail = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : null;
  return <>
    <section className="marketing-container subpage-hero"><div className="eyebrow">НЭГ АЛХАМ ОЙР</div><h1>Хамтдаа<br /><span>холболт үүсгэе.</span></h1><p>Платформын талаар мэдээлэл авах эсвэл<br className="desktop-break" /> өөрийн бизнесийн хуудсыг эхлүүлэх боломжууд.</p></section>
    <section className="marketing-container contact-grid"><article className="contact-primary"><span className="feature-icon"><MessageCircle size={28} /></span><h2>Бидэнтэй холбогдох</h2>{supportEmail ? <><p>Платформын талаар асуух зүйл, санал хүсэлтээ доорх хаягт илгээгээрэй.</p><a href={`mailto:${supportEmail}`} className="contact-email"><Mail size={21} />{supportEmail}<ArrowUpRight size={19} /></a></> : <><p>Платформын тусламжийн и-мэйл хаяг хараахан тохируулагдаагүй байна. Холбоо барих суваг бэлэн болмогц энд нийтлэгдэнэ.</p><span className="contact-status"><span /> Холбоо барих суваг удахгүй</span></>}<p className="contact-note">Байгууллагын нийтэд харагдах утас, хаяг, сошиал холбоосыг тухайн байгууллага өөрийн удирдлагын самбарт оруулна.</p></article><div className="contact-secondary"><article><Building2 size={27} /><h3>Бизнесийн хуудсаа эхлүүлэх</h3><p>Бүртгэл үүсгээд байгууллагаа нэмж, өөрийн дижитал орон зайг бэлдээрэй.</p><Link href="/register" className="marketing-text-link">Бүртгүүлэх <ArrowUpRight size={17} /></Link></article><article><BookOpen size={27} /><h3>Боломжуудтай танилцах</h3><p>Меню, нэрийн хуудас, QR болон NFC карт хэрхэн хамт ажилладгийг үзээрэй.</p><Link href="/features" className="marketing-text-link">Дэлгэрэнгүй үзэх <ArrowUpRight size={17} /></Link></article></div></section>
  </>;
}
