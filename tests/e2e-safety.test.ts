import { expect, it } from 'vitest';
import { assertE2ETarget, announceE2EMutation, productionProjectRef, targetFingerprint, verifyProjectIdentity, type Verification } from '../scripts/e2e-safety.mjs';
import { isolateTestEnvironment, readTestEnvironment } from '../scripts/e2e-environment.mjs';

const testEnv = {
  E2E_ENABLED: '1', E2E_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst', E2E_SUPABASE_PROJECT_NAME: 'nfc-smart-test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_unit_fixture', SUPABASE_SECRET_KEY: 'sb_secret_unit_fixture',
};
const now = Date.now();
const receipt: Verification = { name: 'nfc-smart-test', id: testEnv.E2E_SUPABASE_PROJECT_REF, productionId: productionProjectRef,
  organizationId: 'fixture-org', fingerprint: targetFingerprint(testEnv), verifiedAt: new Date(now).toISOString() };

it('requires independently fetched project names, healthy status, and the same organization', () => {
  const production = { id: productionProjectRef, name: 'nfc-smart-production', organization_id: 'fixture-org', status: 'ACTIVE_HEALTHY' };
  const target = { ...production, id: testEnv.E2E_SUPABASE_PROJECT_REF, name: 'nfc-smart-test' };
  expect(verifyProjectIdentity([production, target], target.id).target.id).toBe(target.id);
  expect(() => verifyProjectIdentity([], target.id)).toThrow();
  expect(() => verifyProjectIdentity([production, target], production.id)).toThrow();
  for (const override of [{ name: 'nfc-smart-production' }, { status: 'INACTIVE' }, { organization_id: 'another-org' }]) {
    expect(() => verifyProjectIdentity([production, { ...target, ...override }], target.id)).toThrow();
  }
});

it('rejects production even when all test flags and keys are provided', () => {
  expect(() => assertE2ETarget({ ...testEnv, E2E_SUPABASE_PROJECT_REF: productionProjectRef,
    NEXT_PUBLIC_SUPABASE_URL: `https://${productionProjectRef}.supabase.co` }, receipt, now)).toThrow(/Production/);
});
it('rejects mismatched, unacknowledged and remote application targets', () => {
  for (const overrides of [
    { E2E_SUPABASE_PROJECT_REF: '' }, { NEXT_PUBLIC_SUPABASE_URL: 'https://unrelated.supabase.co' },
    { E2E_BASE_URL: 'https://nfc-production.example' }, { SUPABASE_SECRET_KEY: '' },
    { E2E_BASE_URL: 'http://127.0.0.1:3000' },
    { E2E_SUPABASE_PROJECT_NAME: 'nfc-smart-production' }, { SUPABASE_SECRET_KEY: 'legacy-jwt' },
    { NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co/redirect' },
    { NEXT_PUBLIC_SUPABASE_URL: 'https://user@abcdefghijklmnopqrst.supabase.co' },
    { E2E_SUPABASE_PROJECT_REF: 'local', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' },
  ]) expect(() => assertE2ETarget({ ...testEnv, ...overrides }, receipt, now)).toThrow();
});
it('permits verified targets and leaves read-only smoke runs alone', () => {
  expect(() => assertE2ETarget(testEnv, receipt, now)).not.toThrow();
  expect(() => assertE2ETarget({ E2E_ENABLED: '0' })).not.toThrow();
  expect(() => announceE2EMutation({ E2E_ENABLED: '0' }, 'cleanup')).toThrow(/disabled/);
});
it('rejects stale, future, wrong-project and incomplete identity verification', () => {
  for (const override of [{ name: 'another-project' }, { id: productionProjectRef }, { organizationId: '' },
    { verifiedAt: new Date(now - 86_400_001).toISOString() }, { verifiedAt: new Date(now + 1).toISOString() },
    { verifiedAt: 'invalid' }, { fingerprint: '' }]) {
    expect(() => assertE2ETarget(testEnv, { ...receipt, ...override }, now)).toThrow(/verification/);
  }
});
it('requires re-verification after test credentials change', () => {
  expect(() => assertE2ETarget({ ...testEnv, SUPABASE_SECRET_KEY: 'sb_secret_rotated' }, receipt, now)).toThrow(/verification/);
});
it('explicit test file overrides inherited production credentials without altering either input', () => {
  const production = { NEXT_PUBLIC_SUPABASE_URL: `https://${productionProjectRef}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_production_fixture', SUPABASE_SECRET_KEY: 'sb_secret_production_fixture',
    ANALYTICS_HMAC_SECRET: 'production-fixture', NEXT_PUBLIC_SUPPORT_EMAIL: 'production@example.com' };
  const inherited = { ...production, PATH: 'keep-this', SUPABASE_ACCESS_TOKEN: 'management-fixture', VERCEL: '1' };
  const isolated = isolateTestEnvironment(testEnv, inherited, production);
  expect(isolated.NEXT_PUBLIC_SUPABASE_URL).toBe(testEnv.NEXT_PUBLIC_SUPABASE_URL);
  expect(isolated.SUPABASE_SECRET_KEY).toBe(testEnv.SUPABASE_SECRET_KEY);
  expect(isolated.ANALYTICS_HMAC_SECRET).toBe('');
  expect(isolated.SUPABASE_ACCESS_TOKEN).toBe('');
  expect(isolated.VERCEL).toBe('');
  expect(isolated.NEXT_PUBLIC_APP_URL).toBe('http://127.0.0.1:3100');
  expect(isolated.PATH).toBe('keep-this');
  expect(inherited.SUPABASE_SECRET_KEY).toBe(production.SUPABASE_SECRET_KEY);
});
it('never fills missing test credentials from production or shell', () => {
  expect(() => isolateTestEnvironment({ ...testEnv, SUPABASE_SECRET_KEY: '' }, testEnv)).toThrow(/keys/);
  expect(() => readTestEnvironment('.local/nonexistent-e2e-unit-fixture.env')).toThrow(/No production fallback/);
});
it('rejects duplicate production keys and unexpected production project identities', () => {
  expect(() => isolateTestEnvironment(testEnv, {}, { SUPABASE_SECRET_KEY: testEnv.SUPABASE_SECRET_KEY })).toThrow(/different/);
  expect(() => isolateTestEnvironment(testEnv, {}, { NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' })).toThrow(/denylist/);
});
