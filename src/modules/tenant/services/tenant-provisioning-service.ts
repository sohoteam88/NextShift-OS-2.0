import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { trackUserSignedUp } from '@/lib/telemetry/tracker';
import { tenantService } from '@/modules/tenant/services/tenant-service';
import {
  generateSlug,
  isReservedSlug,
  normalizeSlug,
  suggestSlug,
} from '@/modules/tenant/utils/slug';
import {
  getProvisioningLocale,
  type TenantProvisionIntent,
} from '@/modules/tenant/utils/provisioning';

type ProvisioningAuthUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: unknown;
};

type ProvisionedTenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

type ProvisionedUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
  status: string;
};

export type TenantProvisioningResult = {
  created: boolean;
  tenant: ProvisionedTenant;
  user: ProvisionedUser;
};

const MAX_PROVISIONING_RETRIES = 5;

function hasVerifiedEmail(user: ProvisioningAuthUser): user is ProvisioningAuthUser & { email: string } {
  return Boolean(user.email && user.email_confirmed_at);
}

export function isVerifiedSupabaseUser(user: ProvisioningAuthUser | null): user is ProvisioningAuthUser & { email: string } {
  return Boolean(user && hasVerifiedEmail(user));
}

async function findExistingProvisioning(userId: string): Promise<TenantProvisioningResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      tenantId: true,
      role: true,
      status: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    created: false,
    tenant: user.tenant,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
      status: user.status,
    },
  };
}

async function resolveAvailableSlug(intent: TenantProvisionIntent, userId: string): Promise<string> {
  const baseSlug = normalizeSlug(intent.slug) || generateSlug(intent.name) || userId.slice(0, 8);
  let candidateSlug = baseSlug;
  let attempt = 2;

  while (isReservedSlug(candidateSlug) || (await prisma.tenant.findUnique({ where: { slug: candidateSlug } }))) {
    candidateSlug = suggestSlug(baseSlug, attempt);
    attempt += 1;
  }

  return candidateSlug;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function toProvisioningResult(
  result: Awaited<ReturnType<typeof tenantService.create>>,
): TenantProvisioningResult {
  return {
    created: true,
    tenant: {
      id: result.tenant.id,
      name: result.tenant.name,
      slug: result.tenant.slug,
      plan: result.tenant.plan,
    },
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      tenantId: result.user.tenantId,
      role: result.user.role,
      status: result.user.status,
    },
  };
}

export const tenantProvisioningService = {
  async provision(
    user: ProvisioningAuthUser,
    intent: TenantProvisionIntent,
  ): Promise<TenantProvisioningResult> {
    if (!hasVerifiedEmail(user)) {
      throw new Error('A verified email session is required before provisioning a workspace');
    }

    for (let retry = 0; retry < MAX_PROVISIONING_RETRIES; retry += 1) {
      const existing = await findExistingProvisioning(user.id);
      if (existing) return existing;

      const slug = await resolveAvailableSlug(intent, user.id);

      try {
        const result = await tenantService.create({
          name: intent.name,
          slug,
          plan: intent.plan,
          ownerId: user.id,
          ownerEmail: user.email,
          ownerName: intent.owner_name,
        });
        const provisioned = toProvisioningResult(result);

        await trackUserSignedUp(user.id, {
          plan: intent.plan,
          locale: getProvisioningLocale(user.user_metadata),
        });

        return provisioned;
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;

        const concurrentProvisioning = await findExistingProvisioning(user.id);
        if (concurrentProvisioning) return concurrentProvisioning;
      }
    }

    throw new Error('Workspace provisioning could not be completed after retrying');
  },
};
