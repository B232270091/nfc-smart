import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { MenuItemForm, type EditableMenuItem } from "@/components/content/menu-item-form";
import type { MenuCategory } from "@/components/content/category-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, organization } = await requireOrg(undefined, "menu");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [itemResult, categoryResult] = await Promise.all([
    supabase.from("menu_items").select("*").eq("id", id).eq("organization_id", organization.id).maybeSingle(),
    supabase.from("menu_categories").select("id,name,sort_order,is_active").eq("organization_id", organization.id).order("sort_order"),
  ]);
  if (itemResult.error || categoryResult.error) throw new Error(c.readError);
  if (!itemResult.data) notFound();
  return <div className="stack"><Link href="/dashboard/menu" className="muted text-sm">← {c.back}</Link><div className="page-header"><h1>{c.editItem}</h1></div><MenuItemForm organizationId={organization.id} categories={(categoryResult.data ?? []) as MenuCategory[]} item={itemResult.data as EditableMenuItem} /></div>;
}
