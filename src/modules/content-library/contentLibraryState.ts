import type { ContentLibraryItem } from '@/lib/content-library-contracts';

export type ContentLibraryDraft = Pick<
  ContentLibraryItem,
  'id' | 'title' | 'body' | 'platform' | 'type' | 'status' | 'createdAt' | 'updatedAt'
>;

export type ContentLibraryViewState =
  | 'loading'
  | 'permission_denied'
  | 'server_error'
  | 'empty'
  | 'ready';

export type ContentLibraryEditorSession = {
  token: number;
  contentId: string;
};

export function ownsContentLibraryEditorSession(
  current: ContentLibraryEditorSession | null,
  expected: ContentLibraryEditorSession,
) {
  return current?.token === expected.token && current.contentId === expected.contentId;
}

export function toContentLibraryDraft(item: ContentLibraryItem): ContentLibraryDraft {
  return { ...item };
}

export function isContentLibraryDraftDirty(
  draft: ContentLibraryDraft | null,
  saved: ContentLibraryDraft | null,
) {
  return Boolean(
    draft &&
      saved &&
      (draft.id !== saved.id || draft.title !== saved.title || draft.body !== saved.body),
  );
}

export function contentLibraryPatchPayload(draft: ContentLibraryDraft) {
  return {
    title: draft.title?.trim() || undefined,
    content: draft.body,
  };
}

export function reconcileContentLibrarySave(
  current: ContentLibraryDraft | null,
  submitted: ContentLibraryDraft,
  persisted: ContentLibraryDraft,
) {
  if (!current) return current;
  if (
    current.id === submitted.id &&
    current.title === submitted.title &&
    current.body === submitted.body
  ) {
    return persisted;
  }
  return current;
}

export function resolveContentLibraryViewState(input: {
  loading: boolean;
  errorStatus?: number;
  hasError: boolean;
  itemCount: number;
}): ContentLibraryViewState {
  if (input.loading) return 'loading';
  if (input.hasError && (input.errorStatus === 401 || input.errorStatus === 403)) {
    return 'permission_denied';
  }
  if (input.hasError) return 'server_error';
  if (input.itemCount === 0) return 'empty';
  return 'ready';
}
