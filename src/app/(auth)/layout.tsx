import { messages } from '@/lib/messages/mn';
import Link from 'next/link';
import { Nfc } from 'lucide-react';
import { mn } from '@/lib/copy';
export default function AuthLayout({children}:{children:React.ReactNode}){return <div className="auth-shell"><aside className="auth-pitch"><Link href="/" className="brand"><span className="brand-icon"><Nfc size={23}/></span>NFC Smart</Link><div><span className="badge">{messages.appAuthLayout.span}</span><h2>{mn.welcome}</h2><p>{messages.appAuthLayout.p}</p></div><small>{messages.appAuthLayout.small}</small></aside><main className="auth-main"><div className="auth-box">{children}</div></main></div>;}
