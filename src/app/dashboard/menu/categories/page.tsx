import Link from "next/link";
import { FormDialog } from "@/components/form-dialog";
import { requireOrg } from "@/lib/auth";
import { deleteCategory } from "@/lib/actions/content";
import { CategoryForm, type MenuCategory } from "@/components/content/category-form";
import { DeleteForm } from "@/components/content/delete-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function CategoriesPage() {
  const { supabase, organization } = await requireOrg(undefined, "menu");
  const { data, error } = await supabase.from("menu_categories").select("id,name,sort_order,is_active").eq("organization_id", organization.id).order("sort_order").order("created_at");
  if (error) throw new Error(c.readError);
  const categories = (data ?? []) as MenuCategory[];
  return <div className="stack">
    <Link href="/dashboard/menu" className="muted text-sm">← {c.back}</Link>
    <div className="page-header"><div><h1>{c.manageCategories}</h1><p className="muted">{c.sortHelp}</p></div></div>
    <div><FormDialog title={c.newCategory}><CategoryForm organizationId={organization.id} /></FormDialog></div>
    {!categories.length && <p className="muted">{c.noCategories}</p>}
    <div className="grid-2">{categories.map((category) => <section key={category.id} className="panel stack">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{category.name}</h2><span className="badge">{category.is_active ? c.active : c.inactive}</span></div>
      <CategoryForm organizationId={organization.id} category={category} />
      <DeleteForm action={deleteCategory} organizationId={organization.id} id={category.id} confirmation={c.deleteCategoryConfirm} />
    </section>)}</div>
  </div>;
}
