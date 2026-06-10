import { Brain, Zap } from 'lucide-react';
import { getModelById } from '../router/model-registry';

type Props = {
  model?: string | null;
  costUsd?: number | null;
  durationMs?: number | null;
  className?: string;
};

export function ModelIndicator({ model, costUsd, durationMs, className }: Props) {
  if (!model) return null;

  const config = getModelById(model);
  const Icon = config?.tier === 'A' || config?.tier === 'S' ? Brain : Zap;
  const label = config?.displayName ?? model;

  return (
    <span
      className={className ?? 'inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)] shadow-sm'}
      title={config ? `${config.provider} · Tier ${config.tier}` : model}
    >
      <Icon className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
      <span>{label}</span>
      {typeof costUsd === 'number' && <span>· ${costUsd.toFixed(4)}</span>}
      {typeof durationMs === 'number' && <span>· {(durationMs / 1000).toFixed(1)}s</span>}
    </span>
  );
}
