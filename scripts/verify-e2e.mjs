import { mkdirSync, writeFileSync } from 'node:fs';
import { readTestEnvironment, readProductionEnvironment, isolateTestEnvironment } from './e2e-environment.mjs';
import { verifyProjectIdentity, targetFingerprint, verificationPath } from './e2e-safety.mjs';

// Read-only verification. Never enables tests or changes either Supabase project.
async function requestJSON(url, headers, label) {
  let response;
  try { response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000), redirect: 'error' }); }
  catch { throw new Error(`${label}: network request failed.`); }
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}.`);
  try { return await response.json(); }
  catch { throw new Error(`${label}: invalid JSON response.`); }
}

try {
  const file = readTestEnvironment();
  const env = isolateTestEnvironment(file, {}, readProductionEnvironment());
  const token = file.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Read-only name verification needs SUPABASE_ACCESS_TOKEN locally, or a connected Supabase project verification by the agent. Never send tokens in chat.');
  const projects = await requestJSON('https://api.supabase.com/v1/projects', { Authorization: `Bearer ${token}` }, 'Project identity');
  if (!Array.isArray(projects)) throw new Error('Project identity response must be a list.');
  const { target, production } = verifyProjectIdentity(projects, env.E2E_SUPABASE_PROJECT_REF);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  await requestJSON(`${url}/auth/v1/settings`, { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }, 'Test publishable key');
  await requestJSON(`${url}/auth/v1/admin/users?page=1&per_page=1`, { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` }, 'Test secret key');
  mkdirSync('.local', { recursive: true });
  writeFileSync(verificationPath, JSON.stringify({ name: target.name, id: target.id, organizationId: target.organization_id,
    productionId: production.id, fingerprint: targetFingerprint(env), verifiedAt: new Date().toISOString() }, null, 2));
  console.log(`Verified test: ${target.name} (${target.id}). Production: ${production.name} (${production.id}). Different URLs and references confirmed. Valid for 24 hours; no data changed.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
