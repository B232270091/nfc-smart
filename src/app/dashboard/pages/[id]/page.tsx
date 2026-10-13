import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { canManage, requireOrg } from "@/lib/auth";
import { PageForm, type EditablePage } from "@/components/content/page-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, organization, membership } = await requireOrg();
  const menuOnly = !canManage(membership, "pages");
  if (menuOnly && !canManage(membership, "menu")) throw new Error(c.permissionDenied);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { data: page, error } = await supabase.from("pages").select("*").eq("id", id).eq("organization_id", organization.id).maybeSingle();
  if (error) throw new Error(c.readError);
  if (!page) notFound();
  if (menuOnly && page.type !== "menu") notFound();
  return <div className="stack"><Link href="/dashboard/pages" className="muted text-sm">← {c.back}</Link><div className="page-header"><h1>{c.editPage}</h1>{page.is_published && <Link className="button button-secondary" href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">{c.viewPage}</Link>}</div><PageForm organizationId={organization.id} page={page as EditablePage} menuOnly={menuOnly} /></div>;
}
