import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
        secondary:
          "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning:
          "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        destructive:
          "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 shadow-none",
        outline:
          "bg-secondary/60 text-muted-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
