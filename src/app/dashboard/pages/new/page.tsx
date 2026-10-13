import Link from "next/link";
import { canManage, requireOrg } from "@/lib/auth";
import { PageForm } from "@/components/content/page-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function NewPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { organization, membership } = await requireOrg();
  const menuOnly = !canManage(membership, "pages");
  if (menuOnly && !canManage(membership, "menu")) throw new Error(c.permissionDenied);
  const { type } = await searchParams;
  const initialType = menuOnly ? "menu" : type && Object.hasOwn(c.pageTypes, type) ? type as keyof typeof c.pageTypes : "company";
  return <div className="stack"><Link href="/dashboard/pages" className="muted text-sm">← {c.back}</Link><div className="page-header"><h1>{c.newPage}</h1></div><PageForm organizationId={organization.id} initialType={initialType} menuOnly={menuOnly} /></div>;
}
