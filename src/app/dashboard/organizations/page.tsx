import Link from 'next/link';
import Image from 'next/image';
import { Building2, Plus, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { cookies } from 'next/headers';
import { listWorkspaces } from '@/lib/organizations';
import { createOrganization, selectOrganization } from '@/lib/actions/organizations';
import { ActionForm, Field } from '@/components/forms';
import { assetUrl } from '@/lib/storage';
import { mn } from '@/lib/copy';
import { organizationCopy as c } from '@/lib/organization-copy';

export default async function Organizations() {
  const memberships = await listWorkspaces();
  const selected = (await cookies()).get('active_org')?.value;
  return <>
    <div className="page-header"><div><span className="organization-eyebrow">NFC SMART / {c.workspace}</span><h1>{mn.organizations}</h1><p className="muted">{c.subtitle}</p></div><a className="button" href="#new-organization"><Plus size={17} />{mn.createOrg}</a></div>
    <div className="organization-grid">
      <section className="stack">
        <div className="organization-list-heading"><h2>{c.list}</h2><span className="badge">{memberships.length}</span></div>
        {memberships.length ? memberships.map(m => {
          const org = m.organizations;
          return <article key={org.id} className="panel organization-card">
            <div className="organization-card-heading">
              <div className="organization-avatar">{org.logo_path ? <Image src={assetUrl(org.logo_path)} alt={org.name} width={52} height={52} unoptimized /> : <Building2 size={25} />}</div>
              <div className="organization-identity"><h2>{org.name}</h2><span className="muted">/{org.slug}</span></div>
              <span className={org.is_active ? 'badge' : 'badge badge-muted'}>{org.is_active ? c.active : c.inactive}</span>
            </div>
            <p className="muted organization-description">{org.description || c.contactMissing}</p>
            {(org.email || org.phone) && <p className="muted organization-contact">{[org.phone, org.email].filter(Boolean).join(' · ')}</p>}
            <div className="organization-card-footer">
              <span className="organization-role"><ShieldCheck size={15} />{m.role === 'owner' ? c.owner : c.staff}</span>
              {selected === org.id && <span className="badge">{c.current}</span>}
              <div className="actions">
                <ActionForm action={selectOrganization} className="organization-open" submitLabel={c.open}><input type="hidden" name="organization_id" value={org.id} /></ActionForm>
                {m.role === 'owner' && <Link className="button button-secondary" href={`/dashboard/organizations/${org.id}`}>{mn.settings}<ArrowUpRight size={15} /></Link>}
              </div>
            </div>
          </article>;
        }) : <div className="panel empty organization-empty"><Building2 size={40} /><h2>{mn.noOrg}</h2><p>{mn.noOrgBody}</p></div>}
      </section>
      <section className="panel organization-create" id="new-organization">
        <span className="organization-create-icon"><Plus size={23} /></span><h2>{c.creationTitle}</h2><p className="muted">{c.createHint}</p>
        <ActionForm action={createOrganization} submitLabel={mn.createOrg}>
          <Field label={mn.orgName} name="name" required minLength={2} maxLength={120} autoComplete="organization" />
          <Field label={mn.slug} name="slug" placeholder="my-restaurant" required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={80} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </ActionForm>
      </section>
    </div>
  </>;
}
