import { expect, it } from 'vitest';
import { assertE2ETarget, productionProjectRef } from '../scripts/e2e-safety.mjs';

const testEnv = {
  E2E_ENABLED: '1', E2E_SUPABASE_PROJECT_REF: 'dedicated-test-project',
  NEXT_PUBLIC_SUPABASE_URL: 'https://dedicated-test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-only-value', SUPABASE_SECRET_KEY: 'test-only-value',
};

it('rejects production even when all test flags and keys are provided', () => {
  expect(() => assertE2ETarget({ ...testEnv, E2E_SUPABASE_PROJECT_REF: productionProjectRef,
    NEXT_PUBLIC_SUPABASE_URL: `https://${productionProjectRef}.supabase.co` })).toThrow(/Production/);
});
it('rejects mismatched, unacknowledged and remote application targets', () => {
  for (const overrides of [
    { E2E_SUPABASE_PROJECT_REF: '' }, { NEXT_PUBLIC_SUPABASE_URL: 'https://unrelated.supabase.co' },
    { E2E_BASE_URL: 'https://nfc-production.example' }, { SUPABASE_SECRET_KEY: '' },
    { E2E_BASE_URL: 'http://127.0.0.1:3000' },
  ]) expect(() => assertE2ETarget({ ...testEnv, ...overrides })).toThrow();
});
it('permits only explicitly enabled separate targets and leaves read-only smoke runs alone', () => {
  expect(() => assertE2ETarget(testEnv)).not.toThrow();
  expect(() => assertE2ETarget({ E2E_ENABLED: '0' })).not.toThrow();
  expect(() => assertE2ETarget({ ...testEnv, E2E_SUPABASE_PROJECT_REF: 'local', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' })).not.toThrow();
});
