import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="font-serif text-4xl tracking-tight text-primary sm:text-5xl">
          {title}
        </h1>
        {description != null && description !== '' && (
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions != null ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
