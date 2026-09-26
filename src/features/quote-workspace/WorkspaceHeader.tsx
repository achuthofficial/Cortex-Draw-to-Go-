import { useState } from 'react'
import { Check, ChevronDown, Clock, History, Save, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { MoneyText } from '@/components/common/MoneyText'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { customerName, userById } from '@/data/core'
import type { QuoteState, QuoteStep, Rfq } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { reviewStats, type WsTab } from './shared'

const STEPS: { step: QuoteStep; tab: WsTab }[] = [
  { step: 'Upload', tab: 'extraction' },
  { step: 'Extract', tab: 'extraction' },
  { step: 'Review', tab: 'extraction' },
  { step: 'Plan', tab: 'plan' },
  { step: 'Cost', tab: 'costing' },
  { step: 'Send', tab: 'preview' },
]

function completedSteps(q: QuoteState, rfq: Rfq, visited: Set<WsTab>): Set<QuoteStep> {
  const done = new Set<QuoteStep>(['Upload'])
  if (q.extracted) done.add('Extract')
  const reviewDone = reviewStats(q).done
  if (reviewDone) done.add('Review')
  const later = ['Costing', 'Sent', 'Won', 'Lost'].includes(rfq.status)
  if (later || (reviewDone && visited.has('plan'))) done.add('Plan')
  if (['Sent', 'Won', 'Lost'].includes(rfq.status) || (reviewDone && visited.has('costing'))) done.add('Cost')
  if (['Sent', 'Won', 'Lost'].includes(rfq.status)) done.add('Send')
  return done
}

export function WorkspaceHeader({ quote, rfq, onTab, visited, total }: { quote: QuoteState; rfq: Rfq; tab: WsTab; onTab: (t: WsTab) => void; visited: Set<WsTab>; total: number }) {
  const saveVersion = useData((s) => s.saveVersion)
  const restoreVersion = useData((s) => s.restoreVersion)
  const [justSaved, setJustSaved] = useState(false)
  const done = completedSteps(quote, rfq, visited)
  const current = STEPS.find((s) => !done.has(s.step))?.step
  const est = userById(rfq.estimatorId)
  const minutes = rfq.quoteMinutes ?? Math.max(1, Math.round((Date.now() - new Date(quote.startedAt).getTime()) / 60000))
  const itemCount = quote.dimensions.length + quote.gdt.length + quote.notes.length
  const manualH = Math.max(1.5, Math.round((itemCount * 3.2) / 60 * 2) / 2)
  const tb = quote.titleBlock

  return (
    <div className="shrink-0 border-b bg-background px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="num text-base font-semibold">{rfq.id}</h1>
            <StatusBadge status={rfq.status} />
            <span className="truncate text-[13px] text-muted-foreground">{customerName(rfq.customerId)}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <span>
              <span className="num font-medium text-foreground">{tb.partNo}</span> rev <span className="num font-medium text-foreground">{tb.revision}</span> · {tb.description}
            </span>
            <span>
              Estimator <span className="text-foreground">{est?.name}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              Quote <MoneyText value={total} className="font-medium text-foreground" decimals={false} />
            </span>
          </div>
        </div>

        <ol className="flex items-center" aria-label="Quote progress">
          {STEPS.map((s, i) => {
            const isDone = done.has(s.step)
            const isCurrent = current === s.step
            return (
              <li key={s.step} className="flex items-center">
                {i > 0 && <span className={cn('h-px w-4 lg:w-6', isDone || isCurrent ? 'bg-primary' : 'bg-border')} aria-hidden />}
                <button
                  onClick={() => onTab(s.tab)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                    isCurrent && 'bg-primary/10 text-primary',
                    !isDone && !isCurrent && 'text-muted-foreground',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border text-[9px]',
                      isDone ? 'border-primary bg-primary text-primary-foreground' : isCurrent ? 'border-primary' : 'border-muted-foreground/40',
                    )}
                  >
                    {isDone ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </span>
                  {s.step}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="ml-auto flex items-center gap-2">
          {quote.extracted && (
            <Tooltip content="Time from RFQ received to quote ready, compared with the historical manual average for a drawing of this complexity.">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Timer className="h-3.5 w-3.5" />
                <span className="num">{`Quoted in ${minutes} min, est. ${manualH} h manual`}</span>
              </span>
            </Tooltip>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <History /> v{Math.max(1, quote.versions.length)} <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Version history</DropdownMenuLabel>
              {quote.versions.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved versions yet.</div>}
              {quote.versions
                .slice()
                .reverse()
                .map((v) => (
                  <DropdownMenuItem
                    key={v.version}
                    onSelect={() => {
                      restoreVersion(quote.id, v.version)
                      toast.success(`Restored pricing from v${v.version}`, { description: 'Ctrl+Z to undo.' })
                    }}
                  >
                    <Clock />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">v{v.version}</span>
                        {v.total > 0 && <MoneyText value={v.total} decimals={false} className="text-xs" />}
                      </div>
                      <div className="truncate text-2xs text-muted-foreground">
                        {v.note} · {userById(v.by)?.name ?? v.by} · {formatDateTime(v.at)}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  saveVersion(quote.id, 'Saved by estimator')
                  setJustSaved(true)
                  setTimeout(() => setJustSaved(false), 1500)
                  toast.success(`Saved as v${quote.versions.length + 1}`)
                }}
              >
                <Save /> Save current as new version
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {justSaved && <span className="sr-only">Version saved</span>}
        </div>
      </div>
    </div>
  )
}
