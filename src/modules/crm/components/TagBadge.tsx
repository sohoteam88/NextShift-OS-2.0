import { cn } from '@/lib/cn';

type Props = {
  name: string;
  color: string;
  className?: string;
  onRemove?: () => void;
};

export function TagBadge({ name, color, className, onRemove }: Props) {
  // Derive a readable text color (dark or light) from the bg hex
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? '#111827' : '#ffffff';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: color + '28', color: color, border: `1px solid ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 rounded-full hover:opacity-70"
          style={{ color }}
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

// Compact dot-only variant for tight spaces (pipeline cards)
export function TagDot({ color, name }: { color: string; name: string }) {
  return (
    <span
      className="h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      title={name}
    />
  );
}
