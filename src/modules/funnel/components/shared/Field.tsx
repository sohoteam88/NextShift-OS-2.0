import { CopyButton } from './CopyButton';

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <div className="flex items-start gap-1">
        <p className="text-sm text-[var(--color-text)]">{value || '—'}</p>
        {value && <CopyButton text={value} />}
      </div>
    </div>
  );
}
