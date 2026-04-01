'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ModeToggle() {
  const { setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0 opacity-50')}
        aria-hidden
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0')}
        aria-label="Theme"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:inline" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="shadow-overlay">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
