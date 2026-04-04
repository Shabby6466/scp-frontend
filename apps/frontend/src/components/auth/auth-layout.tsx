import type { ReactNode } from 'react';

/**
 * Centered auth screens on the shared app background wash (see globals `.bg-app-main`).
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-app-main px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
