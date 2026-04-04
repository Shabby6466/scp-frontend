import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { pageTitleForDestinationHref } from '@/lib/safe-from-path';

interface PageBackLinkProps {
  href: string;
  /** Omit to use a title derived from `href` (e.g. Dashboard, Branches). */
  children?: React.ReactNode;
  className?: string;
}

export function PageBackLink({ href, children, className }: PageBackLinkProps) {
  const label = children ?? pageTitleForDestinationHref(href);
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Link href={href}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" />
          {label}
        </Button>
      </Link>
    </div>
  );
}
