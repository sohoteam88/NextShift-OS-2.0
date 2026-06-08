import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
};

const sizes: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-primary)] font-medium text-white',
        sizes[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'Avatar'}
          fill
          unoptimized
          sizes="48px"
          className="object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  ),
);

Avatar.displayName = 'Avatar';
