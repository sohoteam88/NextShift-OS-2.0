import { describe, expect, it } from 'vitest';
import {
  applyPersistedContent,
  canSaveDraft,
  contentEditStartedProperties,
  contentPatchPayload,
  isDraftDirty,
  reconcilePersistedEditorDraft,
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

  it('keeps newer local edits when an earlier save finishes', () => {
    const submitted = {
      ...toEditableContentDraft(generatedPost),
      title: 'Submitted title',
      body: 'Submitted body',
    };
    const newerEditor = { ...submitted, body: 'Typed while saving' };
    const saved = applyPersistedContent(
      submitted,
      {
        id: 'content-1',
        title: 'Submitted title',
        body: 'Submitted body',
        platform: 'facebook',
        type: 'text_post',
        status: 'draft',
        createdAt: '2026-07-15T00:00:00.000Z',
      },
      '2026-07-15T00:02:00.000Z',
    );

    const editor = reconcilePersistedEditorDraft(newerEditor, submitted, saved);

    expect(editor).toEqual(newerEditor);
    expect(isDraftDirty(editor, saved)).toBe(true);
  });

  it('replaces an unchanged submitted snapshot with the server-confirmed draft', () => {
    const submitted = {
      ...toEditableContentDraft(generatedPost),
      body: 'Submitted body',
    };
    const saved = applyPersistedContent(
      submitted,
      {
        id: 'content-1',
        title: 'Server-normalized title',
        body: 'Submitted body',
        platform: 'facebook',
        type: 'text_post',
        status: 'draft',
        createdAt: '2026-07-15T00:00:00.000Z',
      },
      '2026-07-15T00:02:00.000Z',
    );

    expect(reconcilePersistedEditorDraft(submitted, submitted, saved)).toEqual(saved);
  });

  it('reports content_edit_started once per canonical editing session', () => {
    const firstDraft = toEditableContentDraft(generatedPost);
    const firstEvent = contentEditStartedProperties(null, firstDraft);

    expect(firstEvent).toEqual({
      contentId: 'content-1',
      platform: 'facebook',
      contentType: 'text_post',
    });
    expect(contentEditStartedProperties(firstEvent?.contentId ?? null, firstDraft)).toBeNull();
    expect(
      contentEditStartedProperties(firstEvent?.contentId ?? null, {
        ...firstDraft,
        id: 'content-2',
      }),
    ).toMatchObject({ contentId: 'content-2' });
  });
});
