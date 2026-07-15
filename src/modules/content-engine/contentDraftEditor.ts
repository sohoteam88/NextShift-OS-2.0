import type { ContentFormat, ContentStatus, GeneratedPost, Platform } from './types';

export type EditableContentDraft = Pick<
  GeneratedPost,
  'id' | 'title' | 'body' | 'platform' | 'format' | 'status' | 'createdAt' | 'updatedAt'
>;

type PersistedContent = {
  id: string;
  title: string | null;
  body: string;
  platform: string | null;
  type: string;
  status: string;
  createdAt: string;
};

export function toEditableContentDraft(post: GeneratedPost): EditableContentDraft {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    platform: post.platform,
    format: post.format,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function applyPersistedContent(
  draft: EditableContentDraft,
  content: PersistedContent,
  savedAt: string,
): EditableContentDraft {
  return {
    ...draft,
    id: content.id,
    title: content.title ?? '',
    body: content.body,
    platform: isPlatform(content.platform) ? content.platform : draft.platform,
    format: isContentFormat(content.type) ? content.type : draft.format,
    status: isContentStatus(content.status) ? content.status : draft.status,
    createdAt: content.createdAt,
    // The canonical model currently has no updatedAt column. Use the time the
    // server confirmed this PATCH for the editor's visible saved state.
    updatedAt: savedAt,
  };
}

export function isDraftDirty(
  draft: EditableContentDraft | null,
  savedDraft: EditableContentDraft | null,
) {
  return Boolean(
    draft &&
      savedDraft &&
      (draft.id !== savedDraft.id ||
        draft.title !== savedDraft.title ||
        draft.body !== savedDraft.body ||
        draft.platform !== savedDraft.platform),
  );
}

export function canSaveDraft(
  draft: EditableContentDraft | null,
  isDirty: boolean,
  isSaving: boolean,
) {
  return Boolean(
    draft?.id &&
      draft.title.trim() &&
      draft.body.trim() &&
      isDirty &&
      !isSaving,
  );
}

export function contentPatchPayload(draft: EditableContentDraft) {
  return {
    content: draft.body,
    title: draft.title,
    platform: draft.platform,
  };
}

function isPlatform(value: string | null): value is Platform {
  return Boolean(value && ['facebook', 'instagram', 'tiktok', 'xhs', 'threads', 'email', 'blog'].includes(value));
}

function isContentFormat(value: string): value is ContentFormat {
  return ['text_post', 'carousel', 'reel', 'short_video', 'story', 'email', 'blog'].includes(value);
}

function isContentStatus(value: string): value is ContentStatus {
  return ['draft', 'generated', 'copied', 'published'].includes(value);
}
