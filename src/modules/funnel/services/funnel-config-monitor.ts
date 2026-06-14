// Funnel Config Size Monitor — warns and logs oversized funnel configurations
// Integrated into funnelService.createInternal() and update()

const WARN_THRESHOLD_BYTES = 250_000;   // 250 KB — warn in logs
const ALERT_THRESHOLD_BYTES = 500_000;  // 500 KB — alert (may impact DB performance)

interface ConfigSizeResult {
  sizeBytes: number;
  sizeKB: number;
  level: 'ok' | 'warn' | 'alert';
  message: string | null;
}

export function measureConfigSize(config: Record<string, unknown> | null | undefined): ConfigSizeResult {
  const sizeBytes = Buffer.byteLength(JSON.stringify(config ?? {}), 'utf8');
  const sizeKB = Math.round((sizeBytes / 1024) * 10) / 10;

  let level: ConfigSizeResult['level'] = 'ok';
  let message: string | null = null;

  if (sizeBytes > ALERT_THRESHOLD_BYTES) {
    level = 'alert';
    message = `Funnel config is ${sizeKB}KB — exceeds ${ALERT_THRESHOLD_BYTES / 1000}KB alert threshold`;
  } else if (sizeBytes > WARN_THRESHOLD_BYTES) {
    level = 'warn';
    message = `Funnel config is ${sizeKB}KB — exceeds ${WARN_THRESHOLD_BYTES / 1000}KB warning threshold`;
  }

  return { sizeBytes, sizeKB, level, message };
}

export async function logOversizedConfig(
  tenantId: string,
  funnelId: string | null,
  title: string,
  result: ConfigSizeResult,
): Promise<void> {
  if (result.level === 'ok') return;

  try {
    // Log to console for ops visibility
    const logFn = result.level === 'alert' ? console.error : console.warn;
    logFn(`[FunnelConfigMonitor] ${result.message} | tenant=${tenantId} funnel=${funnelId ?? 'new'} title="${title}"`);

    // Log to DB if prisma is available
    if (result.level === 'alert') {
      const { default: prisma } = await import('@/lib/prisma');
      await prisma.analyticsEvent.create({
        data: {
          tenantId,
          eventName: 'funnel_config_oversized',
          properties: {
            funnelId: funnelId ?? 'new',
            title,
            sizeBytes: result.sizeBytes,
            sizeKB: result.sizeKB,
            threshold: ALERT_THRESHOLD_BYTES,
          },
        },
      });
    }
  } catch {
    // Logging shouldn't block the main flow
  }
}
