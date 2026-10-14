import { messages } from '@/lib/messages/mn';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
export const metadata: Metadata = { title: { default: messages.appLayout.default, template: '%s | NFC Smart' }, description: messages.appLayout.description };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="mn" data-scroll-behavior="smooth" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;}
