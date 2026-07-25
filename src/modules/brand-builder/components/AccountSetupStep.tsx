'use client';

import * as React from 'react';
import { Check, Copy, ExternalLink, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { triggerMissionCelebrationFromResponse } from '@/stores/mission-celebration-store';
import type { UsernameOption } from '../services/username-service';
import type { BioSet } from '../services/bio-service';
import { JustInTimeFieldPrompt } from './JustInTimeFieldPrompt';

type BrandProfile = Record<string, unknown>;

type Props = {
  brandProfile: BrandProfile;
  onSave: (updates: Record<string, unknown>) => void;
};

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
];

const CHAR_LIMITS: Record<string, number> = { facebook: 200, instagram: 150, tiktok: 80 };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : '复制'}
    </button>
  );
}

export function AccountSetupStep({ brandProfile, onSave }: Props) {
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>(['facebook', 'instagram']);
  const [usernameOptions, setUsernameOptions] = React.useState<UsernameOption[]>([]);
  const [selectedUsername, setSelectedUsername] = React.useState<string>('');
  const [customUsername, setCustomUsername] = React.useState('');
  const [bios, setBios] = React.useState<Partial<BioSet>>({});
  const [editingBio, setEditingBio] = React.useState<Record<string, string>>({});
  const [regenInstruction, setRegenInstruction] = React.useState<Record<string, string>>({});
  const [loadingUsernames, setLoadingUsernames] = React.useState(false);
  const [loadingBios, setLoadingBios] = React.useState(false);
  const [loadingRegenBio, setLoadingRegenBio] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [shownUsernames, setShownUsernames] = React.useState<string[]>([]);
  const [avatarCompleted, setAvatarCompleted] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(() => String(brandProfile.avatarUrl ?? ''));
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void generateUsernames();
    void generateBios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateUsernames() {
    setLoadingUsernames(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/brand-builder/username/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_profile: brandProfile }),
      });
      const json = (await res.json()) as { data: UsernameOption[] };
      setUsernameOptions(json.data);
      setShownUsernames(json.data.map((o) => o.username));
      if (json.data[0]) setSelectedUsername(json.data[0].username);
    } catch {
      setError('用户名生成失败，请重试');
    } finally {
      setLoadingUsernames(false);
    }
  }

  async function regenerateUsernames() {
    setLoadingUsernames(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/brand-builder/username/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded: shownUsernames, brand_profile: brandProfile }),
      });
      const json = (await res.json()) as { data: UsernameOption[] };
      setUsernameOptions(json.data);
      setShownUsernames((prev) => [...prev, ...json.data.map((o) => o.username)]);
      if (json.data[0]) setSelectedUsername(json.data[0].username);
    } catch {
      setError('重新生成失败，请重试');
    } finally {
      setLoadingUsernames(false);
    }
  }

  async function generateBios() {
    setLoadingBios(true);
    try {
      const res = await fetch('/api/v1/brand-builder/bio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_profile: brandProfile }),
      });
      const json = (await res.json()) as { data: BioSet };
      setBios(json.data);
    } catch {
      // silently fail; user can still type manually
    } finally {
      setLoadingBios(false);
    }
  }

  async function regenerateSingleBio(platform: string) {
    setLoadingRegenBio(platform);
    try {
      const res = await fetch('/api/v1/brand-builder/bio/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          instruction: regenInstruction[platform] || undefined,
          brand_profile: brandProfile,
        }),
      });
      const json = (await res.json()) as { data: Record<string, string> };
      setBios((prev) => ({ ...prev, [platform]: json.data[platform] ?? '' }));
      setRegenInstruction((prev) => ({ ...prev, [platform]: '' }));
    } catch {
      setError('重新生成失败，请重试');
    } finally {
      setLoadingRegenBio(null);
    }
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function getBioValue(platform: string): string {
    return editingBio[platform] ?? (bios as Record<string, string>)[platform] ?? '';
  }

  async function handleSave() {
    setSaving(true);
    const finalBios: Record<string, string> = {};
    for (const p of selectedPlatforms) {
      const v = getBioValue(p);
      if (v) finalBios[p] = v;
    }

    const updates = {
      platforms: selectedPlatforms,
      username: customUsername.trim() || selectedUsername,
      bios: finalBios,
      ...(avatarCompleted ? { avatar_completed: true } : {}),
    };

    try {
      const res = await fetch('/api/v1/brand-builder/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json().catch(() => null);
      triggerMissionCelebrationFromResponse(json);
      onSave(updates);
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  const sectionClass = 'space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm';
  const labelClass = 'text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">社交资料设置</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          选择主要平台，准备用户名、Bio、头像和封面方向。内容引擎和漏斗 CTA 会优先使用这里的资料。
        </p>
      </div>

      {/* Platform selector */}
      <div className={sectionClass}>
        <p className={labelClass}>选择平台</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                selectedPlatforms.includes(p.id)
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
              )}
            >
              {selectedPlatforms.includes(p.id) && <Check className="mr-1 inline h-3.5 w-3.5" />}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Username */}
      <div className={sectionClass}>
        <p className={labelClass}>社交用户名</p>

        {loadingUsernames ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            AI 正在生成用户名...
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {usernameOptions.map((opt) => (
              <label
                key={opt.username}
                className={cn(
                  'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                  selectedUsername === opt.username ? 'bg-blue-50' : 'hover:bg-[var(--color-surface)]',
                )}
              >
                <input
                  type="radio"
                  name="username"
                  value={opt.username}
                  checked={selectedUsername === opt.username}
                  onChange={() => setSelectedUsername(opt.username)}
                  className="mt-1 accent-[var(--color-primary)]"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">@{opt.username}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {opt.style} · {opt.rationale}
                  </p>
                </div>
                {selectedUsername === opt.username && (
                  <Check className="mt-1 h-4 w-4 text-[var(--color-primary)]" />
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void regenerateUsernames()}
            loading={loadingUsernames}
          >
            再生成 5 个
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">自定义：</span>
            <input
              type="text"
              value={customUsername}
              onChange={(e) => setCustomUsername(e.target.value)}
              placeholder="输入自定义用户名"
              className="h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-blue-200"
            />
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <span>⚠️</span>
          请到 Facebook / Instagram 确认此用户名是否可用
        </p>
      </div>

      {/* Bios */}
      {loadingBios ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 text-sm text-[var(--color-text-muted)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          AI 正在生成简介...
        </div>
      ) : (
        selectedPlatforms.map((platform) => {
          const limit = CHAR_LIMITS[platform] ?? 200;
          const bioText = getBioValue(platform);
          const charCount = [...bioText].length;

          return (
            <div key={platform} className={sectionClass}>
              <p className={labelClass}>{platform.charAt(0).toUpperCase() + platform.slice(1)} Bio</p>

              <textarea
                value={bioText}
                onChange={(e) => setEditingBio((prev) => ({ ...prev, [platform]: e.target.value }))}
                rows={4}
                maxLength={limit * 3}
                className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-xs',
                    charCount > limit ? 'font-semibold text-rose-600' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {charCount}/{limit} 字
                </span>
                <div className="flex items-center gap-2">
                  <CopyButton text={bioText} />
                  <button
                    type="button"
                    onClick={() =>
                      setEditingBio((prev) => ({
                        ...prev,
                        [platform]: prev[platform] !== undefined ? prev[platform] : bioText,
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                  >
                    <Pencil className="h-3 w-3" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => void regenerateSingleBio(platform)}
                    disabled={loadingRegenBio === platform}
                    className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] disabled:opacity-60"
                  >
                    {loadingRegenBio === platform ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-[var(--color-primary)] border-t-transparent" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    重新生成
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={regenInstruction[platform] ?? ''}
                  onChange={(e) =>
                    setRegenInstruction((prev) => ({ ...prev, [platform]: e.target.value }))
                  }
                  placeholder="加说明：更亲切一点、加入减重经历..."
                  className="flex-1 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => void regenerateSingleBio(platform)}
                  disabled={!regenInstruction[platform]?.trim() || loadingRegenBio === platform}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] disabled:opacity-40"
                >
                  按说明重生成
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Avatar + Cover guidance */}
      <div className={sectionClass}>
        <p className={labelClass}>头像建议</p>
        {!avatarUrl && !avatarCompleted ? (
          <div className="mb-4">
            <JustInTimeFieldPrompt
              field="avatarUrl"
              label="要让带形象的内容更像你，贴一张个人照链接给我？"
              whyNow="这张照片会用于你接下来需要个人形象的内容建议；现在没有也没关系。"
              placeholder="https://..."
              inputMode="url"
              onSaved={setAvatarUrl}
            />
          </div>
        ) : null}
        <ul className="space-y-1 text-sm">
          <li className="text-green-700">✅ 清晰个人正面照</li>
          <li className="text-green-700">✅ 自然微笑，背景简洁</li>
          <li className="text-rose-600">❌ 避免：风景照、卡通、多人合照</li>
        </ul>

        <p className={cn(labelClass, 'mt-3')}>封面图建议</p>
        <p className="text-sm text-[var(--color-text-muted)]">建议包含：名字 + 价值主张 + CTA</p>
        <a
          href="https://www.canva.com/facebook-covers/templates/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline"
        >
          打开 Canva 封面模板
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={avatarCompleted}
            onChange={(event) => setAvatarCompleted(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          我已完成头像和封面设置
        </label>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={() => void handleSave()} loading={saving}>
          保存社交资料
        </Button>
      </div>
    </div>
  );
}
