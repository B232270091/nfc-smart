import { messages } from '@/lib/messages/mn';
import Link from 'next/link';
export default function NotFound(){return <main className="workspace"><div className="panel empty"><span className="badge">404</span><h1>{messages.appNotFound.h1}</h1><p>{messages.appNotFound.p}</p><Link className="button" href="/">{messages.appNotFound.Link}</Link></div></main>;}
