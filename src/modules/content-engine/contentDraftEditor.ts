import {
  CONTENT_ENGINE_PLATFORMS,
  type ContentFormat,
  type ContentStatus,
  type GeneratedPost,
  type Platform,
} from './types';

export type EditableContentDraft = Pick<
  GeneratedPost,
  'id' | 'title' | 'body' | 'platform' | 'format' | 'status' | 'createdAt' | 'updatedAt'
>;

export type ContentEditStartedProperties = {
  contentId: string;
  platform: Platform;
  contentType: ContentFormat;
};

type PersistedContent = {
  id: string;
  title: string | null;
  body: string;
  platform: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
    updatedAt: content.updatedAt,
  };
}

/**
 * Reconcile a completed save without replacing edits made while the PATCH was
 * in flight. The server-confirmed value always becomes the saved baseline, but
 * it only replaces the editor when the editor still matches the submitted
 * snapshot exactly.
 */
export function reconcilePersistedEditorDraft(
  currentDraft: EditableContentDraft | null,
  submittedDraft: EditableContentDraft,
  persistedDraft: EditableContentDraft,
): EditableContentDraft | null {
  return draftsMatch(currentDraft, submittedDraft) ? persistedDraft : currentDraft;
}

/**
 * Returns telemetry properties only when a canonical content ID starts a new
 * editing session. Repeated keystrokes for the same loaded draft return null.
 */
export function contentEditStartedProperties(
  activeSessionContentId: string | null,
  draft: EditableContentDraft,
): ContentEditStartedProperties | null {
  if (activeSessionContentId === draft.id) return null;

  return {
    contentId: draft.id,
    platform: draft.platform,
    contentType: draft.format,
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

function draftsMatch(
  left: EditableContentDraft | null,
  right: EditableContentDraft,
) {
  return Boolean(
    left &&
      left.id === right.id &&
      left.title === right.title &&
      left.body === right.body &&
      left.platform === right.platform &&
      left.format === right.format &&
      left.status === right.status &&
      left.createdAt === right.createdAt &&
      left.updatedAt === right.updatedAt,
  );
}

function isPlatform(value: string | null): value is Platform {
  return CONTENT_ENGINE_PLATFORMS.some((platform) => platform === value);
}

function isContentFormat(value: string): value is ContentFormat {
  return ['text_post', 'carousel', 'reel', 'short_video', 'story', 'email', 'blog'].includes(value);
}

function isContentStatus(value: string): value is ContentStatus {
  return ['draft', 'generated', 'copied', 'published'].includes(value);
}
