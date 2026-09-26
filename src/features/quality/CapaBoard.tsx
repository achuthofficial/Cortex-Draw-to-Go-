import { useState } from 'react'
import { Calendar, GripVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { userById } from '@/data/core'
import type { Capa, CapaStage } from '@/data/types'
import { diffDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'

const STAGES: CapaStage[] = ['Open', 'Root cause', 'Action', 'Verification', 'Closed']
const EIGHT_D = ['D1 Team', 'D2 Problem description', 'D3 Containment', 'D4 Root cause', 'D5 Corrective action', 'D6 Implement and validate', 'D7 Prevent recurrence', 'D8 Recognise team']

export function CapaBoard() {
  const capas = useData((s) => s.capas)
  const move = useData((s) => s.moveCapa)
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<CapaStage | null>(null)
  const [open, setOpen] = useState<Capa | null>(null)
  const current = open ? capas.find((c) => c.id === open.id) ?? null : null

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      {STAGES.map((stage) => {
        const items = capas.filter((c) => c.stage === stage)
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(stage)
            }}
            onDragLeave={() => setOver(null)}
            onDrop={() => {
              if (dragId) {
                const c = capas.find((x) => x.id === dragId)
                if (c && c.stage !== stage) {
                  move(dragId, stage)
                  toast.success(`${dragId} moved to ${stage}`)
                }
              }
              setDragId(null)
              setOver(null)
            }}
            className={cn('flex w-64 shrink-0 flex-col rounded-lg border bg-muted/40', over === stage && 'border-primary bg-primary/5')}
            aria-label={`${stage} column`}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold">{stage}</span>
              <span className="num rounded bg-background px-1.5 text-2xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {items.map((c) => {
                const late = c.stage !== 'Closed' && diffDays(c.dueDate) < 0
                const idx = STAGES.indexOf(c.stage)
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    tabIndex={0}
                    role="button"
                    onClick={() => setOpen(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setOpen(c)
                      if (e.key === 'ArrowRight' && idx < STAGES.length - 1) move(c.id, STAGES[idx + 1])
                      if (e.key === 'ArrowLeft' && idx > 0) move(c.id, STAGES[idx - 1])
                    }}
                    aria-label={`${c.id} ${c.title}. Arrow keys move between columns.`}
                    className={cn('cursor-grab rounded-md border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing', dragId === c.id && 'opacity-50')}
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="num text-2xs text-muted-foreground">{c.id}</div>
                        <div className="text-[13px] font-medium leading-snug">{c.title}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge variant="outline">{c.method}</Badge>
                      <span className={cn('num inline-flex items-center gap-1 text-2xs', late ? 'font-semibold text-red-600' : 'text-muted-foreground')}>
                        <Calendar className="h-3 w-3" /> {formatDate(c.dueDate)}
                      </span>
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">{userById(c.owner)?.initials}</span>
                    </div>
                  </div>
                )
              })}
              {items.length === 0 && <div className="rounded-md border border-dashed p-4 text-center text-2xs text-muted-foreground">Drop here</div>}
            </div>
          </div>
        )
      })}
      <CapaDialog capa={current} onClose={() => setOpen(null)} />
    </div>
  )
}

function CapaDialog({ capa, onClose }: { capa: Capa | null; onClose: () => void }) {
  const addNote = useData((s) => s.addCapaNote)
  const move = useData((s) => s.moveCapa)
  const [why, setWhy] = useState('')
  const [action, setAction] = useState('')
  if (!capa) return null
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <span className="num">{capa.id}</span> · {capa.title}
          </DialogTitle>
          <DialogDescription>
            {capa.method} · owner {userById(capa.owner)?.name} · due {formatDate(capa.dueDate)} · linked {capa.ncrIds.join(', ')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1">
          {STAGES.map((s) => (
            <Button key={s} size="xs" variant={capa.stage === s ? 'default' : 'outline'} onClick={() => move(capa.id, s)}>
              {s}
            </Button>
          ))}
        </div>
        {capa.method === '8D' && (
          <div className="grid grid-cols-4 gap-1.5">
            {EIGHT_D.map((d, i) => {
              const done = i < 2 + STAGES.indexOf(capa.stage) * 1.5
              return (
                <div key={d} className={cn('rounded border px-2 py-1.5 text-2xs', done ? 'border-emerald-600/30 bg-emerald-500/10' : 'text-muted-foreground')}>
                  {d}
                </div>
              )
            })}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-semibold">{capa.method === '5-Why' ? '5-Why analysis' : 'Root cause (D4)'}</div>
            <ol className="space-y-1.5">
              {capa.whys.map((w, i) => (
                <li key={i} className="flex gap-2 text-[13px]">
                  <span className="num w-12 shrink-0 text-xs font-semibold text-primary">Why {i + 1}</span>
                  <span>{w}</span>
                </li>
              ))}
            </ol>
            <form
              className="mt-2 flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                if (why.trim()) addNote(capa.id, 'whys', why.trim())
                setWhy('')
              }}
            >
              <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder={`Why ${capa.whys.length + 1}?`} className="h-7 text-xs" aria-label="Add a why" />
              <Button size="xs" type="submit" variant="outline">
                <Plus />
              </Button>
            </form>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold">Actions</div>
            <ul className="space-y-1.5">
              {capa.actions.map((a, i) => (
                <li key={i} className="flex gap-2 text-[13px]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {a}
                </li>
              ))}
              {capa.actions.length === 0 && <li className="text-xs text-muted-foreground">No actions yet.</li>}
            </ul>
            <form
              className="mt-2 flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                if (action.trim()) addNote(capa.id, 'actions', action.trim())
                setAction('')
              }}
            >
              <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Add action" className="h-7 text-xs" aria-label="Add an action" />
              <Button size="xs" type="submit" variant="outline">
                <Plus />
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
