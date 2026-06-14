'use client';

type Props = {
  unlimited: boolean;
  limitPerDay: number;
  onUnlimitedChange: (v: boolean) => void;
  onLimitChange: (v: number) => void;
};

export function VoiceUploadSettings({ unlimited, limitPerDay, onUnlimitedChange, onLimitChange }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--color-text)]">语音上传限制</h2>
      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={!unlimited} onChange={(e) => onUnlimitedChange(!e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)]" />
          无限量上传
        </label>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">每天最多上传次数</label>
          <input type="number" min={1} step={1} value={String(limitPerDay)} onChange={(e) => onLimitChange(Number(e.target.value))} disabled={!unlimited} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-70" />
          <p className="text-xs text-[var(--color-text-muted)]">关闭「无限量上传」后，成员和品牌建设语音都会套用这个每日上限。</p>
        </div>
      </div>
    </div>
  );
}
