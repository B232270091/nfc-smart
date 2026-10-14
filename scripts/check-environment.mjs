import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// The same precedence as a production Next.js build. Existing process env wins.
for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  if (existsSync(file)) loadEnvFile(file);
}
const errors = [];
for (const [name, value] of Object.entries(process.env)) {
  if (!name.startsWith('NEXT_PUBLIC_') || !value) continue;
  let role;
  try { role = JSON.parse(Buffer.from(value.split('.')[1] || '', 'base64url').toString()).role; } catch { /* Not a JWT. */ }
  if (value.startsWith('sb_secret_') || role === 'service_role' || /SECRET|PASSWORD|SERVICE_ROLE|HMAC/.test(name)) {
    errors.push(`${name} contains privileged configuration and must not be public.`);
  }
}
if (process.env.VERCEL === '1') {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL || 'invalid:');
    if (url.protocol !== 'https:' || url.username || url.password || ['localhost','127.0.0.1'].includes(url.hostname)) throw new Error();
  } catch { errors.push('Vercel requires a real HTTPS NEXT_PUBLIC_APP_URL for permanent NFC links.'); }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Public environment check passed. No secret values were printed.');
