export const dynamic = 'force-dynamic';

const APP_VERSION = '0.1.0';
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export function GET() {
  return Response.json({
    version: APP_VERSION,
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  }, {
    headers: NO_STORE_HEADERS,
  });
}
