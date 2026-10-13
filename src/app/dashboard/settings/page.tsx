import { requireOrg } from "@/lib/auth";
import Link from "next/link";
import { OrganizationForm } from "@/components/content/organization-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function SettingsPage() {
  const { organization } = await requireOrg(undefined, "owner");
  return <div className="stack">
    <div className="page-header"><div><p className="muted text-sm">{organization.name}</p><h1>{c.settings}</h1><p className="muted">{c.settingsDescription}</p></div><Link className="button button-secondary" href="/dashboard/settings/members">{c.members}</Link></div>
    <OrganizationForm organization={organization} />
  </div>;
}
