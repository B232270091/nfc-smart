import { describe, expect, it } from 'vitest';
import { deploymentEnvironmentErrors, productionRef, testRef } from '../scripts/deployment-environment.mjs';

const production = {
  VERCEL: '1', VERCEL_ENV: 'production', E2E_ENABLED: '0',
  NEXT_PUBLIC_APP_URL: 'https://nfc-smart-example.vercel.app',
  NEXT_PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only',
  SUPABASE_SECRET_KEY: 'sb_secret_fixture_only', ANALYTICS_HMAC_SECRET: 'x'.repeat(32),
};

describe('deployment isolation', () => {
  it('accepts production and isolated test previews', () => {
    expect(deploymentEnvironmentErrors(production)).toEqual([]);
    expect(deploymentEnvironmentErrors({ ...production, VERCEL_ENV: 'preview', NEXT_PUBLIC_SUPABASE_URL: `https://${testRef}.supabase.co` })).toEqual([]);
  });
  it('blocks crossed database environments', () => {
    expect(deploymentEnvironmentErrors({ ...production, VERCEL_ENV: 'preview' }).length).toBeGreaterThan(0);
    expect(deploymentEnvironmentErrors({ ...production, NEXT_PUBLIC_SUPABASE_URL: `https://${testRef}.supabase.co` }).length).toBeGreaterThan(0);
  });
  it.each(['http://localhost:3000', 'https://app.example', 'https://u:p@site.com', 'https://site.com/path', 'https://site.com?x=1', 'https://site.com#x', 'https://127.0.0.1', 'https://site.com:8443'])('rejects invalid canonical origin %s', (url) => {
    expect(deploymentEnvironmentErrors({ ...production, NEXT_PUBLIC_APP_URL: url }).length).toBeGreaterThan(0);
  });
  it.each(['SUPABASE_SECRET_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'ANALYTICS_HMAC_SECRET'])('blocks missing %s', name => {
    expect(deploymentEnvironmentErrors({ ...production, [name]: '' }).length).toBeGreaterThan(0);
  });
  it('blocks privileged public values without leaking the value in errors', () => {
    const errors = deploymentEnvironmentErrors({ NEXT_PUBLIC_BAD: 'sb_secret_do_not_print' });
    expect(errors).toHaveLength(1);
    expect(errors.join()).not.toContain('sb_secret_do_not_print');
  });
  it.each([{ E2E_ENABLED: '1' }, { NFC_E2E_SERVER: '1' }, { E2E_SERVICE_ROLE_KEY: 'fixture' }])('rejects test configuration on hosted deployments', extra => {
    expect(deploymentEnvironmentErrors({ ...production, ...extra }).length).toBeGreaterThan(0);
  });
  it('allows local smoke builds without cloud credentials', () => {
    expect(deploymentEnvironmentErrors({})).toEqual([]);
  });
});
