import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appUrl } from '@/lib/env';
import { safeRedirect } from '@/lib/utils';
export async function GET(request:NextRequest){const code=request.nextUrl.searchParams.get('code');const next=safeRedirect(request.nextUrl.searchParams.get('next'));if(code){const client=await createClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,appUrl()),{headers:{'Cache-Control':'private, no-store'}});}return NextResponse.redirect(new URL('/login?error=callback',appUrl()));}
