import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { assertRequestBodySize } from '@/lib/request-guards';

export async function GET() {
  return NextResponse.json({
    module: 'auth',
    status: 'placeholder',
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(`auth-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
      { status: 429 },
    );
  }

  assertRequestBodySize(request, 1_000_000, 'Auth payload');

  return NextResponse.json({ data: { success: true } });
}
