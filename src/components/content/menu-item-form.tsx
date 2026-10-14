import Image from "next/image";
import { ActionForm, Field } from "@/components/forms";
import { saveMenuItem } from "@/lib/actions/content";
import { assetUrl } from "@/lib/storage";
import { contentCopy as c } from "@/lib/content-copy";
import type { MenuCategory } from "@/components/content/category-form";

export type EditableMenuItem = { id: string; category_id: string; name_mn: string; name_en: string | null; description: string | null; price_mnt: number; image_path: string | null; sort_order: number; is_available: boolean; is_published: boolean };

export function MenuItemForm({ organizationId, categories, item }: { organizationId: string; categories: MenuCategory[]; item?: EditableMenuItem }) {
  return <ActionForm action={saveMenuItem} submitLabel={item ? c.save : c.newItem}>
    <input type="hidden" name="organization_id" value={organizationId} />
    {item && <input type="hidden" name="id" value={item.id} />}
    <section className="panel stack">
      <div className="grid-2">
        <Field label={c.itemName} name="name_mn" defaultValue={item?.name_mn ?? ""} required maxLength={160} />
        <Field label={c.englishName} name="name_en" defaultValue={item?.name_en ?? ""} maxLength={160} />
        <label className="field">{c.category}<select name="category_id" className="input" defaultValue={item?.category_id ?? categories[0]?.id} required>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}{!category.is_active ? ` (${c.inactive})` : ""}</option>)}
        </select></label>
        <Field label={c.price} name="price_mnt" type="number" defaultValue={item?.price_mnt ?? ""} min={0} max={1000000000000} step={1} required />
      </div>
      <label className="field">{c.description}<textarea className="input min-h-28" name="description" defaultValue={item?.description ?? ""} maxLength={2000} /></label>
      {item?.image_path && <Image src={assetUrl(item.image_path)} alt={item.name_mn} width={240} height={180} unoptimized className="h-44 w-60 rounded-xl object-cover" />}
      <Field label={c.image} name="item_image" type="file" accept="image/png,image/jpeg,image/webp" />
      <p className="muted text-sm">{c.imageHelp}</p>
      <Field label={c.sortOrder} name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} min={0} max={1000000} step={1} required />
      <p className="muted text-sm">{c.sortHelp}</p>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3"><input type="checkbox" name="is_available" defaultChecked={item?.is_available ?? true} className="size-4" />{c.available}</label>
        <label className="flex items-center gap-3"><input type="checkbox" name="is_published" defaultChecked={item?.is_published ?? false} className="size-4" />{c.publish}</label>
      </div>
    </section>
  </ActionForm>;
}
