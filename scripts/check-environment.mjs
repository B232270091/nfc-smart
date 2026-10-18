import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { deploymentEnvironmentErrors } from './deployment-environment.mjs';
import { stagingOriginHint } from './staging-origin.mjs';

// The same precedence as a production Next.js build. Existing process env wins.
for (const file of process.env.VERCEL === '1' ? [] : ['.env.production.local', '.env.local', '.env.production', '.env']) {
  if (existsSync(file)) loadEnvFile(file);
}
const errors = deploymentEnvironmentErrors(process.env);
const stagingOrigin = stagingOriginHint(process.env);
if (stagingOrigin) console.log(`STAGING_BRANCH_ORIGIN=${stagingOrigin} (Vercel-generated; configure explicitly, then redeploy.)`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Public environment check passed. No secret values were printed.');
