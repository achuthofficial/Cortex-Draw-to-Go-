import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Wrench } from 'lucide-react'
import type { Machine, ScheduleBlock, WorkOrder } from '@/data/types'
import { formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface Downtime {
  machineId: string
  start: number
  end: number
  reason: string
  kind: 'Down' | 'Maintenance'
}

export interface GanttProps {
  machines: Machine[]
  blocks: ScheduleBlock[]
  workOrders: WorkOrder[]
  downtime: Downtime[]
  nowHour: number
  weekStart: Date
  days?: number
  hourWidth?: number
  onMove?: (blockId: string, machineId: string, start: number) => void
  onOpen?: (block: ScheduleBlock) => void
  preview?: Record<string, { machineId: string; start: number }>
  highlightWo?: string | null
}

const ROW_H = 38
const LABEL_W = 170
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function findConflicts(blocks: ScheduleBlock[], downtime: Downtime[]): Set<string> {
  const out = new Set<string>()
  const byMachine = new Map<string, ScheduleBlock[]>()
  for (const b of blocks) byMachine.set(b.machineId, [...(byMachine.get(b.machineId) ?? []), b])
  for (const [m, list] of byMachine) {
    const sorted = list.slice().sort((a, b) => a.start - b.start)
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].start < sorted[i].start + sorted[i].duration - 1e-6) {
          out.add(sorted[i].id)
          out.add(sorted[j].id)
        } else break
      }
      const b = sorted[i]
      if (downtime.some((d) => d.machineId === m && b.start < d.end && b.start + b.duration > d.start)) out.add(b.id)
    }
  }
  return out
}

export function GanttChart({ machines, blocks, workOrders, downtime, nowHour, weekStart, days = 6, hourWidth = 8, onMove, onOpen, preview, highlightWo }: GanttProps) {
  const totalW = days * 24 * hourWidth
  const bodyRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null)
  const conflicts = useMemo(() => findConflicts(blocks, downtime), [blocks, downtime])
  const woById = useMemo(() => new Map(workOrders.map((w) => [w.id, w])), [workOrders])
  const rowOf = (machineId: string) => machines.findIndex((m) => m.id === machineId)

  const commitDrag = (b: ScheduleBlock, dx: number, dy: number) => {
    const startH = Math.max(0, Math.min(days * 24 - b.duration, b.start + dx / hourWidth))
    const row = Math.max(0, Math.min(machines.length - 1, rowOf(b.machineId) + Math.round(dy / ROW_H)))
    onMove?.(b.id, machines[row].id, Math.round(startH * 2) / 2)
  }

  return (
    <div className="relative overflow-auto" ref={bodyRef}>
      <div style={{ width: LABEL_W + totalW }} className="relative">
        {/* Header */}
        <div className="sticky top-0 z-20 flex border-b bg-background">
          <div className="sticky left-0 z-30 flex shrink-0 items-end border-r bg-background px-3 pb-1 text-2xs font-semibold uppercase tracking-wide text-muted-foreground" style={{ width: LABEL_W }}>
            Machine
          </div>
          <div className="relative" style={{ width: totalW, height: 40 }}>
            {Array.from({ length: days }).map((_, d) => {
              const date = new Date(weekStart)
              date.setDate(date.getDate() + d)
              const today = Math.floor(nowHour / 24) === d
              return (
                <div key={d} className={cn('absolute top-0 h-full border-r', today && 'bg-primary/5')} style={{ left: d * 24 * hourWidth, width: 24 * hourWidth }}>
                  <div className={cn('px-2 pt-1 text-xs font-semibold', today && 'text-primary')}>
                    {DAY_NAMES[d]} <span className="num font-normal text-muted-foreground">{formatShortDate(date)}</span>
                  </div>
                  <div className="absolute bottom-0 flex w-full text-[9px] text-muted-foreground">
                    {[0, 6, 12, 18].map((h) => (
                      <span key={h} className="num absolute bottom-0.5" style={{ left: h * hourWidth + 2 }}>
                        {String(h).padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Rows */}
        {machines.map((m) => (
          <div key={m.id} className="flex border-b" style={{ height: ROW_H }}>
            <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-background px-3" style={{ width: LABEL_W }}>
              <span className={cn('h-2 w-2 shrink-0 rounded-full', m.state === 'Running' ? 'bg-emerald-500' : m.state === 'Down' ? 'bg-red-500' : m.state === 'Maintenance' ? 'bg-blue-500' : 'bg-amber-500')} />
              <span className="truncate text-xs font-medium">{m.name}</span>
            </div>
            <div className="relative" style={{ width: totalW }}>
              {/* Off-shift shading 22:00–06:00 */}
              {Array.from({ length: days }).map((_, d) => (
                <div key={d}>
                  <div className="absolute top-0 h-full bg-muted/60" style={{ left: d * 24 * hourWidth, width: 6 * hourWidth }} />
                  <div className="absolute top-0 h-full bg-muted/60" style={{ left: (d * 24 + 22) * hourWidth, width: 2 * hourWidth }} />
                </div>
              ))}
              {downtime
                .filter((d) => d.machineId === m.id)
                .map((d, i) => (
                  <div
                    key={i}
                    className={cn('absolute top-0 flex h-full items-center gap-1 overflow-hidden px-1.5 text-[10px] font-medium', d.kind === 'Down' ? 'bg-red-500/15 text-red-700 dark:text-red-400' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400')}
                    style={{ left: d.start * hourWidth, width: (d.end - d.start) * hourWidth, backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(0,0,0,0.05) 6px 12px)' }}
                    title={`${d.kind}: ${d.reason}`}
                  >
                    {d.kind === 'Down' ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Wrench className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{d.reason}</span>
                  </div>
                ))}
              {blocks
                .filter((b) => b.machineId === m.id)
                .map((b) => {
                  const wo = woById.get(b.woId)
                  const conflict = conflicts.has(b.id)
                  const isDrag = drag?.id === b.id
                  const moved = preview?.[b.id]
                  const risk = wo?.atRisk
                  const done = wo?.status === 'Completed' || b.start + b.duration <= nowHour
                  return (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${b.label}, ${b.duration} hours${conflict ? ', conflict' : ''}. Drag or use arrow keys to move.`}
                      title={`${b.label}\n${wo?.qty ?? ''} pcs · ${b.duration} h${conflict ? '\n⚠ Conflict' : ''}`}
                      onPointerDown={(e) => {
                        if (!onMove || e.button !== 0) return
                        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                        setDrag({ id: b.id, dx: 0, dy: 0, startX: e.clientX, startY: e.clientY, moved: false })
                      }}
                      onPointerMove={(e) => {
                        if (!drag || drag.id !== b.id) return
                        const dx = e.clientX - drag.startX
                        const dy = e.clientY - drag.startY
                        setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 4 })
                      }}
                      onPointerUp={() => {
                        if (!drag || drag.id !== b.id) return
                        if (drag.moved) commitDrag(b, drag.dx, drag.dy)
                        else onOpen?.(b)
                        setDrag(null)
                      }}
                      onKeyDown={(e) => {
                        if (!onMove) return
                        const r0 = rowOf(b.machineId)
                        if (e.key === 'ArrowRight') onMove(b.id, b.machineId, Math.min(days * 24 - b.duration, b.start + 1))
                        else if (e.key === 'ArrowLeft') onMove(b.id, b.machineId, Math.max(0, b.start - 1))
                        else if (e.key === 'ArrowDown' && r0 < machines.length - 1) onMove(b.id, machines[r0 + 1].id, b.start)
                        else if (e.key === 'ArrowUp' && r0 > 0) onMove(b.id, machines[r0 - 1].id, b.start)
                        else if (e.key === 'Enter') onOpen?.(b)
                        else return
                        e.preventDefault()
                      }}
                      className={cn(
                        'absolute top-1 flex h-[30px] cursor-grab select-none items-center gap-1 overflow-hidden rounded border px-1.5 text-[10px] font-medium shadow-sm transition-[box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing',
                        done ? 'border-slate-400/40 bg-slate-400/20 text-slate-600 dark:text-slate-300' : risk ? 'border-amber-500/60 bg-amber-500/20 text-amber-900 dark:text-amber-200' : 'border-blue-600/40 bg-blue-500/20 text-blue-900 dark:text-blue-100',
                        conflict && 'border-red-600 ring-1 ring-red-600',
                        isDrag && drag.moved && 'z-30 opacity-90 shadow-lg ring-2 ring-primary',
                        moved && 'opacity-35',
                        highlightWo === b.woId && 'ring-2 ring-primary',
                      )}
                      style={{
                        left: b.start * hourWidth,
                        width: Math.max(10, b.duration * hourWidth - 1),
                        transform: isDrag ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                      }}
                    >
                      {conflict && <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />}
                      <span className="num truncate">{b.label}</span>
                    </div>
                  )
                })}
              {/* Preview ghosts for the AI reschedule */}
              {preview &&
                Object.entries(preview)
                  .filter(([, p]) => p.machineId === m.id)
                  .map(([id, p]) => {
                    const b = blocks.find((x) => x.id === id)
                    if (!b) return null
                    return (
                      <div
                        key={`pv-${id}`}
                        className="absolute top-1 flex h-[30px] items-center gap-1 overflow-hidden rounded border-2 border-dashed border-ai bg-ai-soft px-1.5 text-[10px] font-medium text-ai"
                        style={{ left: p.start * hourWidth, width: b.duration * hourWidth - 1 }}
                      >
                        <span className="num truncate">✦ {b.label}</span>
                      </div>
                    )
                  })}
            </div>
          </div>
        ))}
        {/* Now line */}
        <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 bg-red-500" style={{ left: LABEL_W + nowHour * hourWidth }}>
          <span className="absolute -left-4 top-0 rounded bg-red-500 px-1 text-[9px] font-semibold text-white">Now</span>
        </div>
      </div>
    </div>
  )
}
