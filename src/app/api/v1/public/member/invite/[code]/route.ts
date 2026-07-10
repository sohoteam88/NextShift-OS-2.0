import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { checkRateLimit } from '@/lib/rate-limit';
import { inviteService } from '@/modules/member/services/invite-service';

export const GET = apiHandler(async (request: NextRequest, context) => {
  const params = await context?.params;
  const code = params?.code ?? '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  if (!(await checkRateLimit(`member-invite:${ip}:${code}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many invite lookups' } },
      { status: 429 },
    );
  }

  const invite = await inviteService.validateInvite(code);
  return NextResponse.json({ data: invite });
});
