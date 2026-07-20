import { cache } from 'react';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export const resolveTenant = cache(async (slug?: string | null) => {
  let resolvedSlug = slug?.trim() || undefined;

  if (!resolvedSlug) {
    const headerStore = await headers();
    resolvedSlug = headerStore.get('x-tenant-slug')?.trim() || undefined;
  }

  if (!resolvedSlug) return null;

  return prisma.tenant.findFirst({
    where: { slug: resolvedSlug, status: { not: 'deleted' } },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxMembers: true,
      maxAiCalls: true,
      status: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

export async function getTenantById(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxMembers: true,
      maxAiCalls: true,
      status: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
