/**
 * RFC 8785 JSON Canonicalization Scheme for JSON-compatible values.
 *
 * ECMAScript JSON number/string serialization supplies the RFC's primitive
 * representation; object member names are sorted by UTF-16 code units. Inputs
 * outside I-JSON (non-finite numbers, lone surrogates, undefined, BigInt, and
 * executable values) are rejected instead of being silently normalized.
 */
export class JsonCanonicalizationError extends TypeError {}

function assertValidUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new JsonCanonicalizationError('RFC 8785 rejects lone high surrogates');
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new JsonCanonicalizationError('RFC 8785 rejects lone low surrogates');
    }
  }
}

function primitive(value: null | boolean | number | string): string {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new JsonCanonicalizationError('RFC 8785 rejects non-finite numbers');
  }
  if (typeof value === 'string') assertValidUnicode(value);
  return JSON.stringify(value);
}

export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return primitive(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalizeJson(entry)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new JsonCanonicalizationError('RFC 8785 input must be plain JSON data');
    }
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object).sort();
    return `{${keys.map((key) => {
      assertValidUnicode(key);
      const entry = object[key];
      if (entry === undefined || typeof entry === 'bigint' || typeof entry === 'function' || typeof entry === 'symbol') {
        throw new JsonCanonicalizationError(`RFC 8785 rejects non-JSON member ${key}`);
      }
      return `${JSON.stringify(key)}:${canonicalizeJson(entry)}`;
    }).join(',')}}`;
  }
  throw new JsonCanonicalizationError('RFC 8785 input must be JSON-compatible');
}
