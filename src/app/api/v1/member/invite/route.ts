import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { inviteService } from '@/modules/member/services/invite-service';

const InviteCreateSchema = z.object({
  base_url: z.string().url().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const invites = await inviteService.listActiveInvites(user, request.nextUrl.origin);
  return NextResponse.json({ data: invites });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json().catch(() => ({}));
  const input = InviteCreateSchema.parse(body);

  const invite = await inviteService.createInvite(user, input.base_url ?? request.nextUrl.origin);
  return NextResponse.json({ data: invite }, { status: 201 });
});
