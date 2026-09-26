import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { DrawingViewer } from '@/components/common/DrawingViewer'
import { EmptyState } from '@/components/common/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDrawing } from '@/data/drawings'
import type { Dimension, DrawingSpec } from '@/data/types'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'

type Change = { id: string; kind: 'Modified' | 'Added' | 'Removed'; feature: string; before: string; after: string }

/** Builds a plausible previous revision by rolling back a few characteristics. */
function previousRevision(spec: DrawingSpec, prevRev: string): { prev: DrawingSpec; changes: Change[] } {
  const edits: Record<string, Partial<Dimension>> = {}
  const removed = new Set<string>()
  if (spec.template === 'shaft') {
    edits['shaft-d2'] = { label: 'Ø30 h7' }
    edits['shaft-d24'] = { label: '4× Ø6.4 THRU' }
    removed.add('shaft-d29').add('shaft-d30').add('shaft-d39')
  } else if (spec.template === 'flange') {
    edits['flange-d6'] = { label: 'Ø60 H8' }
    removed.add('flange-d25').add('flange-d26').add('flange-d27').add('flange-d8').add('flange-d9')
  } else {
    edits['bracket-d4'] = { label: 'Ø28 H8' }
    edits['bracket-d6'] = { label: '72 ±0.1' }
    removed.add('bracket-d16').add('bracket-d17')
  }
  const changes: Change[] = []
  const dims = spec.dimensions
    .filter((d) => !removed.has(d.id))
    .map((d) => {
      const e = edits[d.id]
      if (!e) return d
      changes.push({ id: d.id, kind: 'Modified', feature: d.feature, before: e.label ?? d.label, after: d.label })
      return { ...d, ...e }
    })
  for (const id of removed) {
    const d = spec.dimensions.find((x) => x.id === id)
    if (d) changes.push({ id, kind: 'Added', feature: d.feature, before: '—', after: d.label })
  }
  return { prev: { ...spec, dimensions: dims, gdt: spec.template === 'shaft' ? spec.gdt.filter((g) => g.id !== 'shaft-g1') : spec.gdt, titleBlock: { ...spec.titleBlock, revision: prevRev } }, changes }
}

export function RevisionCompare() {
  const { partNo = '' } = useParams()
  const part = useData((s) => s.parts.find((p) => p.partNo === partNo))
  const navigate = useNavigate()
  const [hover, setHover] = useState<string | null>(null)
  const data = useMemo(() => {
    if (!part?.drawingId || part.revisions.length < 2) return null
    const base = getDrawing(part.drawingId)
    const cur = { ...base, titleBlock: { ...base.titleBlock, partNo: part.partNo, revision: part.revision } }
    const prevRev = part.revisions[part.revisions.length - 2].rev
    const { prev, changes } = previousRevision(cur, prevRev)
    return { cur, prev, changes, prevRev }
  }, [part])
  if (!part) return <EmptyState title="Part not found" />
  if (!data) return <EmptyState title="Nothing to compare" description="This part has a single revision or no drawing." />
  const changedIds = new Set(data.changes.map((c) => c.id))
  const itemsFor = (spec: DrawingSpec) => ({ dimensions: spec.dimensions.filter((d) => changedIds.has(d.id)), gdt: [], datums: [], notes: [], titleConfidence: 100 })
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/parts/${part.partNo}`)}>
          <ArrowLeft /> {part.partNo}
        </Button>
        <h1 className="text-base font-semibold">
          Revision compare · rev <span className="num">{data.prevRev}</span> → rev <span className="num">{part.revision}</span>
        </h1>
        <Badge variant="violet">
          <Sparkles /> {data.changes.length} changes detected
        </Badge>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x">
        <div className="flex min-h-0 flex-col">
          <div className="border-b bg-muted/40 px-3 py-1 text-xs font-semibold">Rev {data.prevRev} (previous)</div>
          <DrawingViewer spec={data.prev} items={itemsFor(data.prev)} showThumbnails={false} hoveredId={hover} onHover={setHover} />
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="border-b bg-muted/40 px-3 py-1 text-xs font-semibold">Rev {part.revision} (current)</div>
          <DrawingViewer spec={data.cur} items={itemsFor(data.cur)} showThumbnails={false} hoveredId={hover} onHover={setHover} />
        </div>
      </div>
      <div className="max-h-48 shrink-0 overflow-y-auto border-t">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-muted/90 text-2xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="h-7 px-3 text-left font-semibold">Change</th>
              <th className="px-3 text-left font-semibold">Feature</th>
              <th className="px-3 text-left font-semibold">Rev {data.prevRev}</th>
              <th className="px-3 text-left font-semibold">Rev {part.revision}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.changes.map((c) => (
              <tr key={c.id} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} className={cn('hover:bg-accent/50', hover === c.id && 'bg-accent/70')}>
                <td className="h-8 px-3">
                  <Badge variant={c.kind === 'Added' ? 'green' : c.kind === 'Removed' ? 'red' : 'amber'}>{c.kind}</Badge>
                </td>
                <td className="px-3">{c.feature}</td>
                <td className="num px-3 text-muted-foreground line-through decoration-red-500/60">{c.before}</td>
                <td className="num px-3 font-medium">{c.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
