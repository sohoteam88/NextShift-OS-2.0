import { semanticTokens } from "./semantic-tokens";
import type { SemanticTokens, TokenRecord, TokenValue } from "./token-types";

function isTokenRecord(value: TokenRecord | TokenValue): value is TokenRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveToken(
  tokens: TokenRecord,
  path: string
): TokenValue | undefined;
export function resolveToken<TFallback extends TokenValue>(
  tokens: TokenRecord,
  path: string,
  fallback: TFallback
): TokenValue | TFallback;
export function resolveToken<TFallback extends TokenValue>(
  tokens: TokenRecord,
  path: string,
  fallback?: TFallback
): TokenValue | TFallback | undefined {
  const segments = path.split(".").filter(Boolean);

  if (segments.length === 0) {
    return fallback;
  }

  let current: TokenRecord | TokenValue = tokens;

  for (const segment of segments) {
    if (!isTokenRecord(current) || !(segment in current)) {
      return fallback;
    }

    current = current[segment];
  }

  return isTokenRecord(current) ? fallback : current;
}

export function resolveSemanticToken(path: string): TokenValue | undefined;
export function resolveSemanticToken<TFallback extends TokenValue>(
  path: string,
  fallback: TFallback
): TokenValue | TFallback;
export function resolveSemanticToken<TFallback extends TokenValue>(
  path: string,
  fallback?: TFallback
): TokenValue | TFallback | undefined {
  if (fallback === undefined) {
    return resolveToken(semanticTokens as SemanticTokens, path);
  }

  return resolveToken(semanticTokens as SemanticTokens, path, fallback);
}
