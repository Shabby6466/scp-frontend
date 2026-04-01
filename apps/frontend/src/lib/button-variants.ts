import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center rounded-3xl border-0 shadow-sm bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        outline:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:opacity-90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-10 gap-2 px-6',
        xs: 'h-7 gap-1 px-3 text-xs',
        sm: 'h-8.5 gap-1.5 px-4 text-sm',
        lg: 'h-12 gap-2.5 px-8 text-base',
        icon: 'size-10',
        'icon-xs': 'size-7',
        'icon-sm': 'size-8.5',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
