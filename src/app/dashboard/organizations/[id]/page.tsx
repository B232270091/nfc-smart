import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { OrganizationForm } from "@/components/content/organization-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { organization } = await requireOrg(id, "owner");
  return <div className="stack">
    <Link href="/dashboard/organizations" className="muted text-sm">← {c.back}</Link>
    <div className="page-header"><div><h1>{organization.name}</h1><p className="muted">{c.settingsDescription}</p></div></div>
    <OrganizationForm organization={organization} />
  </div>;
}
