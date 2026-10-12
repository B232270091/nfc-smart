import Link from 'next/link';
import { ActionForm,Field } from '@/components/forms';
import { login } from '@/lib/actions/auth';
import { mn } from '@/lib/copy';
export default function Login(){return <><h1>Эргэн тавтай морил</h1><p className="muted">Бизнесийнхээ дижитал орон зайд нэвтэрнэ үү.</p><ActionForm action={login} submitLabel={mn.login}><Field label={mn.email} name="email" type="email" autoComplete="email" required/><Field label={mn.password} name="password" type="password" autoComplete="current-password" minLength={8} required/></ActionForm><div className="auth-links"><Link href="/forgot-password">{mn.reset}</Link><Link href="/register">{mn.register}</Link></div></>;}
