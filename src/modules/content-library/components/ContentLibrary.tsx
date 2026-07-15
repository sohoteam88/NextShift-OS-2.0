'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CONTENT_RECORD_PATCH_PLATFORMS } from '@/lib/content-platforms';
import {
  fetchTelemetryUserId,
  trackContentCopied,
  trackContentDeleted,
  trackContentLoopCompleted,
  trackContentReopened,
  trackContentSaved,
} from '@/lib/telemetry/tracker';
import {
  CONTENT_LIBRARY_DEFAULT_LIMIT,
  CONTENT_LIBRARY_STATUSES,
  type ContentLibraryItem,
  type ContentLibraryListItem,
  type ContentLibraryListMeta,
  type ContentLibraryStatus,
} from '@/lib/content-library-contracts';
import {
  contentLibraryPatchPayload,
  isContentLibraryDraftDirty,
  reconcileContentLibrarySave,
  resolveContentLibraryViewState,
  toContentLibraryDraft,
  type ContentLibraryDraft,
} from '../contentLibraryState';
import { AccessibleDialog } from './AccessibleDialog';

type ListResponse = { data: ContentLibraryListItem[]; meta: ContentLibraryListMeta };
type ItemResponse = { data: ContentLibraryItem };
type PendingGuardAction = { kind: 'close' } | { kind: 'switch'; id: string };

class ContentLibraryRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ContentLibraryRequestError';
  }
}

async function responseMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    message?: string;
  };
  return payload.error?.message ?? payload.message ?? fallback;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new ContentLibraryRequestError(
      await responseMessage(response, '内容资料库暂时无法读取。'),
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

function telemetryProperties(item: Pick<ContentLibraryItem, 'id' | 'platform' | 'type'>) {
  return {
    contentId: item.id,
    platform: item.platform ?? 'unknown',
    contentType: item.type,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function ContentLibrary() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContentLibraryStatus | 'all'>('all');
  const [platform, setPlatform] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorDraft, setEditorDraft] = useState<ContentLibraryDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ContentLibraryDraft | null>(null);
  const [pendingGuard, setPendingGuard] = useState<PendingGuardAction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyError, setCopyError] = useState<string | null>(null);
  const hydratedItemRef = useRef<string | null>(null);
  const reopenedRef = useRef<string | null>(null);
  const savedInLibraryRef = useRef<string | null>(null);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(CONTENT_LIBRARY_DEFAULT_LIMIT),
  });
  if (status !== 'all') params.set('status', status);
  if (platform !== 'all') params.set('platform', platform);

  const listQuery = useQuery({
    queryKey: ['content-library', { page, status, platform }],
    queryFn: () => fetchJson<ListResponse>(`/api/v1/ai/content?${params.toString()}`),
    // Surface the first failure so the operator-controlled retry state is not
    // hidden behind React Query's automatic retry cycle.
    retry: false,
  });

  const itemQuery = useQuery({
    queryKey: ['content-library-item', selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => fetchJson<ItemResponse>(`/api/v1/ai/content/${selectedId}`),
    retry: false,
  });

  const telemetryUserQuery = useQuery({
    queryKey: ['telemetry-user-id'],
    queryFn: fetchTelemetryUserId,
    staleTime: 5 * 60_000,
  });

  const isDirty = isContentLibraryDraftDirty(editorDraft, savedDraft);

  useEffect(() => {
    const item = itemQuery.data?.data;
    if (!item || hydratedItemRef.current === item.id) return;
    const draft = toContentLibraryDraft(item);
    setEditorDraft(draft);
    setSavedDraft(draft);
    setCopyState('idle');
    setCopyError(null);
    savedInLibraryRef.current = null;
    hydratedItemRef.current = item.id;

    if (reopenedRef.current !== item.id && telemetryUserQuery.data) {
      reopenedRef.current = item.id;
      trackContentReopened(telemetryUserQuery.data, telemetryProperties(item));
    }
  }, [itemQuery.data, telemetryUserQuery.data]);

  useEffect(() => {
    const item = itemQuery.data?.data;
    if (!item || reopenedRef.current === item.id || !telemetryUserQuery.data) return;
    reopenedRef.current = item.id;
    trackContentReopened(telemetryUserQuery.data, telemetryProperties(item));
  }, [itemQuery.data, telemetryUserQuery.data]);

  const resetEditor = useCallback(() => {
    setSelectedId(null);
    setEditorDraft(null);
    setSavedDraft(null);
    setDeleteOpen(false);
    setCopyState('idle');
    setCopyError(null);
    hydratedItemRef.current = null;
    reopenedRef.current = null;
    savedInLibraryRef.current = null;
  }, []);

  function openRecord(id: string) {
    if (selectedId === id) return;
    if (isDirty) {
      setPendingGuard({ kind: 'switch', id });
      return;
    }
    hydratedItemRef.current = null;
    reopenedRef.current = null;
    setEditorDraft(null);
    setSavedDraft(null);
    setSelectedId(id);
  }

  function requestCloseEditor() {
    if (isDirty) {
      setPendingGuard({ kind: 'close' });
      return;
    }
    resetEditor();
  }

  function discardAndContinue() {
    const action = pendingGuard;
    setPendingGuard(null);
    if (!action) return;
    if (action.kind === 'close') {
      resetEditor();
      return;
    }
    hydratedItemRef.current = null;
    reopenedRef.current = null;
    setEditorDraft(null);
    setSavedDraft(null);
    setSelectedId(action.id);
  }

  const saveMutation = useMutation({
    mutationFn: async (submitted: ContentLibraryDraft) => {
      const response = await fetchJson<ItemResponse>(`/api/v1/ai/content/${submitted.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentLibraryPatchPayload(submitted)),
      });
      return { submitted, persisted: toContentLibraryDraft(response.data) };
    },
    onSuccess: ({ submitted, persisted }) => {
      setSavedDraft(persisted);
      setEditorDraft((current) => reconcileContentLibrarySave(current, submitted, persisted));
      savedInLibraryRef.current = persisted.id;
      setCopyState('idle');
      const userId = telemetryUserQuery.data;
      if (userId) trackContentSaved(userId, telemetryProperties(persisted));
      void queryClient.invalidateQueries({ queryKey: ['content-library'] });
      void queryClient.invalidateQueries({ queryKey: ['content-engine'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: ContentLibraryDraft) => {
      await fetchJson<{ data: { id: string; deleted: boolean } }>(
        `/api/v1/ai/content/${item.id}`,
        { method: 'DELETE' },
      );
      return item;
    },
    onSuccess: (item) => {
      const userId = telemetryUserQuery.data;
      if (userId) trackContentDeleted(userId, telemetryProperties(item));
      void queryClient.invalidateQueries({ queryKey: ['content-library'] });
      void queryClient.invalidateQueries({ queryKey: ['content-engine'] });
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      resetEditor();
    },
  });

  async function copyCurrentBody() {
    if (!editorDraft?.body.trim()) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('此浏览器不支持复制。');
      await navigator.clipboard.writeText(editorDraft.body);
      setCopyState('success');
      setCopyError(null);
      const userId = telemetryUserQuery.data;
      if (userId) {
        const properties = telemetryProperties(editorDraft);
        trackContentCopied(userId, properties);
        if (savedInLibraryRef.current === editorDraft.id && !isDirty) {
          trackContentLoopCompleted(userId, properties);
        }
      }
    } catch (error) {
      setCopyState('error');
      setCopyError(error instanceof Error ? error.message : '复制失败，请重试。');
    }
  }

  const items = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;
  const errorStatus = listQuery.error instanceof ContentLibraryRequestError
    ? listQuery.error.status
    : undefined;
  const viewState = resolveContentLibraryViewState({
    loading: listQuery.isLoading,
    hasError: listQuery.isError,
    errorStatus,
    itemCount: items.length,
  });

  return (
    <section aria-labelledby="content-library-title" className="mx-auto mt-8 max-w-5xl pb-12">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Content Library
              </p>
              <h2 id="content-library-title" className="mt-1 text-2xl font-bold text-[var(--color-text)]">
                内容资料库
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                重新打开、编辑、复制或删除你已经保存的 canonical Content 草稿。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                状态
                <select
                  aria-label="按状态筛选内容"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as ContentLibraryStatus | 'all');
                    setPage(1);
                  }}
                  className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <option value="all">全部状态</option>
                  {CONTENT_LIBRARY_STATUSES.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--color-text)]">
                平台
                <select
                  aria-label="按平台筛选内容"
                  value={platform}
                  onChange={(event) => {
                    setPlatform(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <option value="all">全部平台</option>
                  {CONTENT_RECORD_PATCH_PLATFORMS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div aria-live="polite" aria-busy={viewState === 'loading'} className="p-5 sm:p-6">
          {viewState === 'loading' ? <LibraryLoading /> : null}
          {viewState === 'permission_denied' ? (
            <LibraryMessage
              icon={<AlertCircle className="h-6 w-6" aria-hidden="true" />}
              title="没有权限读取内容资料库"
              body="请确认你仍属于这个 workspace，或联系管理员检查账号权限。"
              action={<Button variant="secondary" onClick={() => listQuery.refetch()}>重试</Button>}
            />
          ) : null}
          {viewState === 'server_error' ? (
            <LibraryMessage
              icon={<AlertCircle className="h-6 w-6" aria-hidden="true" />}
              title="内容资料库暂时无法读取"
              body={listQuery.error instanceof Error ? listQuery.error.message : '服务器发生错误，请稍后重试。'}
              action={<Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={() => listQuery.refetch()}>重试</Button>}
            />
          ) : null}
          {viewState === 'empty' ? (
            <LibraryMessage
              icon={<FileText className="h-6 w-6" aria-hidden="true" />}
              title={status === 'all' && platform === 'all' ? '还没有保存的内容' : '没有符合筛选条件的内容'}
              body={status === 'all' && platform === 'all'
                ? '在上方 Content Engine 生成并保存第一份草稿，它会自动出现在这里。'
                : '调整状态或平台筛选后再试。'}
            />
          ) : null}
          {viewState === 'ready' ? (
            <div className="space-y-4">
              <ul className="grid gap-3 md:grid-cols-2" aria-label="已保存内容列表">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openRecord(item.id)}
                      className="h-full min-h-44 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      aria-label={`打开 ${item.displayTitle}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold text-[var(--color-text)]">{item.displayTitle}</h3>
                        <Badge variant={item.status === 'published' ? 'success' : 'info'}>{item.status}</Badge>
                      </div>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        {item.platform ?? 'unknown'} · {item.type}
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">
                        {item.preview || '（没有正文预览）'}
                      </p>
                      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                        更新于 {formatDate(item.updatedAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  第 {meta?.page ?? page} / {Math.max(meta?.totalPages ?? 1, 1)} 页，共 {meta?.total ?? items.length} 项
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    icon={<ChevronLeft className="h-4 w-4" />}
                    disabled={page <= 1 || listQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<ChevronRight className="h-4 w-4" />}
                    disabled={!meta || page >= meta.totalPages || listQuery.isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AccessibleDialog
        open={Boolean(selectedId) && !pendingGuard && !deleteOpen}
        title={savedDraft?.title?.trim() || '编辑内容'}
        description={savedDraft ? `${savedDraft.platform ?? 'unknown'} · ${savedDraft.type} · ${savedDraft.status}` : '读取最新保存内容'}
        onRequestClose={requestCloseEditor}
      >
        {itemQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 p-6 text-sm text-[var(--color-text-muted)]" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> 正在读取完整内容…
          </div>
        ) : itemQuery.isError ? (
          <div className="p-6">
            <LibraryMessage
              icon={<AlertCircle className="h-6 w-6" aria-hidden="true" />}
              title={itemQuery.error instanceof ContentLibraryRequestError && [401, 403, 404].includes(itemQuery.error.status)
                ? '无法打开这项内容'
                : '读取内容失败'}
              body={itemQuery.error instanceof Error ? itemQuery.error.message : '请稍后重试。'}
              action={<Button variant="secondary" onClick={() => itemQuery.refetch()}>重试</Button>}
            />
          </div>
        ) : editorDraft ? (
          <div className="space-y-5 p-5 sm:p-6">
            {items.length > 1 ? (
              <label className="block text-sm font-medium text-[var(--color-text)]">
                切换内容
                <select
                  aria-label="切换到其他内容"
                  value={selectedId ?? ''}
                  onChange={(event) => openRecord(event.target.value)}
                  className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.displayTitle}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-medium text-[var(--color-text)]">
                标题
                <input
                  aria-label="标题"
                  value={editorDraft.title ?? ''}
                  maxLength={200}
                  onChange={(event) => {
                    setEditorDraft({ ...editorDraft, title: event.target.value });
                    setCopyState('idle');
                  }}
                  className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                />
              </label>
              <div className="text-xs text-[var(--color-text-muted)]">创建：{formatDate(editorDraft.createdAt)}</div>
              <div className="text-xs text-[var(--color-text-muted)] sm:text-right">更新：{formatDate(editorDraft.updatedAt)}</div>
            </div>
            <label className="block text-sm font-medium text-[var(--color-text)]">
              正文
              <textarea
                aria-label="正文"
                value={editorDraft.body}
                maxLength={20_000}
                rows={13}
                onChange={(event) => {
                  setEditorDraft({ ...editorDraft, body: event.target.value });
                  setCopyState('idle');
                }}
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              />
            </label>

            <div aria-live="polite" className="min-h-6 text-sm">
              {isDirty ? <span className="font-medium text-amber-700">有未保存的修改</span> : null}
              {saveMutation.isSuccess && !isDirty ? <span className="font-medium text-emerald-700">已保存</span> : null}
              {saveMutation.isError ? <span className="text-red-700">{saveMutation.error.message} 你的编辑仍保留，可重试。</span> : null}
              {copyState === 'success' ? <span className="font-medium text-emerald-700">已复制当前正文</span> : null}
              {copyState === 'error' ? <span className="text-red-700">{copyError}</span> : null}
            </div>

            <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-[var(--color-border)] bg-white px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:px-0 sm:pb-0">
              <Button
                variant="danger"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setDeleteOpen(true)}
              >
                删除
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  icon={copyState === 'success' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  onClick={copyCurrentBody}
                  disabled={!editorDraft.body.trim()}
                >
                  复制正文
                </Button>
                <Button
                  icon={<Save className="h-4 w-4" />}
                  loading={saveMutation.isPending}
                  disabled={
                    !isDirty ||
                    (editorDraft.title !== null && !editorDraft.title.trim()) ||
                    !editorDraft.body.trim()
                  }
                  onClick={() => saveMutation.mutate(editorDraft)}
                >
                  保存同一草稿
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </AccessibleDialog>

      <AccessibleDialog
        open={Boolean(pendingGuard)}
        title="舍弃未保存的修改？"
        description="继续后，这次尚未保存的标题和正文修改会丢失。"
        onRequestClose={() => setPendingGuard(null)}
        className="max-w-md"
      >
        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setPendingGuard(null)}>继续编辑</Button>
          <Button variant="danger" onClick={discardAndContinue}>舍弃并继续</Button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog
        open={deleteOpen}
        title="确认删除这项内容？"
        description={isDirty ? '这项内容还有未保存修改；删除后记录与这些修改都会消失。' : '删除后，这项 Content 记录会从资料库移除。'}
        onRequestClose={() => {
          if (!deleteMutation.isPending) setDeleteOpen(false);
        }}
        className="max-w-md"
      >
        <div className="space-y-4 p-5">
          {deleteMutation.isError ? (
            <p role="alert" className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm text-red-700">
              {deleteMutation.error.message} 内容仍保留，可重试。
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={deleteMutation.isPending} onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => editorDraft && deleteMutation.mutate(editorDraft)}
            >
              确认删除
            </Button>
          </div>
        </div>
      </AccessibleDialog>
    </section>
  );
}

function LibraryLoading() {
  return (
    <div className="grid gap-3 md:grid-cols-2" role="status">
      <span className="sr-only">正在加载内容资料库</span>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-44 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface)]" />
      ))}
    </div>
  );
}

function LibraryMessage({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-center">
      <div className="text-[var(--color-text-muted)]">{icon}</div>
      <h3 className="mt-3 font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--color-text-muted)]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
