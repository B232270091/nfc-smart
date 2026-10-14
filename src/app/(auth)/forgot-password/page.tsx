import { messages } from '@/lib/messages/mn';
import Link from 'next/link';
import { ActionForm,Field } from '@/components/forms';
import { requestPasswordReset } from '@/lib/actions/auth';
import { mn } from '@/lib/copy';
export default function Forgot(){return <><h1>{mn.reset}</h1><p className="muted">{messages.appAuthForgotPasswordPage.p}</p><ActionForm action={requestPasswordReset} submitLabel={messages.appAuthForgotPasswordPage.submitLabel}><Field label={mn.email} name="email" type="email" required/></ActionForm><div className="auth-links"><Link href="/login">{mn.login}</Link></div></>;}
