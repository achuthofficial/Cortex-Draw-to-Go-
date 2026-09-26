import { useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Pause, Play, Tablet } from 'lucide-react'
import { toast } from 'sonner'
import { AXIS, C, ChartCard, GRID, TOOLTIP } from '@/components/common/charts'
import { Field } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useWorkspaceTab } from '@/app/useTab'
import { customerName, workCenterName } from '@/data/core'
import { formatDate, formatHours } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useData } from '@/store/data'

export function WorkOrderDetail() {
  const { id = '' } = useParams()
  const wo = useData((s) => s.workOrders.find((w) => w.id === id))
  const so = useData((s) => s.salesOrders.find((o) => o.id === wo?.soId))
  const plan = useData((s) => s.plans.find((p) => p.woId === id))
  const ncrs = useData(useShallow((s) => s.ncrs.filter((n) => n.woId === id)))
  const action = useData((s) => s.woAction)
  const navigate = useNavigate()
  useWorkspaceTab('wo', wo?.id, wo?.id ?? '', wo?.partNo)
  if (!wo) return <EmptyState title="Work order not found" />
  const done = wo.operations.filter((o) => o.status === 'Done').length
  const chart = wo.operations.map((o) => ({ op: `Op ${o.opNo}`, Planned: +(o.plannedMin / 60).toFixed(1), Actual: +(o.actualMin / 60).toFixed(1) }))
  const running = wo.operations.some((o) => o.status === 'Running')
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="num text-lg font-semibold">{wo.id}</h1>
        <StatusBadge status={wo.status} />
        <StatusBadge status={wo.priority} dot={false} />
        {wo.atRisk && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" /> At risk: waiting on VMC 2
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/operator/${wo.id}`)}>
            <Tablet /> Operator mode
          </Button>
          {running ? (
            <Button size="sm" variant="outline" onClick={() => { action(wo.id, 'pause'); toast('Paused') }}>
              <Pause /> Pause
            </Button>
          ) : (
            <Button size="sm" disabled={wo.status === 'Completed'} onClick={() => { action(wo.id, 'start'); toast.success('Next operation started') }}>
              <Play /> Start next op
            </Button>
          )}
        </div>
      </div>
      <Card className="mb-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-4 xl:grid-cols-7">
        <Field label="Part" mono>
          <button className="text-primary hover:underline" onClick={() => navigate(`/parts/${wo.partNo}`)}>
            {wo.partNo}
          </button>
        </Field>
        <Field label="Customer">{so ? customerName(so.customerId) : '—'}</Field>
        <Field label="Sales order" mono>
          <button className="text-primary hover:underline" onClick={() => navigate(`/orders/${wo.soId}`)}>
            {wo.soId}
          </button>
        </Field>
        <Field label="Quantity" mono>{wo.qty}</Field>
        <Field label="Good / scrap" mono>
          {wo.good} / <span className={cn(wo.scrap > 0 && 'text-red-600')}>{wo.scrap}</span>
        </Field>
        <Field label="Start" mono>{formatDate(wo.startDate)}</Field>
        <Field label="Due" mono>{formatDate(wo.dueDate)}</Field>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <span className="num text-xs text-muted-foreground">
              {done}/{wo.operations.length} done
            </span>
          </CardHeader>
          <table className="w-full text-[13px]">
            <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="h-8 px-3 text-left font-semibold">Op</th>
                <th className="px-3 text-left font-semibold">Operation</th>
                <th className="px-3 text-left font-semibold">Work centre</th>
                <th className="px-3 text-right font-semibold">Planned</th>
                <th className="px-3 text-right font-semibold">Actual</th>
                <th className="px-3 text-right font-semibold">Good</th>
                <th className="px-3 text-right font-semibold">Scrap</th>
                <th className="px-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wo.operations.map((o) => (
                <tr key={o.opNo} className={cn(o.status === 'Running' && 'bg-emerald-500/5')}>
                  <td className="num h-9 px-3">{o.opNo}</td>
                  <td className="px-3">{o.name}</td>
                  <td className="px-3 text-xs">{workCenterName(o.workCenter)}</td>
                  <td className="num px-3 text-right">{formatHours(o.plannedMin / 60)}</td>
                  <td className={cn('num px-3 text-right', o.actualMin > o.plannedMin && 'text-amber-600')}>{o.actualMin ? formatHours(o.actualMin / 60) : '—'}</td>
                  <td className="num px-3 text-right">{o.good}</td>
                  <td className={cn('num px-3 text-right', o.scrap > 0 && 'text-red-600')}>{o.scrap}</td>
                  <td className="px-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t p-3">
            <Progress value={(done / wo.operations.length) * 100} />
          </div>
        </Card>
        <div className="space-y-4">
          <ChartCard title="Planned vs actual hours" height={200}>
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="op" {...AXIS} />
                <YAxis {...AXIS} width={30} />
                <Tooltip {...TOOLTIP} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Planned" fill={C.muted} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Actual" fill={C.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card className="p-4 text-[13px]">
            <div className="mb-2 font-semibold">Quality</div>
            <div className="space-y-1.5">
              <div>
                Inspection plan:{' '}
                {plan ? (
                  <button className="num text-primary hover:underline" onClick={() => navigate(`/quality/plan/${plan.id}`)}>
                    {plan.id}
                  </button>
                ) : (
                  <span className="text-muted-foreground">none</span>
                )}
              </div>
              <div>
                NCRs:{' '}
                {ncrs.length ? (
                  ncrs.map((n) => (
                    <button key={n.id} className="num mr-2 text-primary hover:underline" onClick={() => navigate(`/quality/ncr/${n.id}`)}>
                      {n.id}
                    </button>
                  ))
                ) : (
                  <span className="text-muted-foreground">none</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
