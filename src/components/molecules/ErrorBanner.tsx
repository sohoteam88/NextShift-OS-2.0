import type { ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type ErrorBannerProps = {
  message: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  icon?: ReactNode;
};

export function ErrorBanner({
  message,
  description,
  onRetry,
  retryLabel = 'Retry',
  className,
  icon,
}: ErrorBannerProps) {
  return (
    <div className={cn('rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-red-700', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-white text-red-600">
          {icon ?? <AlertTriangle className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{message}</p>
          {description && <p className="mt-1 text-sm text-red-600/90">{description}</p>}
        </div>
        {onRetry && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={onRetry}
            className="shrink-0 border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
