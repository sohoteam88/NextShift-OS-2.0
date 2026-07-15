import { describe, expect, it } from 'vitest';
import {
  applyPersistedContent,
  canSaveDraft,
  contentPatchPayload,
  isDraftDirty,
  toEditableContentDraft,
} from './contentDraftEditor';
import type { GeneratedPost } from './types';

const generatedPost: GeneratedPost = {
  id: 'content-1',
  pillar: '教育内容',
  pillarEmoji: '📚',
  title: 'Generated title',
  hook: 'Hook',
  body: 'Original generated body',
  cta: 'CTA',
  hashtags: [],
  platform: 'facebook',
  format: 'text_post',
  funnelStage: 'awareness',
  status: 'draft',
  qualityScore: 75,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
};

describe('content draft editor state', () => {
  it('hydrates the active editor with the canonical generated ID, title, and body', () => {
    expect(toEditableContentDraft(generatedPost)).toMatchObject({
      id: 'content-1',
      title: 'Generated title',
      body: 'Original generated body',
    });
  });

  it('marks an edited draft dirty and sends the current values in the PATCH payload', () => {
    const saved = toEditableContentDraft(generatedPost);
    const edited = { ...saved, title: 'Edited title', body: 'Edited current body' };

    expect(isDraftDirty(edited, saved)).toBe(true);
    expect(canSaveDraft(edited, true, false)).toBe(true);
    expect(contentPatchPayload(edited)).toEqual({
      content: 'Edited current body',
      title: 'Edited title',
      platform: 'facebook',
    });
  });

  it('uses the server-confirmed PATCH response as the new saved state', () => {
    const edited = { ...toEditableContentDraft(generatedPost), body: 'Edited current body' };
    const saved = applyPersistedContent(
      edited,
      {
        id: 'content-1',
        title: 'Generated title',
        body: 'Edited current body',
        platform: 'facebook',
        type: 'text_post',
        status: 'draft',
        createdAt: '2026-07-15T00:00:00.000Z',
      },
      '2026-07-15T00:02:00.000Z',
    );

    expect(isDraftDirty(saved, saved)).toBe(false);
    expect(saved.body).toBe('Edited current body');
    expect(saved.updatedAt).toBe('2026-07-15T00:02:00.000Z');
  });
});
