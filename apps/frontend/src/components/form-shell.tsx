import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface FormShellProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
}

export function FormShell({ children, className, title, description }: FormShellProps) {
  const hasHeader = title != null || description != null;

  return (
    <Card className={cn('max-w-md', className)}>
      {hasHeader && (
        <CardHeader>
          {title != null && <CardTitle className="text-base">{title}</CardTitle>}
          {description != null && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(!hasHeader && 'pt-6')}>{children}</CardContent>
    </Card>
  );
}
