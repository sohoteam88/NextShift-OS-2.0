import { isLogEventInput, type LogEventEnvelope, type LogEventInput } from './event-envelope';
import { redactLogProperties } from './redact';

export type TelemetryEmitResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string; eventId?: string };

function writeStructuredLog(event: LogEventEnvelope) {
  const payload = JSON.stringify(event);

  if (event.severity === 'CRITICAL' || event.severity === 'ERROR') {
    console.error(payload);
    return;
  }

  if (event.severity === 'WARN') {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export function emitServerEvent(event: LogEventInput): TelemetryEmitResult {
  try {
    if (!isLogEventInput(event)) {
      return { ok: false, error: 'INVALID_LOG_EVENT_ENVELOPE' };
    }

    const safeEvent: LogEventEnvelope = {
      ...event,
      properties: redactLogProperties(event.properties ?? {}),
    };

    writeStructuredLog(safeEvent);
    return { ok: true, eventId: event.eventId };
  } catch (error) {
    return {
      ok: false,
      eventId: event?.eventId,
      error: error instanceof Error ? error.message : 'LOG_EMIT_FAILED',
    };
  }
}
