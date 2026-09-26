import { formatINR, formatINRCompact } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MoneyText({ value, compact, decimals = true, className }: { value: number | undefined; compact?: boolean; decimals?: boolean; className?: string }) {
  if (value === undefined || Number.isNaN(value)) return <span className={cn('num text-muted-foreground', className)}>—</span>
  return <span className={cn('num whitespace-nowrap', className)}>{compact ? formatINRCompact(value) : formatINR(value, { decimals })}</span>
}
