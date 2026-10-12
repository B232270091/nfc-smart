import { z } from 'zod';
const publicSchema = z.object({ url: z.url(), key: z.string().min(10), appUrl: z.url() });
export function hasSupabase() { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export function publicEnv() {
  return publicSchema.parse({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' });
}
export function appUrl() { return new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').origin; }
