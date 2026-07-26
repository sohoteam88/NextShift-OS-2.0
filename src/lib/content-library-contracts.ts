import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  CONTENT_RECORD_PATCH_PLATFORMS,
} from '@/lib/content-platforms';
import {
  CONTENT_LIBRARY_DEFAULT_LIMIT,
  CONTENT_LIBRARY_MAX_LIMIT,
  CONTENT_LIBRARY_PREVIEW_LENGTH,
  CONTENT_LIBRARY_STATUSES,
  type ContentLibraryListQuery,
} from './content-library-shared';

export {
  CONTENT_LIBRARY_DEFAULT_LIMIT,
  CONTENT_LIBRARY_MAX_LIMIT,
  CONTENT_LIBRARY_PREVIEW_LENGTH,
  CONTENT_LIBRARY_STATUSES,
  type ContentLibraryItem,
  type ContentLibraryListItem,
  type ContentLibraryListMeta,
  type ContentLibraryListQuery,
  type ContentLibraryStatus,
} from './content-library-shared';

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(CONTENT_LIBRARY_MAX_LIMIT)
    .default(CONTENT_LIBRARY_DEFAULT_LIMIT),
  status: z.enum(CONTENT_LIBRARY_STATUSES).optional(),
  platform: z.enum(CONTENT_RECORD_PATCH_PLATFORMS).optional(),
}).strict();

export function parseContentLibraryQuery(searchParams: URLSearchParams): ContentLibraryListQuery {
  const values: Record<string, string> = {};

  for (const key of searchParams.keys()) {
    const all = searchParams.getAll(key);
    if (all.length !== 1) {
      throw new z.ZodError([{
        code: 'custom',
        path: [key],
        message: `Query parameter ${key} must appear once`,
      }]);
    }
    values[key] = all[0] ?? '';
  }

  return ListQuerySchema.parse(values);
}

export function contentDisplayTitle(title: string | null, type: string, id: string) {
  const normalized = title?.trim();
  return normalized || `${type || 'content'} · ${id.slice(0, 8)}`;
}

export function contentBodyPreview(body: string) {
  const normalized = body.replace(/\s+/g, ' ').trim();
  if (normalized.length <= CONTENT_LIBRARY_PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, CONTENT_LIBRARY_PREVIEW_LENGTH - 1)}…`;
}

/**
 * Produces the canonical, runtime-only identity used for draft hygiene.
 * Whitespace-only edits are intentionally treated as the same content.
 */
export function contentHash(title: string | null, body: string): string {
  const normalizedTitle = normalizeContentHashPart(title ?? '');
  const normalizedBody = normalizeContentHashPart(body);
  return createHash('sha256')
    .update(`${normalizedTitle}\u001f${normalizedBody}`, 'utf8')
    .digest('hex');
}

function normalizeContentHashPart(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
