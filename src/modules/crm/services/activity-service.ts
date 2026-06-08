import prisma from '@/lib/prisma';

export async function logActivity(params: {
  tenantId: string;
  leadId: string;
  userId: string;
  type: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activity.create({
    data: {
      tenantId: params.tenantId,
      leadId: params.leadId,
      userId: params.userId,
      type: params.type,
      description: params.description ?? params.type,
      metadata: (params.metadata ?? {}) as never,
    },
  });
}
