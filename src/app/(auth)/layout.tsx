import Link from 'next/link';
import { Nfc } from 'lucide-react';
import { mn } from '@/lib/copy';
export default function AuthLayout({children}:{children:React.ReactNode}){return <div className="auth-shell"><aside className="auth-pitch"><Link href="/" className="brand"><span className="brand-icon"><Nfc size={23}/></span>NFC Smart</Link><div><span className="badge">БИЗНЕСИЙН ШИНЭ ХОЛБООС</span><h1>{mn.welcome}</h1><p>Нэг карт. Үргэлж шинэ мэдээлэл.</p></div><small>Монголын бизнесүүдэд зориулсан дижитал орон зай.</small></aside><main className="auth-main"><div className="auth-box">{children}</div></main></div>;}
