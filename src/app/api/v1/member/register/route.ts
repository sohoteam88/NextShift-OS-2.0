import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { inviteService } from '@/modules/member/services/invite-service';

const RegisterSchema = z.object({
  invite_code: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  preferred_language: z.enum(['zh', 'en', 'ms']).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const input = RegisterSchema.parse(body);
  const invite = await inviteService.validateInvite(input.invite_code);
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('CONFLICT', 409, 'User already registered');
  }

  const supabaseAdmin = createServiceRoleSupabaseClient();
  const { data: createdAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      phone: input.phone ?? '',
      whatsapp: input.whatsapp ?? input.phone ?? '',
      preferred_language: input.preferred_language ?? 'zh',
      invite_code: input.invite_code,
    },
  });

  let authUserId = createdAuthUser.user?.id;
  let shouldCleanupAuth = Boolean(authUserId);

  if (createAuthError && createAuthError.message.toLowerCase().includes('already')) {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingAuthUser = authUsers.users.find((authUser) => authUser.email?.toLowerCase() === normalizedEmail);
    authUserId = existingAuthUser?.id;
    shouldCleanupAuth = false;
  }

  if (!authUserId) {
    throw new AppError('AUTH_CREATE_FAILED', 400, createAuthError?.message ?? 'Unable to create auth user');
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.create({
        data: {
          id: authUserId,
          tenantId: invite.tenantId,
          email: normalizedEmail,
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
          usedBy: authUserId,
        },
      });

      if (inviteUsed.count === 0) {
        throw new AppError('INVITE_EXPIRED', 410, 'Invite link is invalid or expired');
      }

      await tx.auditLog.create({
        data: {
          tenantId: invite.tenantId,
          actorId: authUserId,
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
  } catch (error) {
    if (shouldCleanupAuth) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => undefined);
    }
    throw error;
  }

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
