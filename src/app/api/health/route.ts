import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'NextShift OS',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }, {
    headers: NO_STORE_HEADERS,
  });
}
