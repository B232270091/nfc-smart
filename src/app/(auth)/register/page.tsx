import Link from 'next/link';
import { ActionForm,Field } from '@/components/forms';
import { register } from '@/lib/actions/auth';
import { mn } from '@/lib/copy';
export default function Register(){return <><h1>Таны бизнес эндээс эхэлнэ</h1><p className="muted">Бүртгэлээ үүсгээд эхний байгууллагаа нэмээрэй.</p><ActionForm action={register} submitLabel={mn.register}><Field label={mn.email} name="email" type="email" autoComplete="email" required/><Field label={mn.password} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/><p className="muted">Хамгийн багадаа 8 тэмдэгттэй нууц үг ашиглаарай.</p></ActionForm><div className="auth-links"><Link href="/login">Бүртгэлтэй юу? Нэвтрэх</Link><Link href="/">{mn.home}</Link></div></>;}
