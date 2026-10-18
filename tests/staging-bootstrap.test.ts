import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { stagingOriginHint } from '../scripts/staging-origin.mjs';

const fixture = {
  VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'staging',
  VERCEL_BRANCH_URL: 'fixture-git-staging-team.vercel.app', NEXT_PUBLIC_APP_URL: '',
};

it('prints only the supplied branch origin, without assigning configuration', () => {
  const env = { ...fixture };
  expect(stagingOriginHint(env)).toBe('https://fixture-git-staging-team.vercel.app');
  expect(env.NEXT_PUBLIC_APP_URL).toBe('');
});

it.each([
  { VERCEL: '0' }, { VERCEL_ENV: 'production' }, { VERCEL_GIT_COMMIT_REF: 'feature' },
  { NEXT_PUBLIC_APP_URL: 'https://already-set.vercel.app' }, { VERCEL_BRANCH_URL: '' },
  { VERCEL_BRANCH_URL: 'https://fixture.vercel.app' }, { VERCEL_BRANCH_URL: 'evil.example/path' },
  { VERCEL_BRANCH_URL: 'fixture.vercel.app\nSECRET=anything' },
])('does not produce a hint for ineligible metadata %j', extra => {
  expect(stagingOriginHint({ ...fixture, ...extra })).toBeNull();
});

it('still exits with failure for a missing APP_URL and never prints secrets', () => {
  const result = spawnSync(process.execPath, ['scripts/check-environment.mjs'], {
    cwd: process.cwd(), encoding: 'utf8',
    env: { ...process.env, ...fixture,
      NEXT_PUBLIC_SUPABASE_URL: 'https://khohnhjjyetwuzfsttkl.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only',
      SUPABASE_SECRET_KEY: 'sb_secret_never_print_this', ANALYTICS_HMAC_SECRET: 'x'.repeat(32), E2E_ENABLED: '0',
    },
  });
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('STAGING_BRANCH_ORIGIN=https://fixture-git-staging-team.vercel.app');
  expect(result.stderr).toContain('NEXT_PUBLIC_APP_URL');
  expect(result.stdout + result.stderr).not.toContain('sb_secret_never_print_this');
});
