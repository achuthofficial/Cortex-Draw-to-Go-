import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CheckCircle2, ClipboardCheck, Download, FileBadge, Ruler } from 'lucide-react'
import { toast } from 'sonner'
import { AiLabel } from '@/components/common/AiMark'
import { DrawingViewer } from '@/components/common/DrawingViewer'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWorkspaceTab } from '@/app/useTab'
import { company, customerName } from '@/data/core'
import { getDrawing } from '@/data/drawings'
import type { InspectionPlan } from '@/data/types'
import { formatDate } from '@/lib/format'
import { platform } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { planProgress, verdict } from './measure'

export function InspectionPlanDetail() {
  const { id = '' } = useParams()
  const plan = useData((s) => s.plans.find((p) => p.id === id))
  const approve = useData((s) => s.approvePlan)
  const parts = useData((s) => s.parts)
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [tab, setTab] = useState('plan')
  useWorkspaceTab('plan', plan?.id, plan?.id ?? '', plan?.partNo)

  const base = plan ? getDrawing(plan.drawingId) : null
  const spec = useMemo(() => (base && plan ? { ...base, titleBlock: { ...base.titleBlock, partNo: plan.partNo, revision: plan.revision } } : null), [base, plan])
  const ids = useMemo(() => new Set(plan?.characteristics.map((c) => c.refId)), [plan])
  const items = useMemo(
    () => (spec ? { dimensions: spec.dimensions.filter((d) => ids.has(d.id)), gdt: spec.gdt.filter((g) => ids.has(g.id)), datums: spec.datums, notes: [], titleConfidence: 100 } : undefined),
    [spec, ids],
  )

  if (!plan || !spec) return <EmptyState title="Inspection plan not found" />
  const pr = planProgress(plan)
  const part = parts.find((p) => p.partNo === plan.partNo)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="num text-base font-semibold">{plan.id}</h1>
            <StatusBadge status={plan.status} />
            <AiLabel>Generated from drawing</AiLabel>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="num text-foreground">{plan.partNo}</span> rev <span className="num">{plan.revision}</span> · {part ? customerName(part.customerId) : ''} · WO{' '}
            {plan.woId ? (
              <button className="num text-primary hover:underline" onClick={() => navigate(`/production/wo/${plan.woId}`)}>
                {plan.woId}
              </button>
            ) : (
              '—'
            )}{' '}
            · {plan.characteristics.length} characteristics · sample size {plan.sampleSize}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="num text-xs text-muted-foreground">
            {pr.measured}/{pr.total} measured {pr.fails > 0 && <span className="font-semibold text-red-600">· {pr.fails} out of tolerance</span>}
          </span>
          {plan.status === 'Draft' && (
            <Button
              size="sm"
              onClick={() => {
                approve(plan.id)
                toast.success(`${plan.id} approved`)
              }}
            >
              <CheckCircle2 /> Approve plan
            </Button>
          )}
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0">
          <TabsTrigger value="plan">
            <Ruler /> Plan
          </TabsTrigger>
          <TabsTrigger value="report">
            <ClipboardCheck /> Inspection report
          </TabsTrigger>
          <TabsTrigger value="fai">
            <FileBadge /> First article (AS9102)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="min-h-0 flex-1">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={45} minSize={30}>
              <DrawingViewer
                spec={spec}
                items={items}
                balloons
                overlaysDefault={false}
                selectedId={selected}
                hoveredId={hovered}
                onSelect={(i) => setSelected(i)}
                onHover={setHovered}
                balloonFilter={(o) => ids.has(o.id)}
              />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/40" />
            <Panel defaultSize={55} minSize={35}>
              <CharTable plan={plan} selected={selected} hovered={hovered} onSelect={setSelected} onHover={setHovered} />
            </Panel>
          </PanelGroup>
        </TabsContent>
        <TabsContent value="report" className="min-h-0 flex-1 overflow-auto">
          <ReportEntry plan={plan} />
        </TabsContent>
        <TabsContent value="fai" className="min-h-0 flex-1 overflow-auto">
          <FaiForms plan={plan} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CharTable({ plan, selected, hovered, onSelect, onHover }: { plan: InspectionPlan; selected: string | null; hovered: string | null; onSelect: (id: string) => void; onHover: (id: string | null) => void }) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[640px] text-[13px]">
        <thead className="sticky top-0 z-10 bg-muted/90 text-2xs uppercase tracking-wide text-muted-foreground backdrop-blur">
          <tr>
            <th className="h-8 w-12 px-2 text-center font-semibold">Balloon</th>
            <th className="px-2 text-left font-semibold">Characteristic</th>
            <th className="px-2 text-left font-semibold">Nominal</th>
            <th className="px-2 text-left font-semibold">Tolerance</th>
            <th className="px-2 text-left font-semibold">Gauge / method</th>
            <th className="px-2 text-left font-semibold">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {plan.characteristics.map((c) => (
            <tr
              key={c.balloon}
              ref={(el) => {
                if (el && selected === c.refId) el.scrollIntoView({ block: 'nearest' })
              }}
              onClick={() => onSelect(c.refId)}
              onMouseEnter={() => onHover(c.refId)}
              onMouseLeave={() => onHover(null)}
              className={cn('cursor-pointer border-b', hovered === c.refId && 'bg-accent/70', selected === c.refId && 'bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]')}
            >
              <td className="h-8 px-2 text-center">
                <span className="num inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-600 text-2xs font-bold text-red-600">{c.balloon}</span>
              </td>
              <td className="max-w-[220px] truncate px-2" title={c.characteristic}>
                {c.characteristic} {c.critical && <Badge variant="red" className="ml-1">CC</Badge>}
              </td>
              <td className="num px-2 text-xs">{c.nominal}</td>
              <td className="num px-2 text-xs">{c.tolerance}</td>
              <td className="px-2 text-xs">{c.method}</td>
              <td className="px-2 text-xs text-muted-foreground">{c.frequency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReportEntry({ plan }: { plan: InspectionPlan }) {
  const setMeasurement = useData((s) => s.setMeasurement)
  const measurable = plan.characteristics.filter((c) => c.lsl !== undefined)
  const pr = planProgress(plan)
  const passParts = Array.from({ length: plan.sampleSize }, (_, i) => {
    const vals = measurable.map((c) => verdict(c, plan.measurements[c.balloon]?.[i]))
    if (vals.every((v) => v === 'Pending')) return 'Pending'
    if (vals.some((v) => v === 'Fail')) return 'Fail'
    return vals.some((v) => v === 'Pending') ? 'In progress' : 'Pass'
  })
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold">Measured values per part</div>
        <span className="text-xs text-muted-foreground">Values outside LSL/USL turn red automatically.</span>
        <div className="ml-auto flex gap-2">
          {passParts.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs">
              Part {i + 1}: <StatusBadge status={p === 'In progress' ? 'In progress' : p} />
            </span>
          ))}
        </div>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-3 text-center text-xs sm:grid-cols-4">
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Measurements</div>
          <div className="num text-lg font-semibold">
            {pr.measured}/{pr.total}
          </div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Pass</div>
          <div className="num text-lg font-semibold text-emerald-600">{pr.measured - pr.fails}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Fail</div>
          <div className={cn('num text-lg font-semibold', pr.fails ? 'text-red-600' : '')}>{pr.fails}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Result</div>
          <div className={cn('text-lg font-semibold', pr.fails ? 'text-red-600' : pr.measured === pr.total ? 'text-emerald-600' : 'text-muted-foreground')}>{pr.fails ? 'Reject' : pr.measured === pr.total ? 'Accept' : 'Open'}</div>
        </div>
      </div>
      <table className="w-full min-w-[900px] text-[13px]">
        <thead className="bg-muted/70 text-2xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="h-8 w-10 px-2 text-center font-semibold">#</th>
            <th className="px-2 text-left font-semibold">Characteristic</th>
            <th className="px-2 text-right font-semibold">LSL</th>
            <th className="px-2 text-right font-semibold">USL</th>
            {Array.from({ length: plan.sampleSize }, (_, i) => (
              <th key={i} className="w-24 px-1 text-center font-semibold">
                Part {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {measurable.map((c) => (
            <tr key={c.balloon}>
              <td className="num h-8 px-2 text-center text-xs font-semibold text-red-600">{c.balloon}</td>
              <td className="max-w-[260px] truncate px-2 text-xs" title={c.characteristic}>
                {c.characteristic} <span className="text-muted-foreground">· {c.method}</span>
              </td>
              <td className="num px-2 text-right text-xs">{c.lsl}</td>
              <td className="num px-2 text-right text-xs">{c.usl}</td>
              {Array.from({ length: plan.sampleSize }, (_, i) => {
                const v = plan.measurements[c.balloon]?.[i] ?? null
                const verd = verdict(c, v)
                return (
                  <td key={i} className="px-1 py-0.5">
                    <input
                      defaultValue={v ?? ''}
                      key={`${c.balloon}-${i}-${v}`}
                      inputMode="decimal"
                      aria-label={`Balloon ${c.balloon}, part ${i + 1}`}
                      onBlur={(e) => {
                        const raw = e.target.value.trim()
                        const n = raw === '' ? null : parseFloat(raw)
                        if (n === null || Number.isFinite(n)) setMeasurement(plan.id, c.balloon, i, n)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      className={cn(
                        'num h-7 w-full rounded border px-1.5 text-right text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        verd === 'Pass' && 'border-emerald-600/40 bg-emerald-500/10',
                        verd === 'Fail' && 'border-red-600/50 bg-red-500/15 font-semibold text-red-700 dark:text-red-400',
                        verd === 'Pending' && 'bg-background',
                      )}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FaiForms({ plan }: { plan: InspectionPlan }) {
  const part = useData((s) => s.parts.find((p) => p.partNo === plan.partNo))
  const cell = 'border border-slate-300 px-2 py-1'
  return (
    <div className="space-y-4 bg-muted/40 p-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">AS9102 first article inspection report</span>
        <span className="text-xs text-muted-foreground">Mock forms populated from the inspection plan</span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={async () => {
            await platform.exportPdf(`${plan.id}-FAI.pdf`, 'fai-forms')
            toast.success(`${plan.id}-FAI.pdf generated (mock)`)
          }}
        >
          <Download /> Export PDF
        </Button>
      </div>
      <div id="fai-forms" className="mx-auto max-w-5xl space-y-4 text-[11px] text-slate-800">
        <section className="bg-white p-5 shadow ring-1 ring-black/5">
          <h3 className="mb-2 text-sm font-bold">Form 1 · Part number accountability</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={cell}><b>1. Part number</b><br /><span className="font-mono">{plan.partNo}</span></td>
                <td className={cell}><b>2. Part name</b><br />{part?.description ?? '—'}</td>
                <td className={cell}><b>3. Serial number</b><br /><span className="font-mono">FA-001</span></td>
                <td className={cell}><b>4. FAI report number</b><br /><span className="font-mono">{plan.id}-FAI</span></td>
              </tr>
              <tr>
                <td className={cell}><b>5. Part revision level</b><br /><span className="font-mono">{plan.revision}</span></td>
                <td className={cell}><b>6. Drawing number</b><br /><span className="font-mono">{plan.partNo}</span></td>
                <td className={cell}><b>7. Drawing revision</b><br /><span className="font-mono">{plan.revision}</span></td>
                <td className={cell}><b>8. Additional changes</b><br />None</td>
              </tr>
              <tr>
                <td className={cell}><b>9. Manufacturing process reference</b><br /><span className="font-mono">{plan.woId ?? '—'}</span></td>
                <td className={cell}><b>10. Organisation name</b><br />{company.name}</td>
                <td className={cell}><b>11. Supplier code</b><br /><span className="font-mono">PW-HYD-01</span></td>
                <td className={cell}><b>14. FAI</b><br />☑ Full FAI ☐ Partial FAI</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className="bg-white p-5 shadow ring-1 ring-black/5">
          <h3 className="mb-2 text-sm font-bold">Form 2 · Product accountability: raw material, specifications and special processes</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className={cell}>6. Material or process name</th>
                <th className={cell}>7. Specification number</th>
                <th className={cell}>8. Code</th>
                <th className={cell}>9. Special process supplier code</th>
                <th className={cell}>10. Customer approval</th>
                <th className={cell}>11. Certificate of conformance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={cell}>{part?.material ?? 'EN19'} round bar</td>
                <td className={cell}>IS 1570 / EN 10204 3.1</td>
                <td className={cell}>RM</td>
                <td className={cell}>Ironvale Steels</td>
                <td className={cell}>N/A</td>
                <td className={cell}>Heat 7Q2204 · TC-2231</td>
              </tr>
              <tr>
                <td className={cell}>Hardening and tempering</td>
                <td className={cell}>28–32 HRC per drawing note 1</td>
                <td className={cell}>SP</td>
                <td className={cell}>Agnikund Heat Treaters</td>
                <td className={cell}>Approved</td>
                <td className={cell}>HT-26-1187</td>
              </tr>
              <tr>
                <td className={cell}>Black oxide</td>
                <td className={cell}>MIL-DTL-13924 Class 1</td>
                <td className={cell}>SP</td>
                <td className={cell}>Chamak Surface Finishers</td>
                <td className={cell}>Approved</td>
                <td className={cell}>CSF-5520</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className="bg-white p-5 shadow ring-1 ring-black/5">
          <h3 className="mb-2 text-sm font-bold">Form 3 · Characteristic accountability, verification and compatibility evaluation</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className={cell}>5. Char no.</th>
                <th className={cell}>6. Reference location</th>
                <th className={cell}>7. Characteristic designator</th>
                <th className={cell}>8. Requirement</th>
                <th className={cell}>9. Results</th>
                <th className={cell}>10. Designed tooling</th>
                <th className={cell}>11. Nonconformance no.</th>
              </tr>
            </thead>
            <tbody>
              {plan.characteristics.map((c) => {
                const v = plan.measurements[c.balloon]?.[0]
                const verd = verdict(c, v)
                return (
                  <tr key={c.balloon}>
                    <td className={cn(cell, 'text-center font-mono')}>{c.balloon}</td>
                    <td className={cell}>Sheet 1</td>
                    <td className={cell}>{c.critical ? 'Key' : '—'}</td>
                    <td className={cell}>
                      <span className="font-mono">{c.nominal}</span> ({c.tolerance})
                    </td>
                    <td className={cn(cell, 'font-mono', verd === 'Fail' && 'bg-red-50 font-bold text-red-700')}>{v ?? (c.lsl === undefined ? 'Conforms' : '—')}</td>
                    <td className={cell}>{c.method}</td>
                    <td className={cell}>{verd === 'Fail' ? 'NCR required' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-3 flex justify-between text-[10px] text-slate-500">
            <span>Prepared by Lakshmi Iyer (Quality) · {formatDate(new Date())}</span>
            <span>Approved by ____________________</span>
          </div>
        </section>
      </div>
    </div>
  )
}
