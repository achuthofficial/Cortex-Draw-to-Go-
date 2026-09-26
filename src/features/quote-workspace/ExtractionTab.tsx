import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCheck, ChevronDown, ChevronRight, Flag, ListOrdered, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ConfidenceBadge, EditedChip } from '@/components/common/AiMark'
import { FeatureControlFrame } from '@/components/common/FeatureControlFrame'
import { GDT_LABEL } from '@/components/common/GdtGlyph'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SegmentedList, SegmentedTrigger, Tabs } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { ALL_MATERIALS } from '@/data/core'
import type { DimType, ItemStatus, MaterialModifier, QuoteState } from '@/data/types'
import { formatTolerance } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData, type ExtractKind } from '@/store/data'
import { EditableCell, parseNum } from './EditableCell'
import { reviewStats, type SelectionProps } from './shared'

type Filter = 'all' | 'attention' | 'done'

const DIM_TYPES: DimType[] = ['linear', 'diameter', 'radius', 'angle', 'thread', 'chamfer']

function statusRank(s: ItemStatus) {
  return s === 'Flagged' ? 0 : s === 'Pending' ? 1 : 2
}

function passes(f: Filter, s: ItemStatus) {
  if (f === 'attention') return s === 'Pending' || s === 'Flagged'
  if (f === 'done') return s === 'Accepted' || s === 'Edited'
  return true
}

export function ItemActions({ quoteId, kind, id, status }: { quoteId: string; kind: ExtractKind; id: string; status: ItemStatus }) {
  const setStatus = useData((s) => s.setItemStatus)
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip content="Accept (A)">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Accept"
          aria-pressed={status === 'Accepted'}
          className={cn(status === 'Accepted' && 'text-emerald-600')}
          onClick={(e) => {
            e.stopPropagation()
            setStatus(quoteId, kind, id, 'Accepted')
          }}
        >
          <Check />
        </Button>
      </Tooltip>
      <Tooltip content="Flag for follow-up (F)">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Flag"
          aria-pressed={status === 'Flagged'}
          className={cn(status === 'Flagged' && 'text-red-600')}
          onClick={(e) => {
            e.stopPropagation()
            setStatus(quoteId, kind, id, status === 'Flagged' ? 'Pending' : 'Flagged')
          }}
        >
          <Flag />
        </Button>
      </Tooltip>
    </div>
  )
}

function rowCls(id: string, sel: SelectionProps, status: ItemStatus) {
  return cn(
    'group cursor-pointer border-b transition-colors',
    status === 'Flagged' && 'bg-red-500/[0.04]',
    sel.hoveredId === id && 'bg-accent/70',
    sel.selectedId === id && 'bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]',
  )
}

function SectionHeader({ title, count, open, onToggle, right }: { title: string; count: string; open: boolean; onToggle: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex h-9 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
      <button onClick={onToggle} className="flex items-center gap-1.5 rounded text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={open}>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {title}
        <span className="num text-xs font-normal text-muted-foreground">{count}</span>
      </button>
      <div className="ml-auto">{right}</div>
    </div>
  )
}

const TH = 'h-7 px-2 text-left text-2xs font-semibold uppercase tracking-wide text-muted-foreground'

export function ExtractionTab({ quote, sel }: { quote: QuoteState; sel: SelectionProps }) {
  const updateDimension = useData((s) => s.updateDimension)
  const updateGdt = useData((s) => s.updateGdt)
  const updateNote = useData((s) => s.updateNote)
  const updateDatum = useData((s) => s.updateDatum)
  const updateTitleBlock = useData((s) => s.updateTitleBlock)
  const acceptHigh = useData((s) => s.acceptHighConfidence)
  const [filter, setFilter] = useState<Filter>('all')
  const [queueOrder, setQueueOrder] = useState(true)
  const [open, setOpen] = useState({ title: true, dims: true, gdt: true, datums: true, notes: true })
  const stats = reviewStats(quote)
  const qid = quote.id

  useEffect(() => {
    if (!sel.selectedId) return
    document.getElementById(`xrow-${sel.selectedId}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [sel.selectedId])

  const order = <T extends { n?: number; status: ItemStatus; confidence: number }>(items: T[]) =>
    queueOrder ? items.slice().sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.confidence - b.confidence) : items

  const dims = useMemo(() => order(quote.dimensions.filter((d) => passes(filter, d.status))), [quote.dimensions, filter, queueOrder]) // eslint-disable-line react-hooks/exhaustive-deps
  const gdt = useMemo(() => order(quote.gdt.filter((d) => passes(filter, d.status))), [quote.gdt, filter, queueOrder]) // eslint-disable-line react-hooks/exhaustive-deps
  const datums = quote.datums.filter((d) => passes(filter, d.status))
  const notes = quote.notes.filter((d) => passes(filter, d.status))
  const tb = quote.titleBlock

  const rowEvents = (id: string) => ({
    id: `xrow-${id}`,
    onClick: () => sel.onSelect(id),
    onMouseEnter: () => sel.onHover(id),
    onMouseLeave: () => sel.onHover(null),
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Review queue */}
      <div className="shrink-0 space-y-2 border-b bg-ai-soft/40 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Sparkles className="h-4 w-4 text-ai" /> Review queue
          </div>
          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            <Progress value={(stats.reviewed / Math.max(1, stats.total)) * 100} className="h-1.5 flex-1" indicatorClassName={stats.done ? 'bg-emerald-500' : 'bg-ai'} />
            <span className="num whitespace-nowrap text-xs">
              <strong>{stats.reviewed}</strong> of {stats.total} items reviewed
            </span>
          </div>
          {stats.flagged > 0 && <StatusBadge status="Flagged" className="num" dot={false} />}
          {stats.flagged > 0 && <span className="num -ml-2 text-xs text-red-600">{stats.flagged}</span>}
          <Button
            size="sm"
            variant="ai"
            disabled={stats.highPending === 0}
            onClick={() => {
              const n = acceptHigh(qid)
              toast.success(`Accepted ${n} high-confidence item${n === 1 ? '' : 's'}`, { description: 'Press Ctrl+Z to undo.' })
            }}
          >
            <CheckCheck /> Accept all high-confidence {stats.highPending > 0 && <span className="num opacity-80">({stats.highPending})</span>}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SegmentedList className="h-7">
              <SegmentedTrigger value="all" className="h-6">All</SegmentedTrigger>
              <SegmentedTrigger value="attention" className="h-6">
                Needs attention <span className="num">{stats.pending + stats.flagged}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="done" className="h-6">Reviewed</SegmentedTrigger>
            </SegmentedList>
          </Tabs>
          <Button size="xs" variant={queueOrder ? 'secondary' : 'ghost'} onClick={() => setQueueOrder((v) => !v)} aria-pressed={queueOrder}>
            <ListOrdered /> {queueOrder ? 'Low confidence first' : 'Drawing order'}
          </Button>
          <span className="ml-auto hidden text-2xs text-muted-foreground 2xl:inline">
            <kbd className="font-mono">J</kbd>/<kbd className="font-mono">K</kbd> next/prev · <kbd className="font-mono">A</kbd> accept · <kbd className="font-mono">F</kbd> flag · <kbd className="font-mono">Ctrl Z</kbd> undo
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {/* Title block */}
        <SectionHeader title="Title block" count="" open={open.title} onToggle={() => setOpen((o) => ({ ...o, title: !o.title }))} right={<ConfidenceBadge value={tb.confidence} />} />
        {open.title && (
          <Card className="m-3 grid grid-cols-3 gap-x-4 gap-y-2 p-3 shadow-none">
            {(
              [
                ['Part no.', 'partNo', true],
                ['Revision', 'revision', true],
                ['Description', 'description', false],
                ['Finish / coating', 'finish', false],
                ['Heat treatment', 'heatTreatment', false],
                ['General tolerance', 'generalTolerance', true],
                ['Scale', 'scale', true],
                ['Units', 'units', true],
              ] as const
            ).map(([label, key, mono]) => (
              <div key={key} className="min-w-0">
                <div className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
                <EditableCell value={tb[key]} ariaLabel={label} className={cn('-ml-1.5', mono && 'num')} onCommit={(v) => updateTitleBlock(qid, { [key]: v })} />
              </div>
            ))}
            <div className="min-w-0">
              <div className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Material</div>
              <Select value={tb.material} onValueChange={(v) => updateTitleBlock(qid, { material: v as typeof tb.material })}>
                <SelectTrigger className="-ml-1.5 h-6 border-transparent px-1.5 shadow-none hover:border-input" aria-label="Material">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MATERIALS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Dimensions */}
        <SectionHeader
          title="Dimensions"
          count={`${quote.dimensions.filter((d) => d.status === 'Accepted' || d.status === 'Edited').length}/${quote.dimensions.length}`}
          open={open.dims}
          onToggle={() => setOpen((o) => ({ ...o, dims: !o.dims }))}
        />
        {open.dims && (
          <table className="w-full min-w-[820px] table-fixed text-[13px]">
            <thead className="sticky top-9 z-10 bg-muted/90 backdrop-blur">
              <tr>
                <th className={cn(TH, 'w-9 text-right')}>#</th>
                <th className={cn(TH, 'w-[72px]')}>View</th>
                <th className={TH}>Feature</th>
                <th className={cn(TH, 'w-[76px] text-right')}>Nominal</th>
                <th className={cn(TH, 'w-[64px] text-right')}>Upper</th>
                <th className={cn(TH, 'w-[64px] text-right')}>Lower</th>
                <th className={cn(TH, 'w-[88px]')}>Type</th>
                <th className={cn(TH, 'w-[84px]')}>Conf.</th>
                <th className={cn(TH, 'w-[96px]')}>Status</th>
                <th className={cn(TH, 'w-[56px]')}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dims.map((d) => (
                <tr key={d.id} {...rowEvents(d.id)} className={rowCls(d.id, sel, d.status)} aria-selected={sel.selectedId === d.id}>
                  <td className="num h-8 px-2 text-right text-xs text-muted-foreground">{d.n}</td>
                  <td className="truncate px-2 text-xs text-muted-foreground">{d.view}</td>
                  <td className="truncate px-2" title={d.feature}>
                    <span className="num mr-1.5 rounded bg-muted px-1 py-px text-2xs">{d.label}</span>
                    {d.feature}
                  </td>
                  <td className="px-1">
                    <EditableCell numeric value={d.nominal} ariaLabel={`Nominal of #${d.n}`} onCommit={(v) => { const n = parseNum(v); if (n !== null) updateDimension(qid, d.id, { nominal: n }) }} />
                  </td>
                  <td className="px-1">
                    <EditableCell numeric value={d.upper} display={d.upper > 0 ? `+${d.upper}` : d.upper} ariaLabel={`Upper tolerance of #${d.n}`} onCommit={(v) => { const n = parseNum(v); if (n !== null) updateDimension(qid, d.id, { upper: n }) }} />
                  </td>
                  <td className="px-1">
                    <EditableCell numeric value={d.lower} ariaLabel={`Lower tolerance of #${d.n}`} onCommit={(v) => { const n = parseNum(v); if (n !== null) updateDimension(qid, d.id, { lower: n }) }} />
                  </td>
                  <td className="px-1" onClick={(e) => e.stopPropagation()}>
                    <Select value={d.type} onValueChange={(v) => updateDimension(qid, d.id, { type: v as DimType })}>
                      <SelectTrigger className="h-6 border-transparent px-1.5 text-xs capitalize shadow-none hover:border-input" aria-label={`Type of #${d.n}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIM_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2">
                    <ConfidenceBadge value={d.confidence} compact />
                  </td>
                  <td className="px-2">
                    {d.status === 'Edited' ? (
                      <EditedChip original={d.aiValue ? `${d.aiValue.nominal} ${formatTolerance(d.aiValue.upper, d.aiValue.lower)}` : undefined} />
                    ) : (
                      <StatusBadge status={d.status} />
                    )}
                  </td>
                  <td className="px-1">
                    <ItemActions quoteId={qid} kind="dimension" id={d.id} status={d.status} />
                  </td>
                </tr>
              ))}
              {dims.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-xs text-muted-foreground">
                    Nothing in this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* GD&T */}
        <SectionHeader
          title="GD&T"
          count={`${quote.gdt.filter((d) => d.status === 'Accepted' || d.status === 'Edited').length}/${quote.gdt.length}`}
          open={open.gdt}
          onToggle={() => setOpen((o) => ({ ...o, gdt: !o.gdt }))}
        />
        {open.gdt && (
          <table className="w-full min-w-[820px] table-fixed text-[13px]">
            <thead className="sticky top-9 z-10 bg-muted/90 backdrop-blur">
              <tr>
                <th className={cn(TH, 'w-9 text-right')}>#</th>
                <th className={cn(TH, 'w-[150px]')}>Frame</th>
                <th className={cn(TH, 'w-[70px] text-right')}>Tol.</th>
                <th className={cn(TH, 'w-[70px]')}>Mod.</th>
                <th className={cn(TH, 'w-[66px]')}>Datums</th>
                <th className={TH}>Feature</th>
                <th className={cn(TH, 'w-[84px]')}>Conf.</th>
                <th className={cn(TH, 'w-[96px]')}>Status</th>
                <th className={cn(TH, 'w-[56px]')}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {gdt.map((g) => (
                <tr key={g.id} {...rowEvents(g.id)} className={rowCls(g.id, sel, g.status)} aria-selected={sel.selectedId === g.id}>
                  <td className="num h-9 px-2 text-right text-xs text-muted-foreground">{g.n}</td>
                  <td className="px-2">
                    <Tooltip content={GDT_LABEL[g.symbol]}>
                      <span className="inline-flex">
                        <FeatureControlFrame callout={g} scale={1.1} />
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-1">
                    <EditableCell numeric value={g.tolerance} ariaLabel={`Tolerance of GD&T ${g.n}`} onCommit={(v) => { const n = parseNum(v); if (n !== null) updateGdt(qid, g.id, { tolerance: Math.abs(n) }) }} />
                  </td>
                  <td className="px-1" onClick={(e) => e.stopPropagation()}>
                    <Select value={g.modifier} onValueChange={(v) => updateGdt(qid, g.id, { modifier: v as MaterialModifier })}>
                      <SelectTrigger className="h-6 border-transparent px-1.5 text-xs shadow-none hover:border-input" aria-label={`Modifier of GD&T ${g.n}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RFS">RFS</SelectItem>
                        <SelectItem value="MMC">Ⓜ MMC</SelectItem>
                        <SelectItem value="LMC">Ⓛ LMC</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1">
                    <EditableCell
                      value={g.datums.join(' ') || '—'}
                      ariaLabel={`Datums of GD&T ${g.n}`}
                      className="num"
                      onCommit={(v) => updateGdt(qid, g.id, { datums: v.toUpperCase().split(/[\s,|]+/).filter((x) => /^[A-Z]$/.test(x)) })}
                    />
                  </td>
                  <td className="truncate px-2" title={g.feature}>
                    {g.feature}
                  </td>
                  <td className="px-2">
                    <ConfidenceBadge value={g.confidence} compact />
                  </td>
                  <td className="px-2">{g.status === 'Edited' ? <EditedChip /> : <StatusBadge status={g.status} />}</td>
                  <td className="px-1">
                    <ItemActions quoteId={qid} kind="gdt" id={g.id} status={g.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Datums */}
        <SectionHeader title="Datums" count={`${quote.datums.length}`} open={open.datums} onToggle={() => setOpen((o) => ({ ...o, datums: !o.datums }))} />
        {open.datums && (
          <ul>
            {datums.map((d) => (
              <li key={d.id} {...rowEvents(d.id)} className={cn(rowCls(d.id, sel, d.status), 'flex h-9 items-center gap-3 px-3')}>
                <span className="flex h-5 w-5 items-center justify-center border border-foreground font-mono text-xs font-bold">{d.letter}</span>
                <div className="min-w-0 flex-1">
                  <EditableCell value={d.feature} ariaLabel={`Datum ${d.letter} feature`} onCommit={(v) => updateDatum(qid, d.id, { feature: v })} />
                </div>
                <span className="text-xs text-muted-foreground">{d.view}</span>
                <ConfidenceBadge value={d.confidence} compact />
                {d.status === 'Edited' ? <EditedChip /> : <StatusBadge status={d.status} />}
                <ItemActions quoteId={qid} kind="datum" id={d.id} status={d.status} />
              </li>
            ))}
          </ul>
        )}

        {/* Notes */}
        <SectionHeader title="General notes" count={`${quote.notes.length}`} open={open.notes} onToggle={() => setOpen((o) => ({ ...o, notes: !o.notes }))} />
        {open.notes && (
          <ul className="pb-4">
            {notes.map((n) => (
              <li key={n.id} {...rowEvents(n.id)} className={cn(rowCls(n.id, sel, n.status), 'flex min-h-9 items-center gap-3 px-3 py-1')}>
                <span className="num w-5 text-right text-xs text-muted-foreground">{n.n}</span>
                <div className="min-w-0 flex-1">
                  <EditableCell value={n.text} ariaLabel={`Note ${n.n}`} onCommit={(v) => updateNote(qid, n.id, { text: v })} />
                </div>
                <ConfidenceBadge value={n.confidence} compact />
                {n.status === 'Edited' ? <EditedChip /> : <StatusBadge status={n.status} />}
                <ItemActions quoteId={qid} kind="note" id={n.id} status={n.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function ResetHint() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <RotateCcw className="h-3 w-3" /> Ctrl+Z undoes the last edit
    </span>
  )
}
