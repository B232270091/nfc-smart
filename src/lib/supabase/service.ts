import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
export function serviceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(publicEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
