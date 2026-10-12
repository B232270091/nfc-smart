import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabase, publicEnv } from '@/lib/env';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabase()) return response;
  const env = publicEnv();
  const supabase = createServerClient(env.url, env.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: values => {
      values.forEach(({name,value}) => request.cookies.set(name,value));
      response = NextResponse.next({request});
      values.forEach(({name,value,options}) => response.cookies.set(name,value,options));
    },
  } });
  await supabase.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register', '/reset-password', '/auth/:path*'] };
