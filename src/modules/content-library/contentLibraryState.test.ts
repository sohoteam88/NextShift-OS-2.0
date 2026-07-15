import { describe, expect, it } from 'vitest';
import {
  contentLibraryPatchPayload,
  isContentLibraryDraftDirty,
  reconcileContentLibrarySave,
  resolveContentLibraryViewState,
  toContentLibraryDraft,
} from './contentLibraryState';

const item = {
  id: 'content-1',
  title: 'Saved title',
  body: 'Saved body',
  platform: 'facebook',
  type: 'text_post',
  status: 'draft',
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T01:00:00.000Z',
};

describe('Content Library editor state', () => {
  it('marks title/body edits dirty and PATCHes the same canonical ID values', () => {
    const saved = toContentLibraryDraft(item);
    const edited = { ...saved, title: 'Edited title', body: 'Edited body' };

    expect(isContentLibraryDraftDirty(edited, saved)).toBe(true);
    expect(contentLibraryPatchPayload(edited)).toEqual({
      title: 'Edited title',
      content: 'Edited body',
    });
    expect(edited.id).toBe(saved.id);
  });

  it('keeps newer local edits when a save response finishes', () => {
    const submitted = { ...item, body: 'Submitted body' };
    const newer = { ...submitted, body: 'Typed while saving' };
    const persisted = { ...submitted, updatedAt: '2026-07-15T02:00:00.000Z' };

    expect(reconcileContentLibrarySave(newer, submitted, persisted)).toEqual(newer);
    expect(isContentLibraryDraftDirty(newer, persisted)).toBe(true);
  });

  it('accepts the persisted snapshot when no newer edit exists', () => {
    const submitted = { ...item, body: 'Submitted body' };
    const persisted = { ...submitted, updatedAt: '2026-07-15T02:00:00.000Z' };

    expect(reconcileContentLibrarySave(submitted, submitted, persisted)).toEqual(persisted);
  });

  it.each([
    ['loading', { loading: true, hasError: false, itemCount: 0 }],
    ['permission_denied', { loading: false, hasError: true, errorStatus: 403, itemCount: 0 }],
    ['server_error', { loading: false, hasError: true, errorStatus: 500, itemCount: 0 }],
    ['empty', { loading: false, hasError: false, itemCount: 0 }],
    ['ready', { loading: false, hasError: false, itemCount: 1 }],
  ] as const)('resolves the distinct %s view state', (expected, input) => {
    expect(resolveContentLibraryViewState(input)).toBe(expected);
  });
});
