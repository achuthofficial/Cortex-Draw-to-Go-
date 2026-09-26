import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Clock, Factory, GripVertical, Plus, Sparkles, Trash2, Truck, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { AiLabel } from '@/components/common/AiMark'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import { supplierName, workCenters } from '@/data/core'
import type { Operation, QuoteState } from '@/data/types'
import { formatHours, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData, useRates } from '@/store/data'
import { EditableCell } from './EditableCell'

export function ProcessPlanTab({ quote }: { quote: QuoteState }) {
  const reorder = useData((s) => s.reorderOps)
  const updateOp = useData((s) => s.updateOp)
  const addOp = useData((s) => s.addOp)
  const deleteOp = useData((s) => s.deleteOp)
  const rates = useRates()
  const dragFrom = useRef<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<Operation | null>(null)
  const ops = quote.operations
  const qty = quote.costing.primaryQty
  const setupTotal = ops.reduce((a, o) => a + o.setupMin, 0)
  const cycleTotal = ops.reduce((a, o) => a + o.cycleMin, 0)

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <AiLabel>Process plan drafted from drawing</AiLabel>
        <span className="text-xs text-muted-foreground">
          <span className="num">{ops.length}</span> operations · setup <span className="num">{formatHours(setupTotal / 60)}</span> · cycle <span className="num">{cycleTotal} min/part</span>
        </span>
        <span className="ml-auto text-2xs text-muted-foreground">Drag to reorder, or use the arrow buttons</span>
      </div>
      <ol className="space-y-2">
        {ops.map((op, i) => {
          const outside = !!op.outside
          const rate = rates[op.workCenter] ?? 0
          const cost = outside ? (op.outside?.costPerPart ?? 0) * qty : ((op.setupMin + op.cycleMin * qty) / 60) * rate
          return (
            <li
              key={op.id}
              draggable
              onDragStart={(e) => {
                dragFrom.current = i
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(i)
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (dragFrom.current !== null && dragFrom.current !== i) {
                  reorder(quote.id, dragFrom.current, i)
                  toast.success(`Moved ${ops[dragFrom.current].name} to position ${i + 1}`)
                }
                dragFrom.current = null
                setOver(null)
              }}
              onDragEnd={() => setOver(null)}
            >
              <Card className={cn('group flex items-stretch gap-0 overflow-hidden shadow-none transition-shadow', over === i && 'ring-2 ring-primary', outside && 'border-dashed')}>
                <div className="flex w-7 shrink-0 cursor-grab flex-col items-center justify-center gap-1 border-r bg-muted/40 text-muted-foreground active:cursor-grabbing" aria-hidden>
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex w-14 shrink-0 flex-col items-center justify-center border-r">
                  <span className="text-2xs text-muted-foreground">Op</span>
                  <span className="num text-base font-semibold">{op.opNo}</span>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <EditableCell value={op.name} ariaLabel={`Name of op ${op.opNo}`} className="-ml-1.5 text-[13px] font-semibold" onCommit={(v) => updateOp(quote.id, op.id, { name: v })} />
                    </div>
                    <Tooltip content={<div className="space-y-1"><div className="flex items-center gap-1 font-medium text-ai"><Sparkles className="h-3 w-3" /> AI rationale</div><div>{op.rationale}</div></div>}>
                      <button className="rounded p-1 text-ai hover:bg-ai-soft focus-visible:ring-2 focus-visible:ring-ring" aria-label={`AI rationale: ${op.rationale}`}>
                        <Sparkles className="h-3.5 w-3.5" />
                      </button>
                    </Tooltip>
                    <span className="num w-24 text-right text-xs font-medium">{formatINR(cost, { decimals: false })}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {outside ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1">
                        <Truck className="h-3.5 w-3.5" /> {supplierName(op.outside!.supplierId)} · <span className="num">{formatINR(op.outside!.costPerPart, { decimals: false })}/pc</span> · <span className="num">{op.outside!.leadDays} days</span>
                      </span>
                    ) : (
                      <>
                        <Select value={op.workCenter} onValueChange={(v) => updateOp(quote.id, op.id, { workCenter: v })}>
                          <SelectTrigger className="h-7 w-[190px] text-xs" aria-label={`Machine for op ${op.opNo}`}>
                            <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {workCenters
                              .filter((w) => w.id !== 'wc-outside')
                              .map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                  {w.name} · ₹{rates[w.id] ?? w.hourlyRate}/h
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <label className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> Setup
                          <Input type="number" min={0} value={op.setupMin} onChange={(e) => updateOp(quote.id, op.id, { setupMin: Math.max(0, +e.target.value) })} className="num h-7 w-16 text-right text-xs" aria-label={`Setup minutes op ${op.opNo}`} />
                          min
                        </label>
                        <label className="inline-flex items-center gap-1 text-muted-foreground">
                          Cycle
                          <Input type="number" min={0} step={0.5} value={op.cycleMin} onChange={(e) => updateOp(quote.id, op.id, { cycleMin: Math.max(0, +e.target.value) })} className="num h-7 w-16 text-right text-xs" aria-label={`Cycle minutes op ${op.opNo}`} />
                          min/pc
                        </label>
                      </>
                    )}
                  </div>
                  {op.tooling && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{op.tooling}</span>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col justify-center gap-0.5 border-l p-1 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button variant="ghost" size="icon-xs" aria-label={`Move op ${op.opNo} up`} disabled={i === 0} onClick={() => reorder(quote.id, i, i - 1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label={`Move op ${op.opNo} down`} disabled={i === ops.length - 1} onClick={() => reorder(quote.id, i, i + 1)}>
                    <ArrowDown />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label={`Delete op ${op.opNo}`} className="hover:text-destructive" onClick={() => setToDelete(op)}>
                    <Trash2 />
                  </Button>
                </div>
              </Card>
              <div className="group/add flex h-3 items-center justify-center">
                <button
                  onClick={() => addOp(quote.id, i)}
                  className="flex items-center gap-1 rounded-full border bg-background px-2 text-2xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/add:opacity-100"
                  aria-label={`Add operation after op ${op.opNo}`}
                >
                  <Plus className="h-3 w-3" /> Add operation
                </button>
              </div>
            </li>
          )
        })}
      </ol>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => addOp(quote.id, ops.length - 1)}>
        <Plus /> Add operation
      </Button>
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Op {toDelete?.opNo} {toDelete?.name}?</AlertDialogTitle>
          <AlertDialogDescription>The cost and lead time will be recalculated. You can undo with Ctrl+Z.</AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              destructive
              onClick={() => {
                if (toDelete) {
                  deleteOp(quote.id, toDelete.id)
                  toast.success(`Deleted Op ${toDelete.opNo}`, { description: 'Press Ctrl+Z to undo.' })
                }
                setToDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
