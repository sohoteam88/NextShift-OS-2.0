export function getRequestIp(headers: Headers, env: NodeJS.ProcessEnv = process.env) {
  const trustedIp = headers.get('x-real-ip')?.trim();
  if (trustedIp) return trustedIp;

  if (env.NODE_ENV !== 'production') {
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  }

  return 'unknown';
}
