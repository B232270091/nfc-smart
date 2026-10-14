import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { assertE2ETarget, assertTestConfiguration, productionProjectRef } from './e2e-safety.mjs';

const allowed = ['E2E_SUPABASE_PROJECT_NAME', 'E2E_SUPABASE_PROJECT_REF', 'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'ANALYTICS_HMAC_SECRET'];

export function readTestEnvironment(path = '.env.e2e.local') {
  if (!existsSync(path)) throw new Error('Create .env.e2e.local using docs/test-environment.md. No production fallback is allowed.');
  return parseEnv(readFileSync(path, 'utf8'));
}

export function readProductionEnvironment() {
  return existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
}

export function isolateTestEnvironment(test, inherited = {}, production = {}) {
  assertTestConfiguration({ ...test, E2E_BASE_URL: inherited.E2E_BASE_URL || test.E2E_BASE_URL });
  if (production.NEXT_PUBLIC_SUPABASE_URL && production.NEXT_PUBLIC_SUPABASE_URL !== `https://${productionProjectRef}.supabase.co`) {
    throw new Error('Production URL changed; review the production denylist before testing.');
  }
  if (test.NEXT_PUBLIC_SUPABASE_URL === production.NEXT_PUBLIC_SUPABASE_URL ||
      test.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === production.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      test.SUPABASE_SECRET_KEY === production.SUPABASE_SECRET_KEY) {
    throw new Error('Production and test credentials must be different.');
  }
  const isolated = { ...inherited };
  // Empty values prevent Next.js from falling back to production dotenv files.
  for (const key of new Set([...Object.keys(inherited), ...Object.keys(production), ...allowed,
    'SUPABASE_ACCESS_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL', 'POSTGRES_URL', 'NEXT_PUBLIC_SUPPORT_EMAIL', 'VERCEL'])) {
    if (Object.hasOwn(production, key) || /SUPABASE|DATABASE|POSTGRES|ANALYTICS|VERCEL/.test(key) || key === 'NEXT_PUBLIC_SUPPORT_EMAIL') isolated[key] = '';
  }
  for (const key of allowed) isolated[key] = test[key] || '';
  return { ...isolated, NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100', E2E_ENABLED: '1', NFC_E2E_SERVER: '1' };
}

export function loadE2EEnvironment(inherited = process.env) {
  const isolated = isolateTestEnvironment(readTestEnvironment(), inherited, readProductionEnvironment());
  assertE2ETarget(isolated);
  return isolated;
}
