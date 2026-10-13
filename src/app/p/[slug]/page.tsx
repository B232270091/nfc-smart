import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Building2, Download, Globe2, Link2, Mail, MapPin, Nfc, Phone, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicMenu } from "@/components/marketing/public-menu";
import { brandColor, contentText, contrastText, getPublicPage, publicLinks, safeEmail, safePhone, type PublicOrganization } from "@/components/marketing/public-data";
import { assetUrl } from "@/lib/storage";
import { formatMnt, safeWebUrl } from "@/lib/utils";
import { copy } from "@/lib/public-copy";
import "@/components/marketing/public.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicPage(slug);
  if (!data) return { title: "Хуудас олдсонгүй | NFC Smart", robots: { index: false, follow: false } };
  return { title: `${data.page.title} | ${data.organization.name}`, description: data.page.description || data.organization.description || undefined };
}

function OrganizationLinks({ organization }: { organization: PublicOrganization }) {
  const entries = [
    { url: safeWebUrl(organization.website_url), label: copy.website, icon: Globe2 },
    { url: safeWebUrl(organization.facebook_url), label: "Facebook", icon: Link2 },
    { url: safeWebUrl(organization.instagram_url), label: "Instagram", icon: Link2 },
  ].filter((entry) => entry.url);
  return entries.length > 0 ? <div className="public-socials">{entries.map(({ url, label, icon: Icon }) => <a href={url!} key={label} target="_blank" rel="noopener noreferrer" aria-label={`${organization.name} — ${label}`}><Icon size={19} /><span>{label}</span><ArrowUpRight size={14} /></a>)}</div> : null;
}

function ContactDetails({ organization, phone, email }: { organization: PublicOrganization; phone?: string; email?: string }) {
  const phoneValue = phone || organization.phone;
  const emailValue = email || organization.email;
  const phoneHref = safePhone(phoneValue);
  const emailHref = safeEmail(emailValue);
  const mapsUrl = safeWebUrl(organization.maps_url);
  if (!phoneHref && !emailHref && !organization.address && !mapsUrl) return null;
  return <section className="public-contact-card"><h2>{copy.contactDetails}</h2><div className="public-contact-list">{phoneHref && <a href={phoneHref}><span><Phone size={18} /></span><div><small>Утас</small>{phoneValue}</div><ArrowUpRight size={17} /></a>}{emailHref && <a href={emailHref}><span><Mail size={18} /></span><div><small>И-мэйл</small>{emailValue}</div><ArrowUpRight size={17} /></a>}{organization.address && <div className="public-address"><span><MapPin size={18} /></span><div><small>Хаяг</small>{organization.address}</div></div>}{mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer"><span><MapPin size={18} /></span><div>{copy.directions}</div><ArrowUpRight size={17} /></a>}</div></section>;
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicPage(slug);
  if (!data) notFound();
  const { organization, page, categories, items } = data;
  const primary = brandColor(organization.primary_color, "#164f76");
  const secondary = brandColor(organization.secondary_color, "#e5eff7");
  const style = { "--public-brand": primary, "--public-brand-text": contrastText(primary), "--public-secondary": secondary } as CSSProperties;
  const personName = contentText(page.content, "person_name");
  const position = contentText(page.content, "position");
  const photoPath = contentText(page.content, "photo_path");
  const phone = contentText(page.content, "phone");
  const email = contentText(page.content, "email");
  const services = contentText(page.content, "services");
  const links = publicLinks(page.content);
  const isCard = page.type === "business_card";
  const isMenu = page.type === "menu";
  const title = isCard ? personName || page.title : organization.name;
  const phoneHref = safePhone(isCard && phone ? phone : organization.phone);
  const emailHref = safeEmail(isCard && email ? email : organization.email);
  const mapsUrl = safeWebUrl(organization.maps_url);

  return <main id="main-content" className={`public-shell public-type-${page.type}`} style={style}>
    <div className="public-topbar"><Link href="/" className="public-platform-mark"><Nfc size={19} /><span>NFC Smart</span></Link><ThemeToggle /></div>
    <div className="public-container">
      <header className="public-business-header"><div className="public-cover">{organization.cover_path ? <Image src={assetUrl(organization.cover_path)} alt={`${organization.name} — нүүр зураг`} fill priority sizes="(max-width: 1024px) 100vw, 1000px" unoptimized /> : <div className="public-cover-pattern" aria-hidden="true"><div /><div /><Nfc size={70} strokeWidth={.7} /></div>}</div>
        <div className="public-branding"><div className={`public-logo${isCard ? " public-avatar" : ""}`}>{(isCard && photoPath) || organization.logo_path ? <Image src={assetUrl(isCard && photoPath ? photoPath : organization.logo_path!)} alt={title} width={104} height={104} unoptimized /> : isCard ? <UserRound size={40} strokeWidth={1.2} /> : <Building2 size={40} strokeWidth={1.2} />}</div>
          <div className="public-identity"><div className="public-page-label">{isCard ? "ДИЖИТАЛ НЭРИЙН ХУУДАС" : isMenu ? "ДИЖИТАЛ МЕНЮ" : page.type === "links" ? "БИДЭНТЭЙ ХОЛБОГДООРОЙ" : "БАЙГУУЛЛАГЫН ТАНИЛЦУУЛГА"}</div><h1>{title}</h1>{isCard && <p className="public-position">{position && <>{position}<span>·</span></>}{organization.name}</p>}{!isCard && page.title !== organization.name && <p className="public-page-subtitle">{page.title}</p>}{(page.description || organization.description) && <p className="public-description">{page.description || organization.description}</p>}</div>
        </div>
        <div className="public-quick-actions">{isCard && <a className="public-button" href={`/api/contact-card/${encodeURIComponent(slug)}`} download><Download size={17} />{copy.saveContact}</a>}{phoneHref && <a className="public-button public-button-outline" href={phoneHref}><Phone size={16} />{copy.call}</a>}{emailHref && !isMenu && <a className="public-button public-button-outline" href={emailHref}><Mail size={16} />{copy.email}</a>}{mapsUrl && <a className="public-button public-button-outline" href={mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16} />{copy.directions}</a>}</div>
      </header>
      {isMenu ? <PublicMenu categories={categories} items={items.map((item) => ({ ...item, formattedPrice: formatMnt(item.price_mnt), imageUrl: item.image_path ? assetUrl(item.image_path) : null }))} /> : <div className="public-profile-content">{page.type === "company" && services && <section className="public-services"><span className="public-page-label">БИДНИЙ ТУХАЙ</span><h2>{copy.services}</h2><p>{services}</p></section>}{links.length > 0 && <section className="public-custom-links" aria-label={copy.links}>{links.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer"><span>{String(index + 1).padStart(2, "0")}</span><strong>{link.label}</strong><ArrowUpRight size={20} /></a>)}</section>}<OrganizationLinks organization={organization} /><ContactDetails organization={organization} phone={isCard ? phone : undefined} email={isCard ? email : undefined} /></div>}
      {isMenu && <div className="public-menu-contact"><ContactDetails organization={organization} /><OrganizationLinks organization={organization} /></div>}
      <footer className="public-footer"><Link href="/"><Nfc size={16} /><span>{copy.publishedWith}</span><ArrowUpRight size={13} /></Link></footer>
    </div>
  </main>;
}
