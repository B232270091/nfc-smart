"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManage, requireOrg } from "@/lib/auth";
import type { Membership } from "@/lib/types";
import { uploadAsset } from "@/lib/storage";
import { withAction, type ActionState } from "@/lib/actions/shared";
import { contentCopy as c } from "@/lib/content-copy";

const uuid = z.string().uuid(c.invalidInput);
const shortText = z.string().trim().max(200, c.invalidInput);
const optionalText = z.string().trim().max(5000, c.invalidInput);
const slug = z.string().trim().min(3, c.invalidSlug).max(80, c.invalidSlug).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, c.invalidSlug);
const webUrl = z.string().trim().max(2048, c.invalidUrl).refine((value) => {
  if (!value) return true;
  try { return value.startsWith("https://") && new URL(value).protocol === "https:"; } catch { return false; }
}, c.invalidUrl);
const email = z.union([z.literal(""), z.string().email(c.invalidInput).max(254)]);
const read = (data: FormData, key: string) => String(data.get(key) ?? "");
const checked = (data: FormData, key: string) => data.get(key) === "on";
const file = (data: FormData, key: string) => { const value = data.get(key); return value instanceof File && value.size > 0 ? value : null; };

function changed() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/p/[slug]", "page");
}

function writeFailure(error: { code?: string } | null) {
  if (error) throw new Error(error.code === "23505" ? c.uniqueError : c.writeError);
}

function authorizePage(membership: Membership, type: string) {
  if (!canManage(membership, "pages") && !(type === "menu" && canManage(membership, "menu"))) throw new Error(c.permissionDenied);
}

function parseLinks(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 20) throw new Error(c.invalidLinks);
  return lines.map((line) => {
    const separator = line.indexOf("|");
    if (separator < 1) throw new Error(c.invalidLinks);
    const label = line.slice(0, separator).trim();
    const url = line.slice(separator + 1).trim();
    if (!label || label.length > 100 || !url || !webUrl.safeParse(url).success) throw new Error(c.invalidLinks);
    return { label, url };
  });
}

export async function updateOrganization(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const { supabase } = await requireOrg(organizationId, "owner");
    const values = z.object({
      name: shortText.min(2, c.invalidInput).max(120, c.invalidInput), slug, description: optionalText.max(4000, c.invalidInput),
      phone: shortText.max(40), email, address: shortText.max(200),
      maps_url: webUrl, facebook_url: webUrl, instagram_url: webUrl, website_url: webUrl,
      primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, c.invalidInput),
      secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, c.invalidInput),
    }).parse(Object.fromEntries(["name", "slug", "description", "phone", "email", "address", "maps_url", "facebook_url", "instagram_url", "website_url", "primary_color", "secondary_color"].map((key) => [key, read(form, key)])));
    const logo = file(form, "logo");
    const cover = file(form, "cover");
    const images: { logo_path?: string; cover_path?: string } = {};
    if (logo) images.logo_path = await uploadAsset(supabase, organizationId, logo, "branding");
    if (cover) images.cover_path = await uploadAsset(supabase, organizationId, cover, "branding");
    const { data, error } = await supabase.from("organizations").update({ ...values, ...images, is_active: checked(form, "is_active") }).eq("id", organizationId).select("id").single();
    writeFailure(error);
    if (!data) throw new Error(c.missingRecord);
    changed();
    return { success: c.saved };
  });
}

export async function savePage(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = read(form, "id") ? uuid.parse(read(form, "id")) : null;
    const { supabase, membership } = await requireOrg(organizationId);
    const values = z.object({ title: shortText.min(2, c.invalidInput).max(160, c.invalidInput), slug, type: z.enum(["menu", "company", "business_card", "links"]), description: optionalText.max(4000, c.invalidInput) }).parse({ title: read(form, "title"), slug: read(form, "slug"), type: read(form, "type"), description: read(form, "description") });
    authorizePage(membership, values.type);
    const profile = z.object({ person_name: shortText, position: shortText, phone: shortText.max(40), email, services: optionalText }).parse({ person_name: read(form, "person_name"), position: read(form, "position"), phone: read(form, "phone"), email: read(form, "email"), services: read(form, "services") });
    let photoPath: string | null = null;
    if (id) {
      const { data, error } = await supabase.from("pages").select("id,type,content").eq("id", id).eq("organization_id", organizationId).single();
      if (error || !data) throw new Error(c.missingRecord);
      authorizePage(membership, data.type);
      photoPath = typeof data.content?.photo_path === "string" ? data.content.photo_path : null;
    }
    const links = parseLinks(read(form, "links"));
    if (Buffer.byteLength(JSON.stringify({ ...profile, links }), "utf8") > 49000) throw new Error(c.contentTooLong);
    const photo = file(form, "photo");
    if (photo) photoPath = await uploadAsset(supabase, organizationId, photo, "pages");
    const payload = { ...values, is_published: checked(form, "is_published"), content: { ...profile, photo_path: photoPath, links } };
    if (Buffer.byteLength(JSON.stringify(payload.content), "utf8") > 50000) throw new Error(c.contentTooLong);
    const result = id
      ? await supabase.from("pages").update(payload).eq("id", id).eq("organization_id", organizationId).select("id").single()
      : await supabase.from("pages").insert({ ...payload, organization_id: organizationId }).select("id").single();
    writeFailure(result.error);
    if (!result.data) throw new Error(c.missingRecord);
    changed();
    if (!id) redirect("/dashboard/pages");
    return { success: c.saved };
  });
}

export async function saveCategory(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = read(form, "id") ? uuid.parse(read(form, "id")) : null;
    const { supabase } = await requireOrg(organizationId, "menu");
    const values = z.object({ name: shortText.min(1, c.invalidInput).max(100, c.invalidInput), sort_order: z.coerce.number().int().min(0).max(1000000) }).parse({ name: read(form, "name"), sort_order: read(form, "sort_order") || "0" });
    const payload = { ...values, is_active: checked(form, "is_active") };
    const result = id
      ? await supabase.from("menu_categories").update(payload).eq("id", id).eq("organization_id", organizationId).select("id").single()
      : await supabase.from("menu_categories").insert({ ...payload, organization_id: organizationId }).select("id").single();
    writeFailure(result.error);
    if (!result.data) throw new Error(c.missingRecord);
    changed();
    return { success: c.saved };
  });
}

export async function deleteCategory(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = uuid.parse(read(form, "id"));
    const { supabase } = await requireOrg(organizationId, "menu");
    const { data, error } = await supabase.from("menu_categories").delete().eq("id", id).eq("organization_id", organizationId).select("id").single();
    if (error?.code === "23503") throw new Error(c.categoryInUse);
    writeFailure(error);
    if (!data) throw new Error(c.missingRecord);
    changed();
    return { success: c.deleted };
  });
}

export async function saveMenuItem(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = read(form, "id") ? uuid.parse(read(form, "id")) : null;
    const { supabase } = await requireOrg(organizationId, "menu");
    const values = z.object({
      category_id: uuid, name_mn: shortText.min(1, c.invalidInput).max(160, c.invalidInput), name_en: shortText.max(160, c.invalidInput),
      description: optionalText.max(2000, c.invalidInput),
      price_mnt: z.string().regex(/^\d{1,13}$/, c.invalidPrice).transform(Number).refine((value) => Number.isSafeInteger(value) && value <= 1000000000000, c.invalidPrice),
      sort_order: z.coerce.number().int().min(0).max(1000000),
    }).parse({ category_id: read(form, "category_id"), name_mn: read(form, "name_mn"), name_en: read(form, "name_en"), description: read(form, "description"), price_mnt: read(form, "price_mnt"), sort_order: read(form, "sort_order") || "0" });
    const { data: category, error: categoryError } = await supabase.from("menu_categories").select("id").eq("id", values.category_id).eq("organization_id", organizationId).single();
    if (categoryError || !category) throw new Error(c.missingRecord);
    if (id) {
      const { data: item, error } = await supabase.from("menu_items").select("id").eq("id", id).eq("organization_id", organizationId).single();
      if (error || !item) throw new Error(c.missingRecord);
    }
    const image = file(form, "item_image");
    const imageValues = image ? { image_path: await uploadAsset(supabase, organizationId, image, "menu") } : {};
    const payload = { ...values, ...imageValues, is_available: checked(form, "is_available"), is_published: checked(form, "is_published") };
    const result = id
      ? await supabase.from("menu_items").update(payload).eq("id", id).eq("organization_id", organizationId).select("id").single()
      : await supabase.from("menu_items").insert({ ...payload, organization_id: organizationId }).select("id").single();
    writeFailure(result.error);
    if (!result.data) throw new Error(c.missingRecord);
    changed();
    if (!id) redirect("/dashboard/menu");
    return { success: c.saved };
  });
}

export async function updateMenuItemStatus(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = uuid.parse(read(form, "id"));
    const { supabase } = await requireOrg(organizationId, "menu");
    const { data, error } = await supabase.from("menu_items").update({ is_available: checked(form, "is_available"), is_published: checked(form, "is_published") }).eq("id", id).eq("organization_id", organizationId).select("id").single();
    writeFailure(error);
    if (!data) throw new Error(c.missingRecord);
    changed();
    return { success: c.saved };
  });
}

export async function deleteMenuItem(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = uuid.parse(read(form, "id"));
    const { supabase } = await requireOrg(organizationId, "menu");
    const { data, error } = await supabase.from("menu_items").delete().eq("id", id).eq("organization_id", organizationId).select("id").single();
    writeFailure(error);
    if (!data) throw new Error(c.missingRecord);
    changed();
    return { success: c.deleted };
  });
}

export async function deletePage(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const id = uuid.parse(read(form, "id"));
    const { supabase, membership } = await requireOrg(organizationId);
    const existing = await supabase.from("pages").select("type").eq("id", id).eq("organization_id", organizationId).single();
    if (existing.error || !existing.data) throw new Error(c.missingRecord);
    authorizePage(membership, existing.data.type);
    const { data, error } = await supabase.from("pages").delete().eq("id", id).eq("organization_id", organizationId).select("id").single();
    if (error?.code === "23503") throw new Error(c.pageInUse);
    writeFailure(error);
    if (!data) throw new Error(c.missingRecord);
    changed();
    return { success: c.deleted };
  });
}

export async function upsertMember(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const { supabase } = await requireOrg(organizationId, "owner");
    const values = z.object({ email: z.string().trim().email(c.invalidInput).max(254), role: z.enum(["owner", "staff"]), permissions: z.array(z.enum(["menu", "pages", "cards", "analytics"])).max(4) }).parse({ email: read(form, "email"), role: read(form, "role"), permissions: form.getAll("permissions") });
    const { error } = await supabase.rpc("upsert_organization_member", { p_organization_id: organizationId, p_email: values.email, p_role: values.role, p_permissions: values.role === "owner" ? [] : values.permissions });
    if (error?.code === "22023") throw new Error(c.registeredFirst);
    if (error?.code === "23514") throw new Error(c.lastOwner);
    writeFailure(error);
    changed();
    return { success: c.saved };
  });
}

export async function removeMember(_state: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const organizationId = uuid.parse(read(form, "organization_id"));
    const userId = uuid.parse(read(form, "id"));
    const { supabase } = await requireOrg(organizationId, "owner");
    const { error } = await supabase.rpc("remove_organization_member", { p_organization_id: organizationId, p_user_id: userId });
    if (error?.code === "23514") throw new Error(c.lastOwner);
    writeFailure(error);
    changed();
    return { success: c.deleted };
  });
}
