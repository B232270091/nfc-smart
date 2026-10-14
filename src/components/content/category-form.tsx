import { ActionForm, Field } from "@/components/forms";
import { saveCategory } from "@/lib/actions/content";
import { contentCopy as c } from "@/lib/content-copy";

export type MenuCategory = { id: string; name: string; sort_order: number; is_active: boolean };

export function CategoryForm({ organizationId, category }: { organizationId: string; category?: MenuCategory }) {
  return <ActionForm action={saveCategory} submitLabel={category ? c.save : c.newCategory}>
    <input type="hidden" name="organization_id" value={organizationId} />
    {category && <input type="hidden" name="id" value={category.id} />}
    <Field label={c.name} name="name" defaultValue={category?.name ?? ""} required maxLength={100} />
    <Field label={c.sortOrder} name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} min={0} max={1000000} step={1} required />
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="size-4" />{c.active}</label>
  </ActionForm>;
}
