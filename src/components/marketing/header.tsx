"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, Nfc, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { copy } from "@/lib/public-copy";

const links = [
  { href: "/features", label: copy.features },
  { href: "/pricing", label: copy.pricing },
  { href: "/contact", label: copy.contact },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="marketing-header">
      <div className="marketing-container marketing-nav">
        <Link href="/" className="brand-mark" aria-label="NFC Smart — нүүр хуудас" onClick={() => setOpen(false)}>
          <span className="brand-icon"><Nfc size={22} strokeWidth={2.2} /></span>
          <span>NFC<span className="brand-word">Smart</span><span className="brand-dot">.</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Үндсэн цэс">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/login" className="nav-login">{copy.login}</Link>
          <Link href="/register" className="marketing-button button-small">{copy.register}<ArrowUpRight size={15} /></Link>
          <button className="mobile-nav-toggle" aria-label={open ? "Цэс хаах" : "Цэс нээх"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Гар утасны цэс">
        {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname === link.href ? "page" : undefined}>{link.label}<ArrowUpRight size={16} /></Link>)}
        <Link href="/login" onClick={() => setOpen(false)}>{copy.login}<ArrowUpRight size={16} /></Link>
      </nav>}
    </header>
  );
}
