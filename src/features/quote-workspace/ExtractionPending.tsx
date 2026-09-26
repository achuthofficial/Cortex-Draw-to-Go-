import { useEffect, useRef, useState } from 'react'
import { Check, FileScan, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EXTRACTION_STAGES } from '@/features/rfq/NewRfqDialog'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import type { QuoteState, Rfq } from '@/data/types'

/** Shown in the right pane until the AI has read the drawing. */
export function ExtractionPending({ quote, rfq }: { quote: QuoteState; rfq: Rfq }) {
  const complete = useData((s) => s.completeExtraction)
  const setStatus = useData((s) => s.setRfqStatus)
  const [stage, setStage] = useState(rfq.status === 'Extracting' ? 0 : -1)
  const timers = useRef<number[]>([])

  const start = () => {
    setStatus(rfq.id, 'Extracting')
    setStage(0)
  }

  useEffect(() => {
    if (stage < 0) return
    timers.current.forEach(clearTimeout)
    timers.current = EXTRACTION_STAGES.map((_, i) => window.setTimeout(() => setStage(i), i * 1000))
    timers.current.push(
      window.setTimeout(() => {
        complete(quote.id)
        toast.success('Extraction complete', { description: 'Low-confidence items are listed first in the review queue.' })
      }, EXTRACTION_STAGES.length * 1000),
    )
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage >= 0])

  if (stage < 0)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ai-soft">
          <FileScan className="h-6 w-6 text-ai" />
        </div>
        <div className="text-sm font-semibold">Drawing not extracted yet</div>
        <p className="max-w-sm text-xs text-muted-foreground">
          The AI will read {rfq.parts[0].partNo} rev {rfq.parts[0].revision}, extract dimensions, GD&T, datums and notes, run manufacturability checks and draft a process plan and cost.
        </p>
        <Button variant="ai" onClick={start}>
          <Sparkles /> Run AI extraction
        </Button>
      </div>
    )

  const pct = Math.round(((stage + 1) / EXTRACTION_STAGES.length) * 100)
  return (
    <div className="flex h-full flex-col gap-4 p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 animate-pulse text-ai" />
        <div className="flex-1">
          <div className="text-[13px] font-medium">{EXTRACTION_STAGES[stage]}…</div>
          <Progress value={pct} className="mt-1.5 h-1.5 bg-ai/15" indicatorClassName="bg-ai" />
        </div>
      </div>
      <ol className="space-y-2">
        {EXTRACTION_STAGES.map((s, i) => (
          <li key={s} className={cn('flex items-center gap-2 text-[13px]', i > stage && 'text-muted-foreground')}>
            {i < stage ? <Check className="h-4 w-4 text-emerald-600" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-ai" /> : <span className="h-4 w-4 rounded-full border" />}
            {s}
          </li>
        ))}
      </ol>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton h-4 w-8" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
