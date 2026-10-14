import { messages } from '@/lib/messages/mn';
import Link from 'next/link';
import { ActionForm,Field } from '@/components/forms';
import { register } from '@/lib/actions/auth';
import { mn } from '@/lib/copy';
export default function Register(){return <><h1>{messages.appAuthRegisterPage.h1}</h1><p className="muted">{messages.appAuthRegisterPage.p}</p><ActionForm action={register} submitLabel={mn.register}><Field label={mn.email} name="email" type="email" autoComplete="email" required/><Field label={mn.password} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/><p className="muted">{messages.appAuthRegisterPage.p2}</p></ActionForm><div className="auth-links"><Link href="/login">{messages.appAuthRegisterPage.Link}</Link><Link href="/">{mn.home}</Link></div></>;}
