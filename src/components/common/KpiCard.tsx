import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function KpiCard({ label, value, delta, deltaLabel, good = 'up', icon: Icon, onClick, spark }: {
  label: string
  value: React.ReactNode
  delta?: number
  deltaLabel?: string
  good?: 'up' | 'down'
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  spark?: number[]
}) {
  const positive = delta !== undefined && ((delta >= 0 && good === 'up') || (delta < 0 && good === 'down'))
  const Comp = onClick ? 'button' : 'div'
  return (
    <Card className={cn('relative overflow-hidden', onClick && 'transition-colors hover:border-primary/40')}>
      <Comp onClick={onClick} className="flex w-full flex-col gap-1.5 p-3.5 text-left focus-visible:outline-none">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {Icon && <Icon className="h-4 w-4 opacity-70" />}
        </div>
        <div className="num text-[22px] font-semibold leading-none tracking-tight">{value}</div>
        <div className="flex items-center justify-between">
          {delta !== undefined ? (
            <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span className="num">{Math.abs(delta)}{deltaLabel ?? '%'}</span>{' '}
              <span className="font-normal text-muted-foreground">vs last period</span>
            </span>
          ) : (
            <span />
          )}
          {spark && <Sparkline data={spark} />}
        </div>
      </Comp>
    </Card>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const w = 64
  const h = 20
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="text-primary/70" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}
