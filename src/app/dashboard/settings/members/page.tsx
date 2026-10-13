import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { ActionForm, Field } from "@/components/forms";
import { DeleteForm } from "@/components/content/delete-form";
import { upsertMember, removeMember } from "@/lib/actions/content";
import { contentCopy as c } from "@/lib/content-copy";
import type { Membership, Permission } from "@/lib/types";

export default async function MembersPage() {
  const { supabase, organization, user } = await requireOrg(undefined, "owner");
  const { data, error } = await supabase.from("organization_members").select("organization_id,user_id,role,permissions").eq("organization_id", organization.id).order("created_at");
  if (error) throw new Error(c.readError);
  const members = (data ?? []) as Membership[];
  return <div className="stack">
    <Link href="/dashboard/settings" className="muted text-sm">← {c.back}</Link>
    <div className="page-header"><div><h1>{c.members}</h1><p className="muted">{c.membersDescription}</p></div></div>
    <section className="panel stack">
      <h2 className="text-lg font-semibold">{c.upsertMember}</h2>
      <p className="muted text-sm">{c.memberHelp}</p>
      <ActionForm action={upsertMember} submitLabel={c.upsertMember}>
        <input type="hidden" name="organization_id" value={organization.id} />
        <div className="grid-2"><Field label={c.memberEmail} name="email" type="email" required maxLength={254} /><label className="field">{c.memberRole}<select name="role" className="input" defaultValue="staff"><option value="staff">{c.staff}</option><option value="owner">{c.owner}</option></select></label></div>
        <fieldset className="stack"><legend className="mb-2 font-medium">{c.permissions}</legend><div className="flex flex-wrap gap-5">{Object.entries(c.permissionNames).map(([value, label]) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" name="permissions" value={value} className="size-4" />{label}</label>)}</div></fieldset>
      </ActionForm>
    </section>
    <div className="grid-2">{members.map((member) => <section key={member.user_id} className="panel stack">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="badge">{member.role === "owner" ? c.owner : c.staff}</span>{member.user_id === user.id && <span className="badge">{c.you}</span>}</div>
      <div><p className="muted text-xs">{c.memberId}</p><p className="break-all font-mono text-sm">{member.user_id}</p>{member.user_id === user.id && <p className="muted text-sm">{user.email}</p>}</div>
      <p className="muted text-sm">{member.role === "owner" ? Object.values(c.permissionNames).join(" · ") : member.permissions.map((permission: Permission) => c.permissionNames[permission]).join(" · ") || "—"}</p>
      <DeleteForm action={removeMember} organizationId={organization.id} id={member.user_id} confirmation={c.removeMemberConfirm} />
    </section>)}</div>
  </div>;
}
