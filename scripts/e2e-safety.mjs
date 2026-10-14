export const productionProjectRef = 'xcsnkvoulmrpxoxcjuvl';

// This must run before clients are constructed or the application server is started.
export function assertE2ETarget(env) {
  if (env.E2E_ENABLED !== '1') return;
  const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || 'invalid:');
  const projectRef = env.E2E_SUPABASE_PROJECT_REF;
  if (url.hostname === `${productionProjectRef}.supabase.co` || projectRef === productionProjectRef) {
    throw new Error('Production Supabase is read-only. E2E mutations are forbidden.');
  }
  const localDatabase = ['127.0.0.1', 'localhost'].includes(url.hostname) && projectRef === 'local';
  if (!localDatabase && (!projectRef || url.protocol !== 'https:' || url.hostname !== `${projectRef}.supabase.co`)) {
    throw new Error('Set E2E_SUPABASE_PROJECT_REF to the separately approved test project matching NEXT_PUBLIC_SUPABASE_URL.');
  }
  if (env.E2E_BASE_URL) throw new Error('Integration tests must start their own isolated app server; E2E_BASE_URL is not permitted.');
  const app = new URL(env.E2E_BASE_URL || 'http://127.0.0.1:3100');
  if (!['127.0.0.1', 'localhost'].includes(app.hostname)) {
    throw new Error('E2E mutations must use a local app server connected to the test database.');
  }
  if (!env.SUPABASE_SECRET_KEY || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('A dedicated test project requires its own publishable and server-only test keys.');
  }
}
