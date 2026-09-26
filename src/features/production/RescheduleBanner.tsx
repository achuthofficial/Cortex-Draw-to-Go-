import { CheckCircle2, Eye, EyeOff, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { vmc2Reschedule } from '@/data/orders'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'

export function RescheduleBanner({ previewing, onPreview, className }: { previewing: boolean; onPreview: (v: boolean) => void; className?: string }) {
  const applied = useData((s) => s.rescheduleApplied)
  const apply = useData((s) => s.applyReschedule)
  const vmc2 = useData((s) => s.machines.find((m) => m.id === 'm-vmc2'))
  if (!vmc2 || vmc2.state !== 'Down') return null
  if (applied)
    return (
      <div className={cn('flex items-center gap-2 border-b bg-emerald-500/10 px-5 py-2 text-[13px]', className)}>
        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Reschedule applied: 3 VMC 2 jobs moved to VMC 3. 2 of 3 on time; WO-26-0410 is 1 day late.
      </div>
    )
  return (
    <div className={cn('border-b border-ai-border bg-ai-soft/70 px-5 py-2.5', className)} role="status">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles className="h-4 w-4 shrink-0 text-ai" />
        <div className="min-w-0 flex-1 text-[13px]">
          <strong>VMC 2 is down: 3 jobs affected.</strong> Suggested reschedule keeps 2 of 3 on time.
          <span className="ml-1 text-xs text-muted-foreground">({vmc2.downReason})</span>
        </div>
        <Button size="sm" variant="ai-outline" onClick={() => onPreview(!previewing)} aria-pressed={previewing}>
          {previewing ? <EyeOff /> : <Eye />} {previewing ? 'Hide preview' : 'Preview'}
        </Button>
        <Button
          size="sm"
          variant="ai"
          onClick={() => {
            apply()
            onPreview(false)
            toast.success('Reschedule applied', { description: 'WO-26-0403 and WO-26-0407 back on time. WO-26-0410 is 1 day late; customer notified draft ready.' })
          }}
        >
          Apply
        </Button>
      </div>
      {previewing && (
        <ul className="mt-2 space-y-1 pl-7 text-xs">
          {vmc2Reschedule.map((r) => (
            <li key={r.blockId} className="flex items-center gap-2">
              {r.onTime ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-red-600" />}
              {r.note}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
