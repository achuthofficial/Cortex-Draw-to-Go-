import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Minus, Moon, Pause, Play, Plus, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { DrawingSheet } from '@/components/common/DrawingSheet'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { userById, workCenterName } from '@/data/core'
import { getDrawing } from '@/data/drawings'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

const ISSUES = ['Dimension out of tolerance', 'Tool breakage', 'Material defect', 'Machine alarm', 'Drawing unclear', 'Other']

/** Full-screen tablet layout for use at the machine (1024 px, large touch targets). */
export function OperatorMode() {
  const { woId } = useParams()
  const navigate = useNavigate()
  const wos = useData((s) => s.workOrders)
  const parts = useData((s) => s.parts)
  const action = useData((s) => s.woAction)
  const recordQty = useData((s) => s.recordQty)
  const reportIssue = useData((s) => s.reportIssue)
  const theme = useUi((s) => s.theme)
  const toggleTheme = useUi((s) => s.toggleTheme)
  const wo = wos.find((w) => w.id === woId) ?? wos.find((w) => w.status === 'In progress')!
  const [good, setGood] = useState(1)
  const [scrap, setScrap] = useState(0)
  const [issueOpen, setIssueOpen] = useState(false)
  const [issue, setIssue] = useState(ISSUES[0])
  const [issueText, setIssueText] = useState('')
  const part = parts.find((p) => p.partNo === wo.partNo)
  const spec = useMemo(() => {
    const d = getDrawing(part?.drawingId ?? 'drw-shaft')
    return { ...d, titleBlock: { ...d.titleBlock, partNo: wo.partNo, revision: part?.revision ?? d.titleBlock.revision } }
  }, [part, wo.partNo])
  const op = wo.operations.find((o) => o.status === 'Running') ?? wo.operations.find((o) => o.status === 'Pending')
  const running = op?.status === 'Running'
  const operator = userById('u-suresh')

  const Stepper = ({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) => (
    <div className="flex items-center gap-2">
      <span className="w-14 text-base font-medium">{label}</span>
      <Button variant="outline" className="h-14 w-14 text-xl" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>
        <Minus className="!size-6" />
      </Button>
      <span className="num w-16 text-center text-3xl font-semibold" aria-live="polite">
        {value}
      </span>
      <Button variant="outline" className="h-14 w-14 text-xl" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)}>
        <Plus className="!size-6" />
      </Button>
    </div>
  )

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <Button variant="ghost" className="h-12 px-3 text-base" onClick={() => navigate(-1)}>
          <ArrowLeft className="!size-5" /> Exit
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold">{op ? workCenterName(op.workCenter) : 'Operator'}</div>
          <div className="text-sm text-muted-foreground">Operator: {operator?.name} · Shift A</div>
        </div>
        <Button variant="ghost" className="h-12 w-12" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="!size-5" /> : <Moon className="!size-5" />}
        </Button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-[1fr_380px]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Current job</div>
            <div className="num text-2xl font-bold">{wo.id}</div>
            <div className="mt-1 text-lg">
              <span className="num font-semibold">{wo.partNo}</span> · {part?.description}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-base">
              <span className="rounded-lg bg-muted px-3 py-1.5">
                Op <span className="num font-semibold">{op?.opNo}</span> · {op?.name}
              </span>
              <span className="rounded-lg bg-muted px-3 py-1.5">
                Good <span className="num font-semibold">{wo.good}</span> / <span className="num">{wo.qty}</span>
              </span>
              {wo.scrap > 0 && <span className="rounded-lg bg-red-500/10 px-3 py-1.5 text-red-700 dark:text-red-400">Scrap <span className="num font-semibold">{wo.scrap}</span></span>}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-drawing-bg">
            <DrawingSheet spec={spec} layers={{ dimensions: true, gdt: true, datums: true, notes: true, titleBlock: true }} className="h-full w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {running ? (
            <Button className="h-20 bg-amber-500 text-xl text-white hover:bg-amber-600" onClick={() => { action(wo.id, 'pause'); toast('Job paused') }}>
              <Pause className="!size-7" /> Pause
            </Button>
          ) : (
            <Button className="h-20 bg-emerald-600 text-xl text-white hover:bg-emerald-700" disabled={!op} onClick={() => { action(wo.id, 'start'); toast.success(`Op ${op?.opNo} started`) }}>
              <Play className="!size-7" /> Start
            </Button>
          )}
          <div className="space-y-3 rounded-xl border p-4">
            <div className="text-base font-semibold">Record quantity</div>
            <Stepper value={good} onChange={setGood} label="Good" />
            <Stepper value={scrap} onChange={setScrap} label="Scrap" />
            <Button
              className="h-14 w-full text-lg"
              variant="outline"
              disabled={good + scrap === 0}
              onClick={() => {
                recordQty(wo.id, good, scrap)
                toast.success(`Recorded ${good} good${scrap ? `, ${scrap} scrap` : ''}`)
                setGood(1)
                setScrap(0)
              }}
            >
              Save count
            </Button>
          </div>
          <Button
            className="h-16 text-lg"
            disabled={!op}
            onClick={() => {
              action(wo.id, 'complete')
              toast.success(`Op ${op?.opNo} complete`)
            }}
          >
            <CheckCircle2 className="!size-6" /> Complete operation
          </Button>
          <Button variant="outline" className={cn('h-16 border-red-500/50 text-lg text-red-600 hover:bg-red-500/10 hover:text-red-700')} onClick={() => setIssueOpen(true)}>
            <AlertTriangle className="!size-6" /> Report an issue
          </Button>
        </div>
      </div>
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Report an issue</DialogTitle>
            <DialogDescription>Creates an NCR and alerts Quality and the planner.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {ISSUES.map((i) => (
              <button key={i} onClick={() => setIssue(i)} className={cn('h-14 rounded-lg border px-3 text-left text-base hover:bg-accent', issue === i && 'border-primary bg-primary/10 font-medium')} aria-pressed={issue === i}>
                {i}
              </button>
            ))}
          </div>
          <Textarea value={issueText} onChange={(e) => setIssueText(e.target.value)} placeholder="What happened? (optional)" className="text-base" />
          <DialogFooter>
            <Button variant="outline" className="h-12 px-5 text-base" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-12 px-5 text-base"
              onClick={() => {
                const id = reportIssue(wo.id, issue, issueText || `${issue} reported at ${op ? workCenterName(op.workCenter) : 'machine'}.`, Math.max(1, scrap))
                setIssueOpen(false)
                setIssueText('')
                toast.success(`${id} raised`, { description: 'Quality has been notified.' })
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
