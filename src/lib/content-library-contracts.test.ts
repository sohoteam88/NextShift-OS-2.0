import { describe, expect, it } from 'vitest';
import {
  CONTENT_LIBRARY_PREVIEW_LENGTH,
  contentBodyPreview,
  contentDisplayTitle,
  parseContentLibraryQuery,
} from './content-library-contracts';

describe('Content Library contracts', () => {
  it('parses bounded pagination and allowlisted filters', () => {
    expect(parseContentLibraryQuery(new URLSearchParams('page=2&limit=50&status=published&platform=whatsapp')))
      .toEqual({ page: 2, limit: 50, status: 'published', platform: 'whatsapp' });
  });

  it('creates deterministic fallback titles without exposing body text', () => {
    expect(contentDisplayTitle(null, 'text_post', 'abcdef123456')).toBe('text_post · abcdef12');
    expect(contentDisplayTitle('  Named content  ', 'text_post', 'abcdef123456')).toBe('Named content');
  });

  it('normalizes and bounds list previews', () => {
    const preview = contentBodyPreview(`  ${'a'.repeat(CONTENT_LIBRARY_PREVIEW_LENGTH + 20)}\n`);
    expect(preview).toHaveLength(CONTENT_LIBRARY_PREVIEW_LENGTH);
    expect(preview.endsWith('…')).toBe(true);
    expect(contentBodyPreview('line one\n line two')).toBe('line one line two');
  });
});
