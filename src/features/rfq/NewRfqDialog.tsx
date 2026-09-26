import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FileImage, FileText, Loader2, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { daysFromToday } from '@/lib/dates'
import { platform, type PickedFile } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { quoteIdFor } from '@/store/quote-factory'
import { useUi } from '@/store/ui'

export const EXTRACTION_STAGES = ['Reading drawing', 'Detecting views', 'Extracting dimensions', 'Reading GD&T', 'Cross-view checks', 'Done']

const SAMPLE_FILES: PickedFile[] = [{ name: 'KA-7731-SH_revC.pdf', size: 1_482_331, type: 'application/pdf' }]

function templateFor(files: PickedFile[]): 'shaft' | 'flange' | 'bracket' {
  const n = files.map((f) => f.name.toLowerCase()).join(' ')
  if (/flange|fl-|cap|hub/.test(n)) return 'flange'
  if (/bracket|br-|mount|mb-/.test(n)) return 'bracket'
  return 'shaft'
}

export function NewRfqDialog() {
  const open = useUi((s) => s.newRfqOpen)
  const setOpen = useUi((s) => s.setNewRfq)
  const customers = useData((s) => s.customers)
  const createRfq = useData((s) => s.createRfq)
  const completeExtraction = useData((s) => s.completeExtraction)
  const navigate = useNavigate()

  const [files, setFiles] = useState<PickedFile[]>([])
  const [customerId, setCustomerId] = useState('c-kestrel')
  const [qtys, setQtys] = useState('10, 50, 100')
  const [due, setDue] = useState(daysFromToday(3).slice(0, 10))
  const [notes, setNotes] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!open) {
      timers.current.forEach(clearTimeout)
      timers.current = []
      setStage(-1)
      setFiles([])
      setNotes('')
      setError(null)
    }
  }, [open])

  const addFiles = (list: PickedFile[]) => {
    const ok = list.filter((f) => /pdf|image|png|jpe?g|tiff?/i.test(f.type || f.name))
    if (ok.length < list.length) setError('Only PDF and image files are supported.')
    else setError(null)
    setFiles((cur) => [...cur, ...ok])
  }

  const submit = () => {
    const quantities = qtys
      .split(/[,\s]+/)
      .map((q) => parseInt(q, 10))
      .filter((n) => n > 0)
    if (!files.length) return setError('Add at least one drawing.')
    if (!quantities.length) return setError('Enter at least one quantity.')
    setError(null)
    const id = createRfq({ customerId, files: files.map((f) => f.name), quantities, dueAt: new Date(`${due}T18:00:00`).toISOString(), notes, template: templateFor(files) })
    setStage(0)
    EXTRACTION_STAGES.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStage(i), i * 1150))
    })
    timers.current.push(
      window.setTimeout(() => {
        completeExtraction(quoteIdFor(id))
        setOpen(false)
        navigate(`/quotes/${id}`)
        toast.success(`${id} extracted`, { description: 'Review low-confidence items first. Everything the AI produced is marked in violet.' })
      }, EXTRACTION_STAGES.length * 1150),
    )
  }

  const running = stage >= 0
  const pct = running ? Math.round(((stage + 1) / EXTRACTION_STAGES.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
      <DialogContent className="max-w-2xl" hideClose={running} onEscapeKeyDown={(e) => running && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{running ? 'AI is reading your drawing' : 'New RFQ'}</DialogTitle>
          <DialogDescription>{running ? 'This usually takes a few seconds per sheet.' : 'Drop the customer drawings. The AI extracts dimensions and GD&T, then drafts a process plan and cost.'}</DialogDescription>
        </DialogHeader>

        {running ? (
          <div className="space-y-4 py-2" aria-live="polite">
            <div className="flex items-center gap-3 rounded-lg border border-ai-border bg-ai-soft p-3">
              <Sparkles className="h-5 w-5 animate-pulse text-ai" />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{files[0]?.name}</div>
                <Progress value={pct} className="mt-1.5 h-1.5 bg-ai/15" indicatorClassName="bg-ai" />
              </div>
              <span className="num text-xs text-ai">{pct}%</span>
            </div>
            <ol className="space-y-2">
              {EXTRACTION_STAGES.map((s, i) => (
                <li key={s} className={cn('flex items-center gap-2.5 text-[13px]', i > stage && 'text-muted-foreground')}>
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', i < stage || s === 'Done' && i === stage ? 'border-emerald-600 bg-emerald-600 text-white' : i === stage ? 'border-ai text-ai' : '')}>
                    {i < stage || (s === 'Done' && i === stage) ? <Check className="h-3 w-3" /> : i === stage ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="num text-2xs">{i + 1}</span>}
                  </span>
                  {s}
                  {i === 2 && i <= stage && <span className="num ml-auto text-xs text-muted-foreground">{i < stage ? '39 found' : 'scanning…'}</span>}
                  {i === 3 && i <= stage && <span className="num ml-auto text-xs text-muted-foreground">{i < stage ? '10 frames · 3 datums' : 'scanning…'}</span>}
                  {i === 4 && i < stage && <span className="ml-auto text-xs text-amber-600">2 conflicts found</span>}
                </li>
              ))}
            </ol>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5 rounded-md border p-2">
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-2.5 w-full" />
                  <div className="skeleton h-2.5 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                addFiles(Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: f.size, type: f.type })))
              }}
              className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors', dragOver ? 'border-primary bg-primary/5' : 'border-input')}
            >
              <UploadCloud className="h-7 w-7 text-muted-foreground" />
              <div className="text-[13px] font-medium">Drag and drop drawings here</div>
              <div className="text-xs text-muted-foreground">PDF, PNG, JPG or TIFF · multiple files and sheets supported</div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={async () => addFiles(await platform.pickFiles({ accept: ['.pdf', 'image/*'], multiple: true }))}>
                  Browse files
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => addFiles(SAMPLE_FILES)}>
                  Use sample drawing
                </Button>
              </div>
            </div>
            {files.length > 0 && (
              <ul className="divide-y rounded-md border">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-[13px]">
                    {f.type.includes('pdf') ? <FileText className="h-4 w-4 text-red-500" /> : <FileImage className="h-4 w-4 text-blue-500" />}
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="num text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    <Button variant="ghost" size="icon-xs" aria-label={`Remove ${f.name}`} onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rfq-customer">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="rfq-customer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rfq-due">Quote due date</Label>
                <Input id="rfq-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rfq-qty">Required quantities (comma separated)</Label>
                <Input id="rfq-qty" value={qtys} onChange={(e) => setQtys(e.target.value)} className="num" placeholder="10, 50, 100" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rfq-notes">Notes</Label>
                <Textarea id="rfq-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery expectations, certifications, special packing…" />
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
        {!running && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="ai" onClick={submit}>
              <Sparkles /> Create and extract
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
