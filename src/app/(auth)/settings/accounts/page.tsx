'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Power, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Account = {
  id: string;
  platform: 'fb' | 'ig' | 'xiaohongshu' | 'tiktok';
  track: 'recruitment' | 'retail';
  name: string;
  url: string | null;
  enabled: boolean;
};

type ApiPayload<T> = {
  data?: T;
  error?: { message?: string };
};

type AccountForm = {
  name: string;
  url: string;
  platform: Account['platform'];
  track: Account['track'];
};

const INITIAL_FORM: AccountForm = {
  name: '',
  url: '',
  platform: 'fb',
  track: 'recruitment',
};

const PLATFORM_OPTIONS: Array<{ value: Account['platform']; label: string }> = [
  { value: 'fb', label: 'Facebook 专页' },
  { value: 'ig', label: 'Instagram' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'tiktok', label: 'TikTok' },
];

const PURPOSE_OPTIONS: Array<{ value: Account['track']; label: string; hint: string }> = [
  { value: 'recruitment', label: '分享我的开始', hint: '记录你正在学、正在做的过程。' },
  { value: 'retail', label: '分享健康日常', hint: '分享真实、慢慢建立的健康日常。' },
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json() as ApiPayload<T>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? '暂时无法完成，请稍后再试。');
  }

  return payload.data;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestJson<Account[]>('/api/v1/user-shell/accounts');
      setAccounts(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '暂时无法读取账号。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  function closeForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setIsFormOpen(false);
    setError(null);
  }

  function startCreate() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setError(null);
    setIsFormOpen(true);
  }

  function startEdit(account: Account) {
    setForm({
      name: account.name,
      url: account.url ?? '',
      platform: account.platform,
      track: account.track,
    });
    setEditingId(account.id);
    setError(null);
    setIsFormOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const account = editingId
        ? await requestJson<Account>(`/api/v1/user-shell/accounts/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, url: form.url || null }),
        })
        : await requestJson<Account>('/api/v1/user-shell/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

      setAccounts((current) => {
        const existingIndex = current.findIndex((item) => item.id === account.id);
        if (existingIndex === -1) return [...current, account];
        return current.map((item) => (item.id === account.id ? account : item));
      });
      closeForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '暂时无法保存，请稍后再试。');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleEnabled(account: Account) {
    setError(null);
    try {
      const updated = await requestJson<Account>(`/api/v1/user-shell/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !account.enabled }),
      });
      setAccounts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '暂时无法更新，请稍后再试。');
    }
  }

  const purposeHint = PURPOSE_OPTIONS.find((option) => option.value === form.track)?.hint;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-10 sm:px-6 sm:py-8">
      <Link
        href="/settings"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        回到设置
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">我的账号</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            这里只放你已经真实开好的账号。填好后，之后随时可以回来编辑或暂停使用。
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
          开一个账号
        </Button>
      </div>

      {error ? (
        <div className="mt-5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {isFormOpen ? (
        <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{editingId ? '编辑账号' : '把真实账号记下来'}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                先开好专页再填写；不用一次做到完美，我们一步一步来。
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭表单"
              onClick={closeForm}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form className="mt-5 space-y-5" onSubmit={submitForm}>
            {!editingId ? (
              <>
                <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="account-platform">
                  平台
                </label>
                <select
                  id="account-platform"
                  value={form.platform}
                  onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value as Account['platform'] }))}
                  className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {PLATFORM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>

                <fieldset>
                  <legend className="text-sm font-medium text-[var(--color-text)]">这个账号主要分享什么？</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {PURPOSE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-[var(--radius-md)] border p-3 text-sm transition-colors ${
                          form.track === option.value
                            ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="account-purpose"
                          value={option.value}
                          checked={form.track === option.value}
                          onChange={() => setForm((current) => ({ ...current, track: option.value }))}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{purposeHint}</p>
                </fieldset>
              </>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="account-name">号名</label>
              <input
                id="account-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                maxLength={120}
                placeholder="例如：你的名字｜正在走的路"
                className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">用真实、舒服的名字就好；不需要装成专家。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="account-url">专页链接（可选）</label>
              <input
                id="account-url"
                type="url"
                value={form.url}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://..."
                className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">Facebook 请填专页，不是个人账号。专页有数据，之后才看得到有人点进来。</p>
            </div>

            <div className="sticky bottom-0 -mx-5 border-t border-[var(--color-border)] bg-white px-5 pb-1 pt-4 sm:static sm:mx-0 sm:border-0 sm:px-0 sm:pb-0">
              <Button type="submit" loading={isSaving} className="w-full">
                {editingId ? '保存修改' : '保存这个账号'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="account-list-title">
        <h2 id="account-list-title" className="text-base font-semibold text-[var(--color-text)]">已记录的账号</h2>
        {isLoading ? <p className="mt-3 text-sm text-[var(--color-text-muted)]">正在读取你的账号…</p> : null}
        {!isLoading && accounts.length === 0 ? (
          <div className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-white p-6 text-center">
            <p className="text-base font-semibold text-[var(--color-text)]">还没有号？我们一步步来开第一个</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">先开一个 Facebook 专页，用一张清楚的日常照片当头像就够了。</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={startCreate}>开始记录</Button>
          </div>
        ) : null}
        {!isLoading && accounts.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {accounts.map((account) => (
              <li key={account.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--color-text)]">{account.name}</p>
                    {account.url ? <a className="mt-1 block truncate text-sm text-[var(--color-primary)] hover:underline" href={account.url} target="_blank" rel="noreferrer">{account.url}</a> : <p className="mt-1 text-sm text-[var(--color-text-muted)]">还没有放链接</p>}
                    <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)]">{account.enabled ? '正在使用' : '已暂停'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => startEdit(account)}>编辑</Button>
                    <Button type="button" variant="secondary" size="sm" icon={<Power className="h-3.5 w-3.5" />} onClick={() => void toggleEnabled(account)}>{account.enabled ? '暂停' : '启用'}</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
