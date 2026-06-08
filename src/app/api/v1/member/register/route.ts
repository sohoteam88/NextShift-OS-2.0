import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { inviteService } from '@/modules/member/services/invite-service';

const RegisterSchema = z.object({
  invite_code: z.string().min(1),
  name: z.string().min(1).max(100),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  preferred_language: z.enum(['zh', 'en', 'ms']).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
  }

  const body = await request.json();
  const input = RegisterSchema.parse(body);
  const invite = await inviteService.validateInvite(input.invite_code);

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (existingUser) {
    throw new AppError('CONFLICT', 409, 'User already registered');
  }

  const result = await prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.create({
      data: {
        id: user.id,
        tenantId: invite.tenantId,
        email: user.email!,
        name: input.name,
        phone: input.phone ?? null,
        role: 'member',
        status: 'pending',
        sponsorId: invite.sponsorId,
        languagePreference: input.preferred_language ?? 'zh',
        metadata: {
          invite_code: input.invite_code,
          whatsapp: input.whatsapp ?? input.phone ?? '',
          invited_by: invite.sponsorName,
        },
      },
    });

    const inviteUsed = await tx.inviteCode.updateMany({
      where: { code: input.invite_code, used: false },
      data: {
        used: true,
        usedBy: user.id,
      },
    });

    if (inviteUsed.count === 0) {
      throw new AppError('INVITE_EXPIRED', 410, 'Invite link is invalid or expired');
    }

    await tx.auditLog.create({
      data: {
        tenantId: invite.tenantId,
        actorId: user.id,
        action: 'member.registered',
        targetType: 'user',
        targetId: dbUser.id,
        metadata: {
          name: dbUser.name,
          email: dbUser.email,
          sponsor_name: invite.sponsorName,
        },
      },
    });

    return dbUser;
  });

  return NextResponse.json(
    {
      data: {
        user: result,
        status: 'pending',
      },
    },
    { status: 201 },
  );
});
