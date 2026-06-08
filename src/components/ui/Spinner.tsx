import { cn } from '@/lib/cn';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent text-current',
        sizes[size],
        className,
      )}
    />
  );
}
