import Image from "next/image";
import { ActionForm, Field } from "@/components/forms";
import { updateOrganization } from "@/lib/actions/content";
import { contentCopy as c } from "@/lib/content-copy";
import { assetUrl } from "@/lib/storage";

type OrganizationFormData = {
  id: string; name: string; slug: string; description?: string | null;
  phone?: string | null; email?: string | null; address?: string | null;
  maps_url?: string | null; facebook_url?: string | null; instagram_url?: string | null;
  website_url?: string | null; primary_color?: string; secondary_color?: string;
  logo_path?: string | null; cover_path?: string | null; is_active: boolean;
};

export function OrganizationForm({ organization: org }: { organization: OrganizationFormData }) {
  return <ActionForm action={updateOrganization} submitLabel={c.save}>
    <input type="hidden" name="organization_id" value={org.id} />
    <section className="panel stack">
      <h2 className="text-lg font-semibold">{c.organizationProfile}</h2>
      <div className="grid-2">
        <Field label={c.name} name="name" defaultValue={org.name} required minLength={2} maxLength={120} />
        <Field label={c.slug} name="slug" defaultValue={org.slug} required minLength={3} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
      </div>
      <p className="muted text-sm">{c.slugHelp}</p>
      <label className="field">{c.description}<textarea className="input min-h-28" name="description" maxLength={4000} defaultValue={org.description ?? ""} /></label>
    </section>
    <section className="panel stack">
      <h2 className="text-lg font-semibold">{c.branding}</h2>
      <div className="grid-2">
        <div className="stack">
          {org.logo_path && <Image src={assetUrl(org.logo_path)} width={80} height={80} unoptimized alt={c.logo} className="size-20 rounded-2xl object-cover" />}
          <Field label={c.logo} name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
        <div className="stack">
          {org.cover_path && <Image src={assetUrl(org.cover_path)} width={320} height={120} unoptimized alt={c.cover} className="h-30 w-full rounded-xl object-cover" />}
          <Field label={c.cover} name="cover" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
      </div>
      <p className="muted text-sm">{c.imageHelp}</p>
      <div className="grid-2">
        <Field label={c.primaryColor} name="primary_color" type="color" defaultValue={org.primary_color ?? "#0f172a"} required />
        <Field label={c.secondaryColor} name="secondary_color" type="color" defaultValue={org.secondary_color ?? "#06b6d4"} required />
      </div>
    </section>
    <section className="panel stack">
      <h2 className="text-lg font-semibold">{c.contacts}</h2>
      <div className="grid-2">
        <Field label={c.phone} name="phone" type="tel" maxLength={40} defaultValue={org.phone ?? ""} />
        <Field label={c.email} name="email" type="email" maxLength={254} defaultValue={org.email ?? ""} />
        <Field label={c.address} name="address" maxLength={200} defaultValue={org.address ?? ""} />
        <Field label={c.maps} name="maps_url" type="url" maxLength={2048} defaultValue={org.maps_url ?? ""} />
        <Field label={c.facebook} name="facebook_url" type="url" maxLength={2048} defaultValue={org.facebook_url ?? ""} />
        <Field label={c.instagram} name="instagram_url" type="url" maxLength={2048} defaultValue={org.instagram_url ?? ""} />
        <Field label={c.website} name="website_url" type="url" maxLength={2048} defaultValue={org.website_url ?? ""} />
      </div>
    </section>
    <section className="panel stack">
      <label className="flex items-center gap-3 font-medium"><input type="checkbox" name="is_active" defaultChecked={org.is_active} className="size-4" />{c.activeOrganization}</label>
      <p className="muted text-sm">{c.inactiveHelp}</p>
    </section>
  </ActionForm>;
}
