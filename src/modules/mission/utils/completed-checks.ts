export type CompletedCheckEntry = {
  check: string;
  completed_at: string;
};

export type CompletedChecksValue = CompletedCheckEntry[] | string[];

function isCompletedCheckEntry(value: unknown): value is CompletedCheckEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.check === 'string' && typeof item.completed_at === 'string';
}

export function toCompletedChecksValue(value: unknown): CompletedChecksValue {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return value.filter(isCompletedCheckEntry);
}

export function toCompletedCheckEntries(value: unknown, completedAt = new Date().toISOString()): CompletedCheckEntry[] {
  const checks = toCompletedChecksValue(value);
  if (checks.length === 0) return [];
  if (typeof checks[0] !== 'string') return checks as CompletedCheckEntry[];
  return (checks as string[]).map((check) => ({ check, completed_at: completedAt }));
}

export function extractCheckKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys = value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (isCompletedCheckEntry(item)) return [item.check];
    return [];
  });
  return Array.from(new Set(keys));
}

export function getCompletionDate(value: unknown, checkKey: string): string | null {
  if (!Array.isArray(value)) return null;
  const entry = value.find((item) => isCompletedCheckEntry(item) && item.check === checkKey);
  return isCompletedCheckEntry(entry) ? entry.completed_at : null;
}

export function appendCompletedCheckEntries(
  value: unknown,
  checkKeys: string[],
  completedAt = new Date().toISOString(),
): CompletedCheckEntry[] {
  const entries = toCompletedCheckEntries(value, completedAt);
  const seen = new Set(entries.map((entry) => entry.check));

  for (const check of checkKeys) {
    if (seen.has(check)) continue;
    entries.push({ check, completed_at: completedAt });
    seen.add(check);
  }

  return entries;
}
