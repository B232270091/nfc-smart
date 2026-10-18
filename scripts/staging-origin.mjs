// Diagnostic only. Never assigns NEXT_PUBLIC_APP_URL or bypasses validation.
export function stagingOriginHint(env) {
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'preview' || env.VERCEL_GIT_COMMIT_REF !== 'staging' || env.NEXT_PUBLIC_APP_URL) return null;
  const host = env.VERCEL_BRANCH_URL || '';
  // This bootstrap uses Vercel's free generated hostname, not an arbitrary URL.
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/.test(host)) return null;
  return `https://${host}`;
}
