export const dynamic = 'force-dynamic';

const APP_VERSION = '0.1.0';

export function GET() {
  return Response.json({
    version: APP_VERSION,
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  });
}
