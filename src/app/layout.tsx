import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
export const metadata: Metadata = { title: { default: 'NFC Smart — Бизнесээ нэг товшилтоор холбо', template: '%s | NFC Smart' }, description: 'Дижитал меню, нэрийн хуудас болон NFC картаа нэг дор удирдах Монгол платформ.' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="mn" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;}
