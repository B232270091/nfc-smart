import { messages } from '@/lib/messages/mn';
import Link from 'next/link';
import { ActionForm,Field } from '@/components/forms';
import { login } from '@/lib/actions/auth';
import { mn } from '@/lib/copy';
export default function Login(){return <><h1>{messages.appAuthLoginPage.h1}</h1><p className="muted">{messages.appAuthLoginPage.p}</p><ActionForm action={login} submitLabel={mn.login}><Field label={mn.email} name="email" type="email" autoComplete="email" required/><Field label={mn.password} name="password" type="password" autoComplete="current-password" minLength={8} required/></ActionForm><div className="auth-links"><Link href="/forgot-password">{mn.reset}</Link><Link href="/register">{mn.register}</Link></div></>;}
