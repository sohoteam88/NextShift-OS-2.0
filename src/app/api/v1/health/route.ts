import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export const GET = apiHandler(async () => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  return NextResponse.json(
    {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services: { database: dbStatus },
    },
    {
      status: dbStatus === 'ok' ? 200 : 503,
      headers: NO_STORE_HEADERS,
    },
  );
});
