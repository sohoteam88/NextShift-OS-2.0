export type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type LogSource = 'server' | 'client' | 'worker' | 'migration';

export type LogPropertyValue = string | number | boolean | null;

export interface LogEventEnvelope {
  eventId: string;
  eventName: string;
  occurredAt: string;
  severity: LogSeverity;
  module: string;
  userId?: string;
  tenantId?: string;
  actorId?: string;
  correlationId?: string;
  source: LogSource;
  schemaVersion: number;
  properties: Record<string, LogPropertyValue>;
}

export interface LogEventInput extends Omit<LogEventEnvelope, 'properties'> {
  properties?: Record<string, unknown>;
}

export const LOG_EVENT_SCHEMA_VERSION = 1;

export const LOG_SEVERITIES: readonly LogSeverity[] = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];

export const LOG_SOURCES: readonly LogSource[] = ['server', 'client', 'worker', 'migration'];

export function createLogEventId(prefix = 'evt') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isLogEventInput(value: unknown): value is LogEventInput {
  if (!value || typeof value !== 'object') return false;

  const event = value as Partial<LogEventInput>;

  return (
    typeof event.eventId === 'string' &&
    event.eventId.length > 0 &&
    typeof event.eventName === 'string' &&
    event.eventName.length > 0 &&
    typeof event.occurredAt === 'string' &&
    LOG_SEVERITIES.includes(event.severity as LogSeverity) &&
    typeof event.module === 'string' &&
    event.module.length > 0 &&
    LOG_SOURCES.includes(event.source as LogSource) &&
    typeof event.schemaVersion === 'number'
  );
}

export function createLogEvent(input: {
  eventName: string;
  severity: LogSeverity;
  module: string;
  userId?: string;
  tenantId?: string;
  actorId?: string;
  correlationId?: string;
  source?: LogSource;
  properties?: Record<string, unknown>;
}): LogEventInput {
  return {
    eventId: createLogEventId(),
    eventName: input.eventName,
    occurredAt: new Date().toISOString(),
    severity: input.severity,
    module: input.module,
    userId: input.userId,
    tenantId: input.tenantId,
    actorId: input.actorId,
    correlationId: input.correlationId,
    source: input.source ?? 'server',
    schemaVersion: LOG_EVENT_SCHEMA_VERSION,
    properties: input.properties ?? {},
  };
}
