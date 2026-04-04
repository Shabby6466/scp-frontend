'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface InlineLoadingProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
  className?: string;
}

export function InlineLoading({
  message = 'Loading…',
  variant = 'spinner',
  className,
}: InlineLoadingProps) {
  if (variant === 'skeleton') {
    return <Skeleton className={cn('h-8 w-full max-w-md', className)} />;
  }

  return (
    <div
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
