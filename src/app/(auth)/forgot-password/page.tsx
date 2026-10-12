import Link from 'next/link';
import { ActionForm,Field } from '@/components/forms';
import { requestPasswordReset } from '@/lib/actions/auth';
import { mn } from '@/lib/copy';
export default function Forgot(){return <><h1>{mn.reset}</h1><p className="muted">Бүртгэлтэй и-мэйл хаягаа оруулна уу.</p><ActionForm action={requestPasswordReset} submitLabel="Сэргээх холбоос авах"><Field label={mn.email} name="email" type="email" required/></ActionForm><div className="auth-links"><Link href="/login">{mn.login}</Link></div></>;}
