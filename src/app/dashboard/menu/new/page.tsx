import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { MenuItemForm } from "@/components/content/menu-item-form";
import type { MenuCategory } from "@/components/content/category-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function NewMenuItemPage() {
  const { supabase, organization } = await requireOrg(undefined, "menu");
  const { data, error } = await supabase.from("menu_categories").select("id,name,sort_order,is_active").eq("organization_id", organization.id).order("sort_order");
  if (error) throw new Error(c.readError);
  const categories = (data ?? []) as MenuCategory[];
  return <div className="stack"><Link href="/dashboard/menu" className="muted text-sm">← {c.back}</Link><div className="page-header"><h1>{c.newItem}</h1></div>
    {categories.length ? <MenuItemForm organizationId={organization.id} categories={categories} /> : <div className="panel empty"><p>{c.noCategories}</p><Link href="/dashboard/menu/categories" className="button mt-4">{c.newCategory}</Link></div>}
  </div>;
}
