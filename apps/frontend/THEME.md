# Theme and styling

## Where to change the look

| What | File |
|------|------|
| Colors, radius, shadows, semantic tokens | [`src/app/globals.css`](src/app/globals.css) — `:root`, `.dark`, `@theme inline` |
| Font families | [`src/app/layout.tsx`](src/app/layout.tsx) (Next.js `next/font` on `<html>`) + `globals.css` `@theme` `--font-sans` / `--font-mono` |
| Component defaults | [`src/components/ui/*`](src/components/ui/) (shadcn base-nova) |
| Button style variants (server-safe) | [`src/lib/button-variants.ts`](src/lib/button-variants.ts) — use with `<Link className={cn(buttonVariants({ size: 'sm' }))}>` on RSC pages |

## Tokens

- **Core**: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--ring`, `--card`, `--destructive`, etc.
- **Semantic** (for alerts, badges, inline states): `--success` / `--success-foreground`, `--warning` / `--warning-foreground`, `--info` / `--info-foreground`. Use Tailwind: `bg-success`, `text-success-foreground`, etc.
- **Elevation**: `--elevation-card`, `--elevation-popover` (raw). Utilities: `shadow-elevated`, `shadow-overlay`. Tailwind shadows: `shadow-card`, `shadow-popover` (from `@theme`).
- **Shell**: `.bg-app-main` — subtle gradient wash for dashboard main content (uses `--primary` mix only).

## Light / dark

- Runtime: [`next-themes`](https://github.com/pacocoursey/next-themes) in [`src/components/providers.tsx`](src/components/providers.tsx) (`attribute="class"`, `defaultTheme="light"`).
- Preview: use the header **theme** control (system / light / dark) or add `class="dark"` on `<html>` in devtools.

## Conventions

- Prefer semantic tokens: `text-muted-foreground`, `border-border`, `bg-card`, `text-primary`.
- Avoid raw Tailwind grays (`text-gray-500`, `dark:text-gray-300`) in new code unless there is no token fit.

## shadcn

- Config: [`components.json`](components.json) (`style: base-nova`, `cssVariables: true`).
- Add components: `pnpm dlx shadcn@latest add <name>` from `apps/frontend`.
