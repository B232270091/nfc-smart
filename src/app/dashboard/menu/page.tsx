import Link from "next/link";
import Image from "next/image";
import { Plus, Utensils, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { assetUrl } from "@/lib/storage";
import { deleteMenuItem, updateMenuItemStatus } from "@/lib/actions/content";
import { ActionForm } from "@/components/forms";
import { DeleteForm } from "@/components/content/delete-form";
import { contentCopy as c } from "@/lib/content-copy";
import type { MenuCategory } from "@/components/content/category-form";
import type { EditableMenuItem } from "@/components/content/menu-item-form";
import { Pagination } from "@/components/pagination";
import { pageNumber, PAGE_SIZE } from "@/lib/pagination";

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[]; status?: string | string[]; page?: string | string[] }> }) {
  const { supabase, organization } = await requireOrg(undefined, "menu");
  const filters = await searchParams;
  const page = pageNumber(filters.page);
  const queryText = (typeof filters.q === "string" ? filters.q : "").slice(0, 100).trim();
  const categoryId = typeof filters.category === "string" && z.string().uuid().safeParse(filters.category).success ? filters.category : "";
  const status = typeof filters.status === "string" && ["available", "unavailable", "published", "draft"].includes(filters.status) ? filters.status : "";
  let query = supabase.from("menu_items").select("id,category_id,name_mn,name_en,description,price_mnt,image_path,sort_order,is_available,is_published", { count: 'exact' }).eq("organization_id", organization.id).order("sort_order").order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (queryText) query = query.ilike("name_mn", `%${queryText.replace(/[\\%_]/g, "\\$&")}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (status === "available" || status === "unavailable") query = query.eq("is_available", status === "available");
  if (status === "published" || status === "draft") query = query.eq("is_published", status === "published");
  const [itemResult, categoryResult] = await Promise.all([
    query,
    supabase.from("menu_categories").select("id,name,sort_order,is_active").eq("organization_id", organization.id).order("sort_order"),
  ]);
  if (itemResult.error || categoryResult.error) throw new Error(c.readError);
  const items = (itemResult.data ?? []) as EditableMenuItem[];
  const categories = (categoryResult.data ?? []) as MenuCategory[];
  return <div className="stack">
    <div className="page-header"><div><h1>{c.menu}</h1><p className="muted">{c.menuDescription}</p></div><div className="actions"><Link className="button button-secondary" href="/dashboard/menu/categories"><SlidersHorizontal size={17} />{c.categories}</Link><Link className="button" href="/dashboard/menu/new"><Plus size={17} />{c.newItem}</Link></div></div>
    <div className="panel flex flex-wrap items-center justify-between gap-3"><p className="muted text-sm">{c.menuPublishHelp}</p><Link href="/dashboard/pages/new?type=menu" className="button button-secondary">{c.publishMenu}</Link></div>
    <form method="get" className="panel grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="field">{c.search}<input className="input" name="q" defaultValue={queryText} placeholder={c.searchPlaceholder} maxLength={100} /></label>
      <label className="field">{c.category}<select className="input" name="category" defaultValue={categoryId}><option value="">{c.allCategories}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="field">{c.allStatuses}<select className="input" name="status" defaultValue={status}><option value="">{c.allStatuses}</option><option value="available">{c.available}</option><option value="unavailable">{c.unavailable}</option><option value="published">{c.published}</option><option value="draft">{c.draft}</option></select></label>
      <button className="button self-end" type="submit">{c.search}</button>
    </form>
    {!items.length ? <div className="panel empty"><Utensils className="mx-auto mb-4 text-slate-400" size={40} /><h2>{queryText || categoryId || status ? c.noResults : c.noItems}</h2><p className="muted">{categories.length ? c.menuPublishHelp : c.noCategories}</p></div> : <div className="grid-2">
      {items.map((item) => <article key={item.id} className="panel stack">
        <div className="flex items-start gap-4">
          {item.image_path ? <Image src={assetUrl(item.image_path)} alt={item.name_mn} width={88} height={88} unoptimized className="size-22 shrink-0 rounded-xl object-cover" /> : <div className="flex size-22 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Utensils size={24} /></div>}
          <div className="min-w-0 flex-1"><p className="muted text-xs">{categories.find((category) => category.id === item.category_id)?.name}</p><h2 className="text-lg font-semibold">{item.name_mn}</h2><p className="mt-1 font-semibold text-blue-600 dark:text-blue-400">{new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(item.price_mnt)} ₮</p></div>
          <span className="badge">{item.is_published ? c.published : c.draft}</span>
        </div>
        {item.description && <p className="muted line-clamp-2 text-sm">{item.description}</p>}
        <ActionForm action={updateMenuItemStatus} submitLabel={c.save}>
          <input type="hidden" name="organization_id" value={organization.id} /><input type="hidden" name="id" value={item.id} />
          <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="is_available" defaultChecked={item.is_available} className="size-4" />{c.available}</label><label className="flex items-center gap-2"><input type="checkbox" name="is_published" defaultChecked={item.is_published} className="size-4" />{c.publish}</label></div>
        </ActionForm>
        <div className="actions"><Link className="button button-secondary" href={`/dashboard/menu/${item.id}`}>{c.edit}</Link><DeleteForm action={deleteMenuItem} organizationId={organization.id} id={item.id} /></div>
      </article>)}
    </div>}
    <Pagination page={page} count={itemResult.count ?? 0} path="/dashboard/menu" params={{ q: queryText, category: categoryId, status }} />
  </div>;
}
