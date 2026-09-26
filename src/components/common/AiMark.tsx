import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { confidenceLevel } from '@/lib/confidence'
import { cn } from '@/lib/utils'

/** Sparkle marker for AI-generated content. */
export function AiSparkle({ className }: { className?: string }) {
  return <Sparkles className={cn('h-3.5 w-3.5 text-ai', className)} aria-label="AI generated" />
}

export function AiLabel({ children = 'AI', className }: { children?: React.ReactNode; className?: string }) {
  return (
    <Badge variant="violet" className={cn('gap-1', className)}>
      <Sparkles className="h-3 w-3" aria-hidden />
      {children}
    </Badge>
  )
}

const LEVEL_STYLE = {
  High: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Medium: 'border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Low: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
}

export function ConfidenceBadge({ value, className, compact }: { value: number; className?: string; compact?: boolean }) {
  const level = confidenceLevel(value)
  return (
    <Tooltip content={`AI confidence ${value}% · ${level} (High ≥ 90, Medium 70–89, Low < 70)`}>
      <span
        className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-px text-2xs font-medium', LEVEL_STYLE[level], className)}
        aria-label={`Confidence ${value} percent, ${level}`}
      >
        <Sparkles className="h-2.5 w-2.5 opacity-80" aria-hidden />
        <span className="num">{value}%</span>
        {!compact && <span className="opacity-80">{level}</span>}
      </span>
    </Tooltip>
  )
}

export function EditedChip({ original, className }: { original?: string; className?: string }) {
  const chip = (
    <span className={cn('inline-flex items-center rounded border border-ai-border bg-background px-1 text-2xs font-medium text-ai', className)}>Edited</span>
  )
  return original ? <Tooltip content={`AI value: ${original}`}>{chip}</Tooltip> : chip
}
