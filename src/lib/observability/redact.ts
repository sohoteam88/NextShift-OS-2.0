import type { LogPropertyValue } from './event-envelope';

const REDACTED = '[REDACTED]';
const MAX_STRING_LENGTH = 500;

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'refresh',
  'access',
  'service_role',
  'database_url',
  'direct_url',
  'prompt',
  'conversation',
  'transcript',
  'privateNote',
  'card',
  'payment',
];

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

function truncateString(value: string) {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
}

function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) return REDACTED;

  if (value === null || value === undefined) return null;

  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(key, item));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
    };
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => [
        nestedKey,
        redactValue(nestedKey, nestedValue),
      ]),
    );
  }

  return String(value);
}

function normalizeLogProperty(value: unknown): LogPropertyValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  try {
    return truncateString(JSON.stringify(value));
  } catch {
    return '[UNSERIALIZABLE]';
  }
}

export function redactLogProperties(input: Record<string, unknown> = {}): Record<string, LogPropertyValue> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      const redactedValue = redactValue(key, value);
      return [key, normalizeLogProperty(redactedValue)];
    }),
  );
}

export const loggingRedactionPolicy = {
  redactedValue: REDACTED,
  maxStringLength: MAX_STRING_LENGTH,
  sensitiveKeyPatterns: SENSITIVE_KEY_PATTERNS,
} as const;
