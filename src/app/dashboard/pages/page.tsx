import Link from "next/link";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { canManage, requireOrg } from "@/lib/auth";
import { deletePage } from "@/lib/actions/content";
import { DeleteForm } from "@/components/content/delete-form";
import { contentCopy as c } from "@/lib/content-copy";

export default async function PagesPage() {
  const { supabase, organization, membership } = await requireOrg();
  const menuOnly = !canManage(membership, "pages");
  if (menuOnly && !canManage(membership, "menu")) throw new Error(c.permissionDenied);
  let query = supabase.from("pages").select("id,title,slug,type,is_published,description").eq("organization_id", organization.id).order("created_at", { ascending: false });
  if (menuOnly) query = query.eq("type", "menu");
  const { data: pages, error } = await query;
  if (error) throw new Error(c.readError);
  return <div className="stack">
    <div className="page-header"><div><h1>{c.pages}</h1><p className="muted">{c.pagesDescription}</p></div><Link className="button" href="/dashboard/pages/new"><Plus size={18} />{c.newPage}</Link></div>
    {!pages?.length ? <div className="panel empty"><FileText className="mx-auto mb-4 text-slate-400" size={40} /><h2>{c.noPages}</h2><p className="muted">{c.noPagesHelp}</p><Link href="/dashboard/pages/new" className="button mt-5">{c.newPage}</Link></div> : <div className="grid-2">
      {pages.map((page) => <article key={page.id} className="panel stack">
        <div className="flex items-center justify-between gap-3"><span className="badge">{c.pageTypes[page.type as keyof typeof c.pageTypes]}</span><span className={`badge ${page.is_published ? "text-emerald-600" : "text-amber-600"}`}>{page.is_published ? c.published : c.draft}</span></div>
        <div><h2 className="text-xl font-semibold">{page.title}</h2><p className="muted text-sm break-all">/p/{page.slug}</p></div>
        {page.description && <p className="muted line-clamp-2">{page.description}</p>}
        <div className="actions flex-wrap"><Link href={`/dashboard/pages/${page.id}`} className="button button-secondary">{c.edit}</Link>{page.is_published && <Link href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="button button-secondary"><ExternalLink size={15} />{c.viewPage}</Link>}<DeleteForm action={deletePage} organizationId={organization.id} id={page.id} confirmation={c.deletePageConfirm} /></div>
      </article>)}
    </div>}
  </div>;
}
