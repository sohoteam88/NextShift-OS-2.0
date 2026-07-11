import { afterEach, describe, expect, it, vi } from 'vitest';
import { runtimeFallbackLogger } from './runtime-fallback-logger';

const sentryMocks = vi.hoisted(() => ({
  captureMessage: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentryMocks);

afterEach(() => {
  vi.restoreAllMocks();
  sentryMocks.captureMessage.mockClear();
});

describe('runtimeFallbackLogger', () => {
  it('keeps console warning output and sends the original safe payload to Sentry', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const payload = {
      warning: 'runtime-adapter-fallback',
      source: 'api',
      status: 'resolved',
      errorKind: 'Error',
    };

    runtimeFallbackLogger.warn('[runtime-adapter] falling back to legacy path', payload);

    expect(consoleWarn).toHaveBeenCalledWith(
      '[runtime-adapter] falling back to legacy path',
      payload,
    );
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      '[runtime-adapter] falling back to legacy path',
      {
        level: 'warning',
        extra: payload,
      },
    );
  });
});
