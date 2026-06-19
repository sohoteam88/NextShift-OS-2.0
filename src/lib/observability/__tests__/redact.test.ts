import { describe, expect, it } from 'vitest';
import { redactLogProperties, loggingRedactionPolicy } from '../redact';

describe('redactLogProperties', () => {
  it('redacts sensitive keys recursively', () => {
    const result = redactLogProperties({
      userId: 'user_1',
      metadata: {
        apiKey: 'provider-secret',
        nested: [{ authorization: 'Bearer token-value' }],
      },
      prompt: 'full prompt should not be logged',
    });

    expect(result.userId).toBe('user_1');
    expect(result.prompt).toBe(loggingRedactionPolicy.redactedValue);
    expect(String(result.metadata)).toContain(loggingRedactionPolicy.redactedValue);
    expect(String(result.metadata)).not.toContain('provider-secret');
    expect(String(result.metadata)).not.toContain('Bearer token-value');
  });

  it('preserves safe IDs, counters, booleans, and durations', () => {
    const result = redactLogProperties({
      assignmentId: 'assignment_1',
      agentId: 'agent_1',
      count: 3,
      durationMs: 142,
      completed: true,
    });

    expect(result.assignmentId).toBe('assignment_1');
    expect(result.agentId).toBe('agent_1');
    expect(result.count).toBe(3);
    expect(result.durationMs).toBe(142);
    expect(result.completed).toBe(true);
  });

  it('truncates long strings', () => {
    const result = redactLogProperties({
      safeSummary: 'x'.repeat(loggingRedactionPolicy.maxStringLength + 50),
    });

    expect(String(result.safeSummary)).toContain('[TRUNCATED]');
    expect(String(result.safeSummary).length).toBeLessThan(540);
  });
});
