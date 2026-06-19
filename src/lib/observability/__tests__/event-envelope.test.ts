import { describe, expect, it } from 'vitest';
import { LOG_EVENT_SCHEMA_VERSION, createLogEvent, isLogEventInput } from '../event-envelope';
import { RUNTIME_EVENTS } from '../event-catalog';

describe('event envelope', () => {
  it('creates a valid canonical log event envelope', () => {
    const event = createLogEvent({
      eventName: RUNTIME_EVENTS.executionStarted,
      severity: 'INFO',
      module: 'agent-runtime',
      userId: 'user_1',
      tenantId: 'tenant_1',
      correlationId: 'corr_1',
      properties: { assignmentId: 'assignment_1' },
    });

    expect(isLogEventInput(event)).toBe(true);
    expect(event.schemaVersion).toBe(LOG_EVENT_SCHEMA_VERSION);
    expect(event.source).toBe('server');
    expect(event.eventId).toMatch(/^evt_/);
    expect(event.occurredAt).toEqual(expect.any(String));
  });

  it('rejects invalid log event envelopes', () => {
    expect(isLogEventInput({ eventName: RUNTIME_EVENTS.executionStarted })).toBe(false);
  });
});
