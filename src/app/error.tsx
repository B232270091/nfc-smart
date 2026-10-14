'use client';
import { messages } from '@/lib/messages/mn';
import { mn } from '@/lib/copy';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}) {return <main className="workspace"><div className="panel empty"><h1>{mn.error}</h1><p>{messages.appError.p}</p><button className="button" onClick={reset}>{mn.retry}</button></div></main>;}
