import { runAuditOutboxBatch } from '@/modules/admin/workers/audit-outbox-worker';
import prisma from '@/lib/prisma';

const requested = Number.parseInt(process.env.AUDIT_OUTBOX_BATCH_SIZE ?? '100', 10);
const limit = Number.isFinite(requested) ? requested : 100;

try {
  const result = await runAuditOutboxBatch({ limit });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.retry > 0 || result.deadLetter > 0) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
