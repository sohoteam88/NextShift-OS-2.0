import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRuntimeTelemetryContext,
  emitRuntimeExecutionStarted,
} from '../runtime-telemetry';

describe('runtime telemetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redacts prompt and conversation fields before logging runtime telemetry', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const telemetry = createRuntimeTelemetryContext({
      userId: 'user_1',
      tenantId: 'tenant_1',
      agentId: 'agent_1',
      executionMode: 'direct_agent',
      executionSource: 'manual_override',
    });

    const result = emitRuntimeExecutionStarted({
      ...telemetry,
      extra: {
        prompt: 'raw prompt',
        conversation: 'raw conversation',
        safeCounter: 2,
      },
    });

    expect(result.ok).toBe(true);
    expect(info).toHaveBeenCalledTimes(1);

    const loggedEvent = JSON.parse(String(info.mock.calls[0][0]));
    expect(loggedEvent.properties.prompt).toBe('[REDACTED]');
    expect(loggedEvent.properties.conversation).toBe('[REDACTED]');
    expect(loggedEvent.properties.safeCounter).toBe(2);
    expect(loggedEvent.properties.executionSource).toBe('manual_override');
    expect(JSON.stringify(loggedEvent)).not.toContain('raw prompt');
    expect(JSON.stringify(loggedEvent)).not.toContain('raw conversation');
  });

  it('does not throw when the logging sink fails', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {
      throw new Error('sink failed');
    });
    const telemetry = createRuntimeTelemetryContext({
      userId: 'user_1',
      tenantId: 'tenant_1',
      agentId: 'agent_1',
      executionMode: 'direct_agent',
      executionSource: 'manual_override',
    });

    expect(() => emitRuntimeExecutionStarted(telemetry)).not.toThrow();
    expect(emitRuntimeExecutionStarted(telemetry).ok).toBe(false);
  });
});
