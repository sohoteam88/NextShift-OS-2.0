import { describe, expect, it } from 'vitest';
import {
  findDuplicateDraftGroups,
  summarizeDuplicateDraftGroups,
  type ContentDraftForHygiene,
} from './dedup-content-drafts';

function draft(overrides: Partial<ContentDraftForHygiene> = {}): ContentDraftForHygiene {
  return {
    id: 'draft-1',
    ownerId: 'owner-1',
    platform: 'facebook',
    type: 'text_post',
    title: 'Same title',
    body: 'Same body',
    status: 'draft',
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('content draft hygiene grouping', () => {
  it('keeps only the newest duplicate draft and reports dry-run totals', () => {
    const records = [
      draft({
        id: 'old-draft',
        updatedAt: new Date('2026-07-01T00:00:00.000Z'),
      }),
      draft({
        id: 'new-draft',
        updatedAt: new Date('2026-07-02T00:00:00.000Z'),
      }),
    ];

    const groups = findDuplicateDraftGroups(records);

    expect(groups).toEqual([
      expect.objectContaining({
        retainedId: 'new-draft',
        deleteIds: ['old-draft'],
      }),
    ]);
    expect(summarizeDuplicateDraftGroups(records, groups)).toEqual({
      scanned: 2,
      duplicateGroups: 1,
      pendingDeletion: 1,
    });
  });

  it('never groups published content for deletion', () => {
    const records = [
      draft({ id: 'draft-copy' }),
      draft({ id: 'published-copy', status: 'published' }),
    ];

    expect(findDuplicateDraftGroups(records)).toEqual([]);
  });
});
