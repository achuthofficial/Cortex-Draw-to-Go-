import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertOctagon, ArrowRight, Clock, Factory, IndianRupee, Inbox, ShieldAlert, Sparkles, Target, Truck } from 'lucide-react'
import { AXIS, C, ChartCard, GRID, TOOLTIP } from '@/components/common/charts'
import { KpiCard } from '@/components/common/KpiCard'
import { MoneyText } from '@/components/common/MoneyText'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { customerName, userById } from '@/data/core'
import { aiInsights, funnel, weeklyHistory } from '@/data/history'
import { diffDays, TODAY } from '@/lib/dates'
import { formatDate, formatINRCompact } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

export function Dashboard() {
  const navigate = useNavigate()
  const rfqs = useData((s) => s.rfqs)
  const wos = useData((s) => s.workOrders)
  const machines = useData((s) => s.machines)
  const ncrs = useData((s) => s.ncrs)
  const setCopilot = useUi((s) => s.setCopilot)
  const { loading } = useSimulatedLoad(350)

  const live = rfqs.filter((r) => !r.archived)
  const openRfqs = live.filter((r) => ['New', 'Extracting', 'Needs review', 'Costing'].includes(r.status))
  const dueToday = openRfqs.filter((r) => diffDays(r.dueAt) <= 0).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
  const last4 = weeklyHistory.slice(-4)
  const winRate = Math.round((last4.reduce((a, w) => a + w.won, 0) / last4.reduce((a, w) => a + w.quotes, 0)) * 100)
  const quotedMonth = last4.reduce((a, w) => a + w.quotedValue, 0)
  const turnaround = weeklyHistory.at(-1)!.aiHours
  const atRisk = wos.filter((w) => w.status !== 'Completed' && (w.atRisk || (diffDays(w.dueDate) <= 2 && w.operations.filter((o) => o.status !== 'Done').length > 2)))
  const down = machines.filter((m) => m.state === 'Down' || m.state === 'Maintenance')
  const openNcrs = ncrs.filter((n) => n.status !== 'Closed')

  const funnelData = useMemo(() => funnel.map((f, i) => ({ ...f, fill: [C.muted, '#6366f1', C.primary, C.green, C.teal][i] })), [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-end justify-between px-5 pb-2 pt-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Good morning, Anita</h1>
          <p className="text-xs text-muted-foreground">Thursday, {formatDate(TODAY)} · Precision Works (demo), Hyderabad</p>
        </div>
        <Button variant="ai-outline" size="sm" onClick={() => setCopilot(true, "Summarise today's priorities")}>
          <Sparkles /> Summarise my day
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 lg:grid-cols-3 2xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[98px] rounded-lg" />)
        ) : (
          <>
            <KpiCard label="Open RFQs" value={openRfqs.length} delta={18} deltaLabel="%" icon={Inbox} onClick={() => navigate('/rfqs')} spark={weeklyHistory.map((w) => w.rfqs)} />
            <KpiCard label="Avg quote turnaround" value={`${turnaround.toFixed(2)} h`} delta={-90} good="down" icon={Clock} spark={weeklyHistory.map((w) => w.aiHours)} />
            <KpiCard label="Win rate (30 days)" value={`${winRate}%`} delta={9} deltaLabel=" pts" icon={Target} onClick={() => navigate('/reports')} spark={weeklyHistory.map((w) => w.winRate)} />
            <KpiCard label="Quoted value this month" value={formatINRCompact(quotedMonth)} delta={24} icon={IndianRupee} spark={weeklyHistory.map((w) => w.quotedValue)} />
            <KpiCard label="On-time delivery" value={`${weeklyHistory.at(-1)!.onTimePct}%`} delta={3} deltaLabel=" pts" icon={Truck} onClick={() => navigate('/orders')} spark={weeklyHistory.map((w) => w.onTimePct)} />
            <KpiCard label="Open NCRs" value={openNcrs.length} delta={-2} deltaLabel="" good="down" icon={ShieldAlert} onClick={() => navigate('/quality')} />
          </>
        )}
      </div>

      <div className="grid gap-3 px-5 py-3 xl:grid-cols-3">
        <ChartCard title="RFQ-to-order funnel" subtitle="Last 90 days">
          <ResponsiveContainer>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid {...GRID} horizontal={false} vertical />
              <XAxis type="number" {...AXIS} />
              <YAxis type="category" dataKey="stage" {...AXIS} width={100} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fontSize: 11, fill: 'hsl(var(--foreground))' }}>
                {funnelData.map((f) => (
                  <Cell key={f.stage} fill={f.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Win rate trend" subtitle="12 weeks · % of quotes won">
          <ResponsiveContainer>
            <LineChart data={weeklyHistory} margin={{ right: 10 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="week" {...AXIS} />
              <YAxis {...AXIS} unit="%" width={36} domain={[0, 50]} />
              <Tooltip {...TOOLTIP} />
              <Line type="monotone" dataKey="winRate" name="Win rate" stroke={C.primary} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} unit="%" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Quote turnaround" subtitle="Hours per quote · manual vs AI-assisted (AI live from W31)">
          <ResponsiveContainer>
            <LineChart data={weeklyHistory} margin={{ right: 10 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="week" {...AXIS} />
              <YAxis {...AXIS} unit=" h" width={36} />
              <Tooltip {...TOOLTIP} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="manualHours" name="Manual" stroke={C.muted} strokeDasharray="4 3" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="aiHours" name="AI-assisted" stroke={C.ai} strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 px-5 pb-5 xl:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>RFQs due today</CardTitle>
            <Button variant="link" size="xs" onClick={() => navigate('/rfqs')}>
              All RFQs <ArrowRight />
            </Button>
          </CardHeader>
          <ul className="divide-y">
            {dueToday.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">Nothing due today.</li>}
            {dueToday.map((r) => (
              <li key={r.id}>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-accent/60" onClick={() => navigate(`/quotes/${r.id}`)}>
                  <div className="min-w-0 flex-1">
                    <div className="num text-[13px] font-medium">{r.id}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {customerName(r.customerId)} · {r.parts[0].partNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <div className={cn('num mt-0.5 text-2xs', diffDays(r.dueAt) < 0 ? 'text-red-600' : 'text-amber-600')}>{diffDays(r.dueAt) < 0 ? `${-diffDays(r.dueAt)}d overdue` : 'due today'}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jobs at risk of late delivery</CardTitle>
            <Button variant="link" size="xs" onClick={() => setCopilot(true, 'Which jobs are at risk this week?')}>
              <Sparkles className="text-ai" /> Why?
            </Button>
          </CardHeader>
          <ul className="divide-y">
            {atRisk.slice(0, 6).map((w) => (
              <li key={w.id}>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-accent/60" onClick={() => navigate(`/production/wo/${w.id}`)}>
                  <AlertOctagon className={cn('h-4 w-4 shrink-0', w.atRisk ? 'text-red-500' : 'text-amber-500')} />
                  <div className="min-w-0 flex-1">
                    <div className="num text-[13px] font-medium">{w.id}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {w.partNo} × {w.qty} · {w.atRisk ? 'VMC 2 down' : `${w.operations.filter((o) => o.status !== 'Done').length} ops left`}
                    </div>
                  </div>
                  <div className="num text-right text-xs">due {formatDate(w.dueDate).slice(0, 6)}</div>
                </button>
              </li>
            ))}
            {atRisk.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">No jobs at risk. 🎉</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Machines down</CardTitle>
            <Button variant="link" size="xs" onClick={() => navigate('/production')}>
              Machine board <ArrowRight />
            </Button>
          </CardHeader>
          <ul className="divide-y">
            {down.map((m) => (
              <li key={m.id} className="flex items-start gap-2 px-4 py-2.5">
                <Factory className={cn('mt-0.5 h-4 w-4', m.state === 'Down' ? 'text-red-500' : 'text-blue-500')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    {m.name} <StatusBadge status={m.state} />
                  </div>
                  <div className="text-xs text-muted-foreground">{m.downReason}</div>
                </div>
              </li>
            ))}
            {down.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">All machines available.</li>}
          </ul>
        </Card>
        <Card className="border-ai-border">
          <CardHeader className="bg-ai-soft/50">
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-ai" /> AI insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {aiInsights.map((i) => (
              <button key={i.id} onClick={() => navigate(i.link)} className="flex w-full gap-2 rounded-md border border-transparent p-2 text-left text-xs hover:border-ai-border hover:bg-ai-soft/40">
                <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', i.tone === 'critical' ? 'bg-red-500' : i.tone === 'warning' ? 'bg-amber-500' : 'bg-ai')} />
                <span>{i.text}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="px-5 pb-5 text-2xs text-muted-foreground">
        Pipeline value <MoneyText value={openRfqs.reduce((a, r) => a + (r.quotedValue ?? 0), 0)} compact /> across {openRfqs.length} open RFQs · estimators: {Array.from(new Set(openRfqs.map((r) => userById(r.estimatorId)?.name))).join(', ')}
      </div>
    </div>
  )
}
