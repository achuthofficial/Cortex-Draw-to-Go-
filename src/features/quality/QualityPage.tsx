import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, Award, ExternalLink, FolderOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supplierName, userName } from '@/data/core'
import { certifications, controlledDocs } from '@/data/quality'
import type { Gauge, InspectionPlan, Ncr } from '@/data/types'
import { diffDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'
import { CapaBoard } from './CapaBoard'
import { planProgress } from './measure'

export function QualityPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'plans'
  const navigate = useNavigate()
  const plans = useData((s) => s.plans)
  const ncrs = useData((s) => s.ncrs)
  const gauges = useData((s) => s.gauges)
  const openTab = useUi((s) => s.openTab)
  const { loading, error, retry } = useSimulatedLoad()
  const [ncrFilter, setNcrFilter] = useState<'open' | 'all'>('open')

  const planCols = useMemo<ColumnDef<InspectionPlan>[]>(
    () => [
      { accessorKey: 'id', header: 'Plan', size: 110, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'partNo', header: 'Part', size: 130, cell: (c) => <span className="num">{c.getValue<string>()}</span> },
      { accessorKey: 'revision', header: 'Rev', size: 56, cell: (c) => <span className="num">{c.getValue<string>()}</span> },
      { accessorKey: 'woId', header: 'Work order', size: 120, cell: (c) => <span className="num">{c.getValue<string>() ?? '—'}</span> },
      { id: 'chars', accessorFn: (p) => p.characteristics.length, header: 'Characteristics', size: 120, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      { id: 'crit', accessorFn: (p) => p.characteristics.filter((x) => x.critical).length, header: 'Critical', size: 80, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      {
        id: 'progress',
        accessorFn: (p) => planProgress(p).pct,
        header: 'Measured',
        size: 170,
        cell: (c) => {
          const pr = planProgress(c.row.original)
          return (
            <div className="flex items-center gap-2">
              <Progress value={pr.pct} className="h-1.5 w-20" indicatorClassName={pr.fails ? 'bg-red-500' : 'bg-emerald-500'} />
              <span className="num text-xs">{pr.pct}%</span>
              {pr.fails > 0 && <span className="num text-xs text-red-600">{pr.fails} fail</span>}
            </div>
          )
        },
      },
      { accessorKey: 'createdAt', header: 'Created', size: 110, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: 'status', header: 'Status', size: 100, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  )

  const ncrCols = useMemo<ColumnDef<Ncr>[]>(
    () => [
      { accessorKey: 'id', header: 'NCR', size: 110, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'partNo', header: 'Part / material', size: 170, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { accessorKey: 'defect', header: 'Defect', size: 220 },
      { accessorKey: 'qty', header: 'Qty', size: 60, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      { accessorKey: 'source', header: 'Source', size: 120 },
      { id: 'ref', accessorFn: (n) => n.woId ?? (n.supplierId ? supplierName(n.supplierId) : ''), header: 'WO / supplier', size: 150 },
      { accessorKey: 'disposition', header: 'Disposition', size: 140, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: 'status', header: 'Status', size: 120, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: 'raisedAt', header: 'Raised', size: 110, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
    ],
    [],
  )

  const gaugeCols = useMemo<ColumnDef<Gauge>[]>(
    () => [
      { accessorKey: 'id', header: 'Gauge', size: 100, cell: (c) => <span className="num">{c.getValue<string>()}</span> },
      { accessorKey: 'name', header: 'Name', size: 220 },
      { accessorKey: 'type', header: 'Type', size: 150 },
      { accessorKey: 'range', header: 'Range', size: 130, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { accessorKey: 'location', header: 'Location', size: 120 },
      { accessorKey: 'lastCal', header: 'Last calibrated', size: 120, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
      {
        accessorKey: 'dueCal',
        header: 'Due',
        size: 150,
        cell: (c) => {
          const d = diffDays(c.getValue<string>())
          return (
            <span className={cn('num', d < 0 ? 'font-semibold text-red-600' : d <= 30 ? 'text-amber-600' : '')}>
              {formatDate(c.getValue<string>())} {d < 0 ? `· ${-d}d overdue` : d <= 30 ? `· in ${d}d` : ''}
            </span>
          )
        },
      },
    ],
    [],
  )

  const shownNcrs = ncrFilter === 'open' ? ncrs.filter((n) => n.status !== 'Closed') : ncrs
  const overdue = gauges.filter((g) => diffDays(g.dueCal) < 0).length

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Quality" description="Inspection plans generated from drawings, measurement reports, NCRs, CAPA and controlled documents." />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 px-5">
          <TabsTrigger value="plans">Inspection plans <span className="num text-2xs text-muted-foreground">{plans.length}</span></TabsTrigger>
          <TabsTrigger value="ncr">NCRs <span className="num rounded bg-red-500/15 px-1 text-2xs text-red-700 dark:text-red-400">{ncrs.filter((n) => n.status !== 'Closed').length}</span></TabsTrigger>
          <TabsTrigger value="capa">CAPA board</TabsTrigger>
          <TabsTrigger value="documents">
            Documents and gauges {overdue > 0 && <span className="num rounded bg-red-500/15 px-1 text-2xs text-red-700 dark:text-red-400">{overdue}</span>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="min-h-0 flex-1">
          <DataTable
            className="h-full"
            data={plans}
            columns={planCols}
            getRowId={(p) => p.id}
            loading={loading}
            error={error}
            onRetry={retry}
            onOpen={(p) => navigate(`/quality/plan/${p.id}`)}
            rowActions={(p) => [
              { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/quality/plan/${p.id}`) },
              { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `plan:${p.id}`, kind: 'plan', title: p.id, subtitle: p.partNo, path: `/quality/plan/${p.id}` }) },
            ]}
            empty={{ title: 'No inspection plans', description: 'Plans are generated automatically when a quote is won.' }}
          />
        </TabsContent>
        <TabsContent value="ncr" className="min-h-0 flex-1">
          <DataTable
            className="h-full"
            data={shownNcrs}
            columns={ncrCols}
            getRowId={(n) => n.id}
            loading={loading}
            error={error}
            onRetry={retry}
            onOpen={(n) => navigate(`/quality/ncr/${n.id}`)}
            toolbar={
              <Button size="sm" variant="outline" className="h-7" onClick={() => setNcrFilter((f) => (f === 'open' ? 'all' : 'open'))}>
                {ncrFilter === 'open' ? 'Showing open' : 'Showing all'}
              </Button>
            }
            rowActions={(n) => [
              { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/quality/ncr/${n.id}`) },
              { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `ncr:${n.id}`, kind: 'ncr', title: n.id, subtitle: n.partNo, path: `/quality/ncr/${n.id}` }) },
            ]}
            empty={{ title: 'No open NCRs', description: 'Nonconformances raised on the shop floor or at incoming inspection appear here.' }}
          />
        </TabsContent>
        <TabsContent value="capa" className="min-h-0 flex-1">
          <CapaBoard />
        </TabsContent>
        <TabsContent value="documents" className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 p-5 xl:grid-cols-3">
            {certifications.map((c) => {
              const d = diffDays(c.expires)
              return (
                <Card key={c.name}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <Award className={cn('h-8 w-8', d < 120 ? 'text-amber-500' : 'text-emerald-600')} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.body} · <span className="num">{c.certNo}</span>
                      </div>
                      <div className="num mt-1 text-xs">
                        Expires {formatDate(c.expires)} · <span className={cn(d < 120 && 'font-semibold text-amber-600')}>{d} days left</span>
                      </div>
                    </div>
                    {d < 120 && <Badge variant="amber">Plan audit</Badge>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="grid gap-4 px-5 pb-5 2xl:grid-cols-[1fr_1.4fr]">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Controlled documents</CardTitle>
                <Button size="xs" variant="outline" onClick={() => toast('Document upload is not part of the prototype')}>
                  <Plus /> New document
                </Button>
              </CardHeader>
              <table className="w-full text-[13px]">
                <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="h-8 px-3 text-left font-semibold">Doc</th>
                    <th className="px-3 text-left font-semibold">Title</th>
                    <th className="px-3 text-left font-semibold">Rev</th>
                    <th className="px-3 text-left font-semibold">Owner</th>
                    <th className="px-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {controlledDocs.map((d) => (
                    <tr key={d.id} className="hover:bg-accent/50">
                      <td className="num h-8 px-3 text-xs">{d.id}</td>
                      <td className="px-3">{d.title}</td>
                      <td className="num px-3">{d.rev}</td>
                      <td className="px-3 text-xs">{userName(d.owner)}</td>
                      <td className="px-3">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card className="flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Gauge calibration register
                  {overdue > 0 && (
                    <Badge variant="red">
                      <AlertTriangle /> {overdue} overdue
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <DataTable data={gauges} columns={gaugeCols} getRowId={(g) => g.id} hideSearch initialSorting={[{ id: 'dueCal', desc: false }]} rowClassName={(g) => (diffDays(g.dueCal) < 0 ? 'bg-red-500/[0.05]' : undefined)} />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
