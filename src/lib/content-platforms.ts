/**
 * Platform identifiers already persisted by the shared Prisma Content record.
 *
 * This compatibility boundary is intentionally broader than any individual
 * generator or editor selector. Keep both `xhs` and `xiaohongshu`: existing
 * Content producers use each spelling, and PATCH must remain able to update
 * those canonical records without accepting arbitrary strings.
 */
export const CONTENT_RECORD_PATCH_PLATFORMS = [
  'facebook',
  'instagram',
  'tiktok',
  'xhs',
  'xiaohongshu',
  'whatsapp',
  'threads',
  'email',
  'blog',
] as const;

export type ContentRecordPatchPlatform =
  (typeof CONTENT_RECORD_PATCH_PLATFORMS)[number];
