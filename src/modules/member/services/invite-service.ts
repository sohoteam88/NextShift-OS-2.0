import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';

const INVITE_EXPIRY_DAYS = 7;
const INVITE_ROLES = new Set(['leader', 'operator', 'platform_admin']);

function getBaseUrl(baseUrl?: string) {
  return (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export const inviteService = {
  async createInvite(user: AuthUser, baseUrl?: string) {
    if (!INVITE_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const code = crypto.randomBytes(6).toString('hex');
    const invite = await prisma.inviteCode.create({
      data: {
        tenantId: user.tenantId,
        sponsorId: user.id,
        code,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
      include: {
        sponsor: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    return {
      code: invite.code,
      url: `${getBaseUrl(baseUrl)}/join/${invite.code}`,
      expiresAt: invite.expiresAt,
      tenantName: invite.tenant.name,
      sponsorName: invite.sponsor.name,
    };
  },

  async listActiveInvites(user: AuthUser, baseUrl?: string) {
    if (!INVITE_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const invites = await prisma.inviteCode.findMany({
      where: {
        tenantId: user.tenantId,
        sponsorId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sponsor: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    return invites.map((invite) => ({
      code: invite.code,
      url: `${getBaseUrl(baseUrl)}/join/${invite.code}`,
      used: invite.used,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      tenantName: invite.tenant.name,
      sponsorName: invite.sponsor.name,
    }));
  },

  async validateInvite(code: string) {
    const invite = await prisma.inviteCode.findUnique({
      where: { code },
      include: {
        tenant: { select: { id: true, name: true } },
        sponsor: { select: { id: true, name: true } },
      },
    });

    if (!invite) {
      throw new AppError('NOT_FOUND', 404, 'Invite not found');
    }

    if (invite.used || invite.expiresAt <= new Date()) {
      throw new AppError('INVITE_EXPIRED', 410, 'Invite link is invalid or expired');
    }

    return {
      tenantId: invite.tenantId,
      sponsorId: invite.sponsorId,
      tenantName: invite.tenant.name,
      sponsorName: invite.sponsor.name,
      expiresAt: invite.expiresAt,
      code: invite.code,
    };
  },

  async markUsed(code: string, usedBy?: string) {
    const updated = await prisma.inviteCode.updateMany({
      where: { code, used: false },
      data: {
        used: true,
        usedBy: usedBy ?? null,
      },
    });

    if (updated.count === 0) {
      throw new AppError('NOT_FOUND', 404, 'Invite not found');
    }
  },
};
