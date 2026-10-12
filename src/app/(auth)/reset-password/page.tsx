import { ActionForm,Field } from '@/components/forms';
import { updatePassword } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
export default async function Reset(){await requireUser();return <><h1>Шинэ нууц үг</h1><ActionForm action={updatePassword}><Field label="Шинэ нууц үг" name="password" type="password" minLength={8} autoComplete="new-password" required/></ActionForm></>;}
