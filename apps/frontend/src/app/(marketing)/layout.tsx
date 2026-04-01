import Link from 'next/link';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevated">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              School System
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: 'sm' }))}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-medium text-muted-foreground">School System</span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} School Compliance Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
