import { runAuditOutboxBatch, runOperationalAlertBatch } from '@/modules/admin/workers/audit-outbox-worker';
import prisma from '@/lib/prisma';

const requested = Number.parseInt(process.env.AUDIT_OUTBOX_BATCH_SIZE ?? '100', 10);
const limit = Number.isFinite(requested) ? requested : 100;

try {
  const result = await runAuditOutboxBatch({ limit });
  const webhook = process.env.AUDIT_ALERT_WEBHOOK_URL;
  const alerts = webhook ? await runOperationalAlertBatch(async (alert) => {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: alert.id,
        type: alert.alertType,
        severity: alert.severity,
        correlationId: alert.correlationId,
        payload: alert.payload,
      }),
    });
    if (!response.ok) throw new Error(`Alert webhook returned ${response.status}`);
    return { receipt: response.headers.get('x-alert-receipt') ?? `${response.status}:${alert.id}` };
  }, { limit }) : { claimed: 0, delivered: 0, retry: 0 };
  process.stdout.write(`${JSON.stringify({ outbox: result, alerts })}\n`);
  if (result.retry > 0 || result.deadLetter > 0) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
