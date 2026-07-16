import { z } from 'zod';
import {
  CONTENT_RECORD_PATCH_PLATFORMS,
  type ContentRecordPatchPlatform,
} from '@/lib/content-platforms';

export const CONTENT_LIBRARY_STATUSES = ['draft', 'published'] as const;
export const CONTENT_LIBRARY_DEFAULT_LIMIT = 10;
export const CONTENT_LIBRARY_MAX_LIMIT = 50;
export const CONTENT_LIBRARY_PREVIEW_LENGTH = 180;

export type ContentLibraryStatus = (typeof CONTENT_LIBRARY_STATUSES)[number];

export type ContentLibraryListItem = {
  id: string;
  title: string | null;
  displayTitle: string;
  platform: string | null;
  type: string;
  status: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentLibraryItem = {
  id: string;
  title: string | null;
  body: string;
  platform: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentLibraryListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ContentLibraryListQuery = {
  page: number;
  limit: number;
  status?: ContentLibraryStatus;
  platform?: ContentRecordPatchPlatform;
};

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
