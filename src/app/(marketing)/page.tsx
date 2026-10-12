import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Check, CreditCard, Globe2, Layers3, Link2, MousePointer2, Nfc, QrCode, ShieldCheck, Smartphone, UtensilsCrossed } from "lucide-react";
import { ProductPreview } from "@/components/marketing/product-preview";

const features = [
  { icon: UtensilsCrossed, label: "01 / DIGITAL MENU", title: "Меню тань амьд байг.", description: "Хоол, зураг, үнэ, ангиллаа нэг дор удирдаж, шинэчлэлтээ хэрэглэгчдэд шууд хүргээрэй.", className: "feature-menu" },
  { icon: CreditCard, label: "02 / DIGITAL IDENTITY", title: "Танилцах шинэ хэлбэр.", description: "Нэрийн хуудас, байгууллагын танилцуулга, сошиал хаягуудаа нэг холбоост нэгтгээрэй.", className: "feature-identity" },
  { icon: Nfc, label: "03 / SMART CONNECTION", title: "Нэг карт. Олон боломж.", description: "Карт дээрх холбоосоо нэг удаа бичээд, очих хуудсыг хүссэн үедээ сольж болно.", className: "feature-connect" },
  { icon: BarChart3, label: "04 / CLEAR INSIGHTS", title: "Хүрэлт бүрээ ойлго.", description: "Картаар нээгдсэн хуудасны тоо болон өдрийн хандалтаа хяналтын самбараас хараарай.", className: "feature-insights" },
];

export default function HomePage() {
  return <>
    <section className="marketing-hero marketing-container">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-pulse" /> ТАНЫ БИЗНЕСИЙН ДИЖИТАЛ ХОЛБООС</div>
        <h1>Нэг хүрэлт.<br /><span>Шинэ боломж.</span></h1>
        <p className="hero-description">Меню, нэрийн хуудас, бизнесийн танилцуулга.<br className="desktop-break" /> Бүгдийг нэг NFC карт, нэг QR кодоор.</p>
        <div className="hero-actions"><Link href="/register" className="marketing-button">Бизнесээ холбох <ArrowUpRight size={19} /></Link><Link href="/features" className="marketing-text-link">Боломжуудыг үзэх <ArrowRight size={17} /></Link></div>
        <div className="hero-assurance"><span><Check size={14} /> Апп татах шаардлагагүй</span><span><Check size={14} /> Шууд шинэчлэгдэнэ</span></div>
      </div>
      <ProductPreview />
    </section>
    <div className="use-case-band"><div className="marketing-container"><span className="use-case-caption">БИЗНЕС БҮРИЙН<br /><b>ӨДӨР ТУТМЫН ХЭРЭГЦЭЭНД</b></span><span><UtensilsCrossed size={20} /> Ресторан & кафе</span><span><Globe2 size={20} /> Байгууллага</span><span><CreditCard size={20} /> Мэргэжилтэн</span><span><Link2 size={20} /> Бүтээгч</span></div></div>
    <section className="marketing-container marketing-section" id="possibilities">
      <div className="section-heading"><div><div className="eyebrow">ЦӨӨН ҮЙЛДЭЛ. ИЛҮҮ БОЛОМЖ.</div><h2>Бизнесийн тань дараагийн<br />холболт эндээс эхэлнэ.</h2></div><Link href="/features" className="marketing-text-link">Бүх боломжууд <ArrowUpRight size={18} /></Link></div>
      <div className="feature-grid">{features.map(({ icon: Icon, ...feature }) => <article key={feature.label} className={`marketing-feature ${feature.className}`}><div className="feature-top"><span className="feature-icon"><Icon size={25} strokeWidth={1.65} /></span><ArrowUpRight size={20} className="feature-arrow" /></div><span className="feature-label">{feature.label}</span><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div>
    </section>
    <section className="how-section"><div className="marketing-container marketing-section"><div className="section-heading"><div><div className="eyebrow">ЭНГИЙНЭЭР ЭХЭЛ</div><h2>Тохируул. Холбо. Хүргэ.</h2></div><p>Техникийн мэдлэг шаардахгүй.<br />Таны бизнесийг та л хамгийн сайн мэднэ.</p></div>
      <div className="steps-grid">{[{ n: "01", icon: Layers3, title: "Өөрийн орон зайг үүсгэ", description: "Бүртгүүлээд байгууллагын нэр, лого, өнгө төрхөө тохируулаарай." }, { n: "02", icon: MousePointer2, title: "Хуудсаа бэлэн болго", description: "Меню эсвэл танилцуулгаа үүсгэж, мэдээллээ нэмээд нийтлээрэй." }, { n: "03", icon: Smartphone, title: "Нэг хүрэлтээр хуваалц", description: "Тогтмол холбоосоо NFC картдаа бичих эсвэл QR кодоо байрлуулаарай." }].map(({ icon: Icon, ...step }) => <article className="step-card" key={step.n}><div className="step-line"><span>{step.n}</span><Icon size={24} strokeWidth={1.5} /></div><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      <div className="permanent-link-note"><ShieldCheck size={22} /><p><strong>Мэдээлэл өөрчлөгдөнө. Холбоос хэвээр.</strong> Үнэ, зураг, хуудсаа шинэчлэхэд картаа дахин бичих шаардлагагүй.</p><Link href="/features#nfc" aria-label="Тогтмол NFC холбоосын тухай"><ArrowRight size={21} /></Link></div>
    </div></section>
    <section className="marketing-container cta-section"><div className="cta-panel"><div><div className="eyebrow">БОДИТ БИЗНЕС. ДИЖИТАЛ БОЛОМЖ.</div><h2>Дараагийн хүрэлтийг<br />боломж болгоё.</h2><p>Бизнесийн мэдээллээ нэг дор. Хэрэглэгчдээ нэг алхам ойр.</p><Link href="/register" className="marketing-button button-light">Одоо бүртгүүлэх <ArrowUpRight size={19} /></Link></div><div className="cta-art" aria-hidden="true"><div className="cta-ring" /><div className="cta-ring inner" /><Nfc size={96} strokeWidth={1} /><QrCode className="cta-qr" size={36} strokeWidth={1.4} /></div></div></section>
  </>;
}
