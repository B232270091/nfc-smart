import { spawnSync } from 'node:child_process';
import { loadE2EEnvironment } from './e2e-environment.mjs';
import { announceE2EMutation } from './e2e-safety.mjs';

try {
  const env = loadE2EEnvironment();
  announceE2EMutation(env, 'integration suite');
  const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { env, stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
