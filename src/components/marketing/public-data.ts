import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Organization, Page, Category, MenuItem } from "@/lib/types";
import { safeWebUrl } from "@/lib/utils";

export type PublicOrganization = Omit<Organization, "is_active" | "created_at" | "updated_at">;
export type PublicCategory = Pick<Category, "id" | "name" | "sort_order">;
export type PublicItem = Omit<MenuItem, "organization_id" | "is_published">;
export type PublicPageData = {
  organization: PublicOrganization;
  page: Pick<Page, "id" | "slug" | "title" | "type" | "description" | "content">;
  categories: PublicCategory[];
  items: PublicItem[];
};

// React request memoization avoids repeating the same query for metadata and rendering.
// The route remains dynamic; no published content is cached between requests.
export const getPublicPage = cache(async (slug: string): Promise<PublicPageData | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || !hasSupabase()) return null;
  const client = await createClient();
  const { data, error } = await client.rpc("get_public_page", { p_slug: slug });
  if (error) throw new Error("Нийтэлсэн хуудсыг ачаалж чадсангүй.");
  return data as PublicPageData | null;
});

export function contentText(content: Record<string, unknown>, key: string) {
  return typeof content[key] === "string" ? content[key] as string : "";
}

export function publicLinks(content: Record<string, unknown>): { label: string; url: string }[] {
  if (!Array.isArray(content.links)) return [];
  return content.links.flatMap((link: unknown) => {
    if (!link || typeof link !== "object" || !("label" in link) || !("url" in link)) return [];
    if (typeof link.label !== "string" || typeof link.url !== "string") return [];
    const url = safeWebUrl(link.url);
    return url && link.label.trim() ? [{ label: link.label, url }] : [];
  });
}

export function safePhone(phone: string | null | undefined) {
  return phone && /^[+\d\s().-]{3,40}$/.test(phone) ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;
}

export function safeEmail(email: string | null | undefined) {
  return email && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? `mailto:${email}` : null;
}

export function brandColor(color: string | null | undefined, fallback: string) {
  return color && /^#[\da-f]{6}$/i.test(color) ? color : fallback;
}

export function contrastText(hex: string) {
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.179 ? "#10212d" : "#ffffff";
}
