import type { ContentRecordPatchPlatform } from '@/lib/content-platforms';

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
  contentHash: string;
  isDuplicate: boolean;
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
