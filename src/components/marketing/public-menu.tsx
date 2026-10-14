"use client";
import { messages } from '@/lib/messages/mn';

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, UtensilsCrossed, X } from "lucide-react";
import { copy } from "@/lib/public-copy";

type MenuCategory = { id: string; name: string };
type MenuProduct = {
  id: string; category_id: string; name_mn: string; name_en: string | null;
  description: string | null; formattedPrice: string; imageUrl: string | null; is_available: boolean;
};

export function PublicMenu({ categories, items }: { categories: MenuCategory[]; items: MenuProduct[] }) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("mn");
    return items.filter((item) => (!categoryId || item.category_id === categoryId) && (!normalized || [item.name_mn, item.name_en, item.description].filter(Boolean).join(" ").toLocaleLowerCase("mn").includes(normalized)));
  }, [query, categoryId, items]);
  const visibleCategories = categories.filter((category) => filtered.some((item) => item.category_id === category.id));

  if (items.length === 0) return <section className="public-empty"><UtensilsCrossed size={34} strokeWidth={1.3} /><h2>{copy.emptyMenu}</h2><p>{copy.emptyMenuDescription}</p></section>;

  return <section className="public-menu-section" aria-label={messages.componentsMarketingPublicMenu.arialabel}>
    <div className="menu-tools"><label className="menu-search"><Search size={19} /><span className="sr-only">{copy.searchMenu}</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={copy.searchMenu} autoComplete="off" />{query && <button type="button" onClick={() => setQuery("")} aria-label={copy.resetSearch}><X size={16} /></button>}</label>
      <div className="menu-category-tabs" aria-label={messages.componentsMarketingPublicMenu.arialabel2}><button type="button" aria-pressed={!categoryId} onClick={() => setCategoryId("")}>{copy.all}<span>{items.length}</span></button>{categories.filter((category) => items.some((item) => item.category_id === category.id)).map((category) => <button type="button" key={category.id} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}</button>)}</div>
    </div>
    <div className="sr-only" aria-live="polite">{filtered.length}{messages.componentsMarketingPublicMenu.div}</div>
    {filtered.length === 0 ? <div className="public-empty"><Search size={30} strokeWidth={1.3} /><p>{copy.noResults}</p><button className="public-button" type="button" onClick={() => { setQuery(""); setCategoryId(""); }}>{copy.resetSearch}</button></div> : visibleCategories.map((category) => <section key={category.id} className="public-menu-category"><div className="menu-category-heading"><h2>{category.name}</h2><span>{filtered.filter((item) => item.category_id === category.id).length}{messages.componentsMarketingPublicMenu.span}</span></div><div className="public-menu-grid">{filtered.filter((item) => item.category_id === category.id).map((item) => <article className={`public-product${item.is_available ? "" : " product-unavailable"}`} key={item.id}>
      <div className="public-product-image">{item.imageUrl ? <Image src={item.imageUrl} alt={item.name_mn} fill sizes="(max-width: 640px) 44vw, (max-width: 960px) 45vw, 310px" unoptimized /> : <UtensilsCrossed size={36} strokeWidth={1} aria-label={messages.componentsMarketingPublicMenu.arialabel3} />}{!item.is_available && <span className="availability-badge">{copy.unavailable}</span>}</div><div className="public-product-info"><h3>{item.name_mn}</h3>{item.name_en && <p className="public-product-english" lang="en">{item.name_en}</p>}{item.description && <p className="public-product-description">{item.description}</p>}<span className="public-product-price">{item.formattedPrice}</span></div>
    </article>)}</div></section>)}
  </section>;
}
