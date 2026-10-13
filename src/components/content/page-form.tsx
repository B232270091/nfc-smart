import Image from "next/image";
import { ActionForm, Field } from "@/components/forms";
import { savePage } from "@/lib/actions/content";
import { assetUrl } from "@/lib/storage";
import { contentCopy as c } from "@/lib/content-copy";

export type EditablePage = {
  id: string; title: string; slug: string; type: keyof typeof c.pageTypes;
  description: string | null; is_published: boolean;
  content: { person_name?: string; position?: string; phone?: string; email?: string; services?: string; photo_path?: string | null; links?: { label: string; url: string }[] };
};

export function PageForm({ organizationId, page, initialType = "company", menuOnly = false }: { organizationId: string; page?: EditablePage; initialType?: keyof typeof c.pageTypes; menuOnly?: boolean }) {
  const profile = page?.content ?? {};
  const links = Array.isArray(profile.links) ? profile.links.filter((link) => link && typeof link.label === "string" && typeof link.url === "string") : [];
  return <ActionForm action={savePage} submitLabel={page ? c.save : c.create}>
    <input type="hidden" name="organization_id" value={organizationId} />
    {page && <input type="hidden" name="id" value={page.id} />}
    <section className="panel stack">
      <div className="grid-2">
        <Field label={c.title} name="title" defaultValue={page?.title ?? ""} required minLength={2} maxLength={160} />
        <Field label={c.slug} name="slug" defaultValue={page?.slug ?? ""} required minLength={3} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
      </div>
      <p className="muted text-sm">{c.slugHelp}</p>
      <label className="field">{c.pageType}<select className="input" name="type" defaultValue={page?.type ?? initialType}>
        {Object.entries(c.pageTypes).filter(([value]) => !menuOnly || value === "menu").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="field">{c.description}<textarea className="input min-h-28" name="description" maxLength={4000} defaultValue={page?.description ?? ""} /></label>
      <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="is_published" defaultChecked={page?.is_published ?? false} className="size-4" />{c.publish}</label>
      <p className="muted text-sm">{c.publishHelp}</p>
    </section>
    {!menuOnly && <section className="panel stack">
      <h2 className="text-lg font-semibold">{c.profileContent}</h2>
      <p className="muted text-sm">{c.profileHelp}</p>
      <div className="grid-2">
        <Field label={c.personName} name="person_name" defaultValue={profile.person_name ?? ""} maxLength={200} />
        <Field label={c.position} name="position" defaultValue={profile.position ?? ""} maxLength={200} />
        <Field label={c.phone} name="phone" type="tel" defaultValue={profile.phone ?? ""} maxLength={40} />
        <Field label={c.email} name="email" type="email" defaultValue={profile.email ?? ""} maxLength={254} />
      </div>
      {profile.photo_path && <Image src={assetUrl(profile.photo_path)} alt={c.photo} width={80} height={80} unoptimized className="size-20 rounded-full object-cover" />}
      <Field label={c.photo} name="photo" type="file" accept="image/png,image/jpeg,image/webp" />
      <p className="muted text-sm">{c.imageHelp}</p>
      <label className="field">{c.services}<textarea className="input min-h-28" name="services" maxLength={5000} defaultValue={profile.services ?? ""} /></label>
      <label className="field">{c.links}<textarea className="input min-h-32" name="links" maxLength={43000} defaultValue={links.map((link) => `${link.label} | ${link.url}`).join("\n")} /></label>
      <p className="muted text-sm">{c.linksHelp}</p>
    </section>}
  </ActionForm>;
}
