import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { inviteService } from '@/modules/member/services/invite-service';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';

const InviteCreateSchema = z.object({
  base_url: z.string().url().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator']);
  const invites = await inviteService.listActiveInvites(user);
  return NextResponse.json({ data: invites });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/member-invites');
  const body = await request.json().catch(() => ({}));
  const input = InviteCreateSchema.parse(body);

  const invite = await inviteService.createInvite(user, input.base_url);
  return NextResponse.json({ data: invite }, { status: 201 });
});
