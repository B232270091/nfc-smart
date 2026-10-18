export const productionRef = 'xcsnkvoulmrpxoxcjuvl';
export const testRef = 'khohnhjjyetwuzfsttkl';

function jwtPayload(value) {
  try { return JSON.parse(Buffer.from(value.split('.')[1] || '', 'base64url').toString()); }
  catch { return {}; }
}

/** Pure validation: never include values in error messages. */
export function deploymentEnvironmentErrors(env) {
  const errors = [];
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('NEXT_PUBLIC_') || !value) continue;
    if (value.startsWith('sb_secret_') || jwtPayload(value).role === 'service_role' || /SECRET|PASSWORD|SERVICE_ROLE|HMAC/.test(name)) {
      errors.push(`${name} contains privileged configuration and must not be public.`);
    }
  }
  if (env.VERCEL !== '1') return errors;
  const target = env.VERCEL_ENV;
  if (!['production', 'preview'].includes(target)) errors.push('VERCEL_ENV must be production or preview.');
  const ref = target === 'production' ? productionRef : testRef;
  if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co`) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL does not match the database assigned to this deployment environment.');
  }
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL || 'invalid:');
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash ||
        !url.hostname.includes('.') || /(^localhost$|\.localhost$|\.example$|\.invalid$|^[\d.]+$|:|[<>])/.test(url.hostname)) throw new Error();
  } catch { errors.push('NEXT_PUBLIC_APP_URL must be the real canonical HTTPS origin, without a path, query or placeholder.'); }
  const publishable = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const anon = jwtPayload(publishable);
  if (!(publishable.startsWith('sb_publishable_') && publishable.length > 20) && !(anon.role === 'anon' && anon.ref === ref)) {
    errors.push('A publishable key (or matching legacy anon key) is required.');
  }
  const secret = env.SUPABASE_SECRET_KEY || '';
  const service = jwtPayload(secret);
  if (!(secret.startsWith('sb_secret_') && secret.length > 20) && !(service.role === 'service_role' && service.ref === ref)) {
    errors.push('A server-only Supabase secret key (or matching legacy service_role key) is required.');
  }
  if ((env.ANALYTICS_HMAC_SECRET || '').length < 32) errors.push('ANALYTICS_HMAC_SECRET must contain at least 32 random characters.');
  for (const [name, value] of Object.entries(env)) {
    if (value && ((name === 'E2E_ENABLED' && value !== '0') || name.startsWith('E2E_') && name !== 'E2E_ENABLED' || name === 'NFC_E2E_SERVER' && value !== '0')) {
      errors.push(`${name} must not enable or configure E2E on Vercel.`);
    }
  }
  return errors;
}
