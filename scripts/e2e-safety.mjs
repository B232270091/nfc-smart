import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const productionProjectRef = 'xcsnkvoulmrpxoxcjuvl';
export const testProjectName = 'nfc-smart-test';
export const verificationPath = '.local/e2e-target.json';

export function verifyProjectIdentity(projects, ref) {
  const target = projects.find(p => p.id === ref);
  const production = projects.find(p => p.id === productionProjectRef);
  if (ref === productionProjectRef || !target || target.name !== testProjectName || target.status !== 'ACTIVE_HEALTHY' ||
      !production || production.name !== 'nfc-smart-production' ||
      !target.organization_id || target.organization_id !== production.organization_id) {
    throw new Error('Both project names, distinct IDs, shared organization, and healthy test status must be verified through Supabase.');
  }
  return { target, production };
}

export function targetFingerprint(env) {
  return createHash('sha256').update(JSON.stringify([
    env.E2E_SUPABASE_PROJECT_REF, env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, env.SUPABASE_SECRET_KEY,
  ])).digest('hex');
}

export function assertTestConfiguration(env) {
  const ref = env.E2E_SUPABASE_PROJECT_REF;
  if (ref === productionProjectRef || env.NEXT_PUBLIC_SUPABASE_URL?.includes(productionProjectRef)) {
    throw new Error('Production Supabase is read-only. E2E mutations are forbidden.');
  }
  if (!/^[a-z]{20}$/.test(ref || '') || env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co`) {
    throw new Error('A separate hosted test project reference and matching canonical HTTPS URL are required.');
  }
  if (env.E2E_SUPABASE_PROJECT_NAME !== testProjectName) throw new Error('Only nfc-smart-test is permitted.');
  if (env.E2E_BASE_URL) throw new Error('E2E_BASE_URL is forbidden for integration tests; start an isolated server.');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '') ||
      !/^sb_secret_[A-Za-z0-9_-]+$/.test(env.SUPABASE_SECRET_KEY || '')) {
    throw new Error('Dedicated modern test publishable and secret keys are required.');
  }
}

export function readVerification() {
  try { return JSON.parse(readFileSync(verificationPath, 'utf8')); }
  catch { throw new Error('Test identity is unverified. Run npm run e2e:verify first.'); }
}

// Run before constructing clients, starting the app, and again before cleanup.
export function assertE2ETarget(env, receipt, now = Date.now()) {
  if (env.E2E_ENABLED !== '1') return;
  assertTestConfiguration(env);
  const verified = receipt ?? readVerification();
  const age = now - Date.parse(verified.verifiedAt);
  if (verified.name !== testProjectName || verified.id !== env.E2E_SUPABASE_PROJECT_REF ||
      verified.productionId !== productionProjectRef || !verified.organizationId ||
      verified.fingerprint !== targetFingerprint(env) || !Number.isFinite(age) || age < 0 || age > 86_400_000) {
    throw new Error('Test identity or credentials changed, or verification expired. Run npm run e2e:verify.');
  }
}

export function announceE2EMutation(env, operation) {
  if (env.E2E_ENABLED !== '1') throw new Error('E2E mutations are disabled.');
  assertE2ETarget(env);
  console.log(`[E2E ${operation}] Target: ${testProjectName} (${env.E2E_SUPABASE_PROJECT_REF})`);
}
