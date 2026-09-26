import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, GitCompare, Layers, Package } from 'lucide-react'
import { DrawingViewer } from '@/components/common/DrawingViewer'
import { MoneyText } from '@/components/common/MoneyText'
import { Field } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWorkspaceTab } from '@/app/useTab'
import { customerName, materialByCode } from '@/data/core'
import { getDrawing } from '@/data/drawings'
import type { BomLine, Part } from '@/data/types'
import { formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'

function BomTree({ lines, depth = 0, parts }: { lines: BomLine[]; depth?: number; parts: Part[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <BomRow key={`${l.partNo}-${i}`} line={l} depth={depth} parts={parts} />
      ))}
    </>
  )
}

function BomRow({ line, depth, parts }: { line: BomLine; depth: number; parts: Part[] }) {
  const [open, setOpen] = useState(depth < 1)
  const navigate = useNavigate()
  const part = parts.find((p) => p.partNo === line.partNo)
  const hasKids = !!line.children?.length
  return (
    <>
      <tr className="border-b hover:bg-accent/50">
        <td className="h-8 px-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {hasKids ? (
              <button className="rounded p-0.5 hover:bg-accent" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'}>
                {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-4.5 inline-block w-[18px]" />
            )}
            <span className="num text-2xs text-muted-foreground">{depth + 1}</span>
            {part ? (
              <button className="num font-medium text-primary hover:underline" onClick={() => navigate(`/parts/${part.partNo}`)}>
                {line.partNo}
              </button>
            ) : (
              <span className={cn(line.unit === 'kg' && 'text-muted-foreground')}>{line.partNo}</span>
            )}
          </div>
        </td>
        <td className="px-3 text-xs text-muted-foreground">{part?.description ?? (line.unit === 'kg' ? 'Raw material' : 'Bought-out item')}</td>
        <td className="num px-3 text-right">{line.qty}</td>
        <td className="px-3 text-xs">{line.unit}</td>
        <td className="px-3">{part && <StatusBadge status={part.status} />}</td>
      </tr>
      {open && hasKids && <BomTree lines={line.children!} depth={depth + 1} parts={parts} />}
    </>
  )
}

export function PartDetail() {
  const { partNo = '' } = useParams()
  const parts = useData((s) => s.parts)
  const rfqs = useData((s) => s.rfqs)
  const sos = useData((s) => s.salesOrders)
  const plans = useData((s) => s.plans)
  const navigate = useNavigate()
  const part = parts.find((p) => p.partNo === partNo)
  useWorkspaceTab('part', part?.partNo, part?.partNo ?? '', part ? `rev ${part.revision}` : undefined)
  const spec = useMemo(() => {
    if (!part?.drawingId) return null
    const d = getDrawing(part.drawingId)
    return { ...d, titleBlock: { ...d.titleBlock, partNo: part.partNo, revision: part.revision, description: part.description, material: part.material, materialSpec: materialByCode(part.material).name } }
  }, [part])
  if (!part) return <EmptyState title="Part not found" description={`${partNo} is not in the part master.`} />

  const whereUsed = parts.filter((p) => JSON.stringify(p.bom ?? []).includes(`"${part.partNo}"`))
  const history = [
    ...rfqs.filter((r) => r.parts.some((p) => p.partNo === part.partNo)).map((r) => ({ kind: 'Quote' as const, id: r.id, date: r.receivedAt, status: r.status, value: r.quotedValue, link: `/quotes/${r.id}` })),
    ...sos.filter((o) => o.lines.some((l) => l.partNo === part.partNo)).map((o) => ({ kind: 'Order' as const, id: o.id, date: o.orderDate, status: o.status, value: o.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0), link: `/orders/${o.id}` })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  const partPlans = plans.filter((p) => p.partNo === part.partNo)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-5 py-3">
        {part.isAssembly ? <Layers className="h-5 w-5 text-primary" /> : <Package className="h-5 w-5 text-primary" />}
        <h1 className="num text-lg font-semibold">{part.partNo}</h1>
        <span className="num rounded border px-1.5 text-xs font-semibold">rev {part.revision}</span>
        <StatusBadge status={part.status} />
        <span className="text-sm text-muted-foreground">{part.description}</span>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate(`/parts/${part.partNo}/compare`)} disabled={part.revisions.length < 2}>
          <GitCompare /> Compare revisions
        </Button>
      </div>
      <Tabs defaultValue={part.isAssembly ? 'bom' : 'overview'} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 px-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="drawings">Drawings</TabsTrigger>
          <TabsTrigger value="where">Where-used</TabsTrigger>
          <TabsTrigger value="history">Quote and order history</TabsTrigger>
          <TabsTrigger value="inspection">Inspection plan</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="min-h-0 flex-1 overflow-y-auto p-5">
          <Card className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
            <Field label="Customer">{customerName(part.customerId)}</Field>
            <Field label="Family">{part.family}</Field>
            <Field label="Material">{materialByCode(part.material).name}</Field>
            <Field label="Finished weight" mono>{part.weightKg} kg</Field>
            <Field label="Current revision" mono>{part.revision}</Field>
            <Field label="Last updated" mono>{formatDate(part.updatedAt)}</Field>
            <Field label="Revisions" mono>{part.revisions.length}</Field>
            <Field label="Open orders" mono>{sos.filter((o) => o.lines.some((l) => l.partNo === part.partNo) && o.status !== 'Invoiced').length}</Field>
          </Card>
          {spec && (
            <Card className="mt-4 h-[420px] overflow-hidden">
              <DrawingViewer spec={spec} showThumbnails={false} />
            </Card>
          )}
        </TabsContent>
        <TabsContent value="revisions" className="min-h-0 flex-1 overflow-y-auto p-5">
          <ol className="relative ml-3 border-l-2 pl-6">
            {part.revisions
              .slice()
              .reverse()
              .map((r, i) => (
                <li key={r.rev} className="mb-5">
                  <span className={cn('num absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background text-xs font-bold', i === 0 ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>{r.rev}</span>
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    Revision {r.rev} {i === 0 && <StatusBadge status="Released" />}
                    {r.ecoId && (
                      <button className="num text-xs font-normal text-primary hover:underline" onClick={() => navigate(`/eco/${r.ecoId}`)}>
                        {r.ecoId}
                      </button>
                    )}
                  </div>
                  <div className="num text-xs text-muted-foreground">
                    {formatDate(r.date)} · {r.by}
                  </div>
                  <p className="mt-1 text-[13px]">{r.change}</p>
                </li>
              ))}
          </ol>
        </TabsContent>
        <TabsContent value="bom" className="min-h-0 flex-1 overflow-y-auto p-5">
          {part.bom ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Multi-level BOM</CardTitle>
              </CardHeader>
              <table className="w-full text-[13px]">
                <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="h-8 px-3 text-left font-semibold">Item</th>
                    <th className="px-3 text-left font-semibold">Description</th>
                    <th className="px-3 text-right font-semibold">Qty</th>
                    <th className="px-3 text-left font-semibold">Unit</th>
                    <th className="px-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <BomTree lines={part.bom} parts={parts} />
                </tbody>
              </table>
            </Card>
          ) : (
            <EmptyState title="No BOM" description="This is a single machined part. Raw material comes from the routing and costing." />
          )}
        </TabsContent>
        <TabsContent value="drawings" className="min-h-0 flex-1">
          {spec ? <DrawingViewer spec={spec} /> : <EmptyState title="No drawing" description="Assemblies reference the drawings of their components." />}
        </TabsContent>
        <TabsContent value="where" className="min-h-0 flex-1 overflow-y-auto p-5">
          {whereUsed.length ? (
            <Card className="divide-y">
              {whereUsed.map((p) => (
                <button key={p.partNo} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50" onClick={() => navigate(`/parts/${p.partNo}`)}>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="num font-medium text-primary">{p.partNo}</span>
                  <span className="text-[13px]">{p.description}</span>
                  <StatusBadge status={p.status} className="ml-auto" />
                </button>
              ))}
            </Card>
          ) : (
            <EmptyState title="Not used in any assembly" />
          )}
        </TabsContent>
        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto p-5">
          {history.length ? (
            <Card className="divide-y">
              {history.map((h) => (
                <button key={h.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] hover:bg-accent/50" onClick={() => navigate(h.link)}>
                  <span className="w-12 text-xs text-muted-foreground">{h.kind}</span>
                  <span className="num font-medium text-primary">{h.id}</span>
                  <span className="num text-xs text-muted-foreground">{formatDate(h.date)}</span>
                  <StatusBadge status={h.status} />
                  <MoneyText value={h.value} decimals={false} className="ml-auto" />
                </button>
              ))}
            </Card>
          ) : (
            <EmptyState title="No quotes or orders yet" />
          )}
        </TabsContent>
        <TabsContent value="inspection" className="min-h-0 flex-1 overflow-y-auto p-5">
          {partPlans.length ? (
            <Card className="divide-y">
              {partPlans.map((p) => (
                <button key={p.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] hover:bg-accent/50" onClick={() => navigate(`/quality/plan/${p.id}`)}>
                  <span className="num font-medium text-primary">{p.id}</span>
                  <span>rev {p.revision}</span>
                  <span className="num text-xs text-muted-foreground">{formatNumber(p.characteristics.length)} characteristics</span>
                  <StatusBadge status={p.status} className="ml-auto" />
                </button>
              ))}
            </Card>
          ) : (
            <EmptyState title="No inspection plan" description="A plan is generated from the drawing when an order is received." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
