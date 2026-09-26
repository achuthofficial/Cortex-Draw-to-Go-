import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-px text-2xs font-medium [&_svg]:size-3', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'text-foreground',
      green: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      amber: 'border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      red: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
      blue: 'border-blue-600/25 bg-blue-500/10 text-blue-700 dark:text-blue-400',
      gray: 'border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300',
      violet: 'border-ai-border bg-ai-soft text-ai',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
