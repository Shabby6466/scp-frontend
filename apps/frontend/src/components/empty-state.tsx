'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-12 text-center sm:px-8 sm:py-16',
        className,
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
