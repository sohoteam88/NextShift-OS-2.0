import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { BusinessMemoryEvent, BusinessMemoryEventType } from '../contracts/BusinessContextMemory';

const TARGET_TYPE = 'business_memory';

type AppendBusinessMemoryEventInput = {
  type: BusinessMemoryEventType;
  tenantId: string | null;
  userId: string;
  title: string;
  summary: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

function metadataRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toMemoryEvent(row: {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  action: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}): BusinessMemoryEvent {
  if (!row.tenantId) {
    throw new Error('Business memory events must be tenant-scoped');
  }
  const metadata = metadataRecord(row.metadata);

  return {
    id: row.id,
    type: row.action as BusinessMemoryEventType,
    tenantId: row.tenantId,
    userId: row.actorId ?? String(metadata.userId ?? ''),
    occurredAt: row.createdAt.toISOString(),
    title: String(metadata.title ?? row.action),
    summary: String(metadata.summary ?? ''),
    referenceId: typeof metadata.referenceId === 'string' ? metadata.referenceId : undefined,
    metadata,
  };
}

export const businessMemoryEventStore = {
  async append(input: AppendBusinessMemoryEventInput): Promise<BusinessMemoryEvent> {
    const row = await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: input.type,
        targetType: TARGET_TYPE,
        metadata: {
          eventType: input.type,
          userId: input.userId,
          title: input.title,
          summary: input.summary,
          referenceId: input.referenceId,
          ...(input.metadata ?? {}),
        } as Prisma.InputJsonValue,
      },
    });

    return toMemoryEvent(row);
  },

  async appendOnce(input: AppendBusinessMemoryEventInput, windowHours = 24): Promise<BusinessMemoryEvent | null> {
    const since = new Date(Date.now() - windowHours * 3_600_000);
    const existing = await prisma.auditLog.findMany({
      where: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: input.type,
        targetType: TARGET_TYPE,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const duplicate = existing
      .map(toMemoryEvent)
      .find((event) => event.referenceId === input.referenceId && event.title === input.title);

    if (duplicate) return null;
    return this.append(input);
  },

  async list(userId: string, tenantId: string, limit = 100): Promise<BusinessMemoryEvent[]> {
    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        actorId: userId,
        targetType: TARGET_TYPE,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.map(toMemoryEvent);
  },
};
