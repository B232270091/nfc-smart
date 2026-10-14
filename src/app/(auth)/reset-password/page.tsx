import { messages } from '@/lib/messages/mn';
import { ActionForm,Field } from '@/components/forms';
import { updatePassword } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
export default async function Reset(){await requireUser();return <><h1>{messages.appAuthResetPasswordPage.h1}</h1><ActionForm action={updatePassword}><Field label={messages.appAuthResetPasswordPage.label} name="password" type="password" minLength={8} autoComplete="new-password" required/></ActionForm></>;}
