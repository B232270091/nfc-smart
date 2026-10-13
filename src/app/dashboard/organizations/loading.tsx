import { organizationCopy as c } from '@/lib/organization-copy';
export default function Loading() { return <div className="stack" role="status" aria-label={c.loading}><span className="sr-only">{c.loading}</span><div className="skeleton" /><div className="grid-2"><div className="skeleton" /><div className="skeleton" /></div></div>; }
