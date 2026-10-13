'use client';
import Link from 'next/link';
import { organizationCopy as c } from '@/lib/organization-copy';
export default function OrganizationError({ reset }: { error: Error; reset: () => void }) { return <div className="panel empty" role="alert"><h1>{c.errorTitle}</h1><p>{c.readError}</p><div className="actions" style={{justifyContent:'center'}}><button className="button" onClick={reset}>{c.retry}</button><Link className="button button-secondary" href="/dashboard/organizations">{c.back}</Link></div></div>; }
