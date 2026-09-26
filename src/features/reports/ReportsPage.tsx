import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { AXIS, C, ChartCard, GRID, TOOLTIP } from '@/components/common/charts'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SegmentedList, SegmentedTrigger, Tabs } from '@/components/ui/tabs'
import { estimatorProductivity, lossReasons, machineUtilization, marginByFamily, weeklyHistory, winLossByCustomer } from '@/data/history'
import { daysFromToday } from '@/lib/dates'
import { platform } from '@/lib/platform'

type Range = '4w' | '8w' | '12w' | 'custom'
const PIE = ['#ef4444', '#f59e0b', '#6366f1', '#94a3b8']

export function ReportsPage() {
  const [range, setRange] = useState<Range>('12w')
  const [from, setFrom] = useState(daysFromToday(-84).slice(0, 10))
  const [to, setTo] = useState(daysFromToday(0).slice(0, 10))
  const weeks = range === '4w' ? 4 : range === '8w' ? 8 : range === '12w' ? 12 : Math.max(1, Math.min(12, Math.round((+new Date(to) - +new Date(from)) / (7 * 86400000))))
  const data = weeklyHistory.slice(-weeks)
  const scale = weeks / 12

  const exportCsv = async () => {
    const rows = ['week,rfqs,quotes,won,win_rate,on_time_pct,ppm,quoted_value_inr', ...data.map((w) => [w.week, w.rfqs, w.quotes, w.won, w.winRate, w.onTimePct, w.ppm, w.quotedValue].join(','))]
    await platform.saveTextFile(`drawtoship-report-${range}.csv`, rows.join('\n'), 'text/csv')
    toast.success('Report exported', { description: `${data.length} weeks · CSV` })
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Reports"
        description="Quoting, delivery, quality and capacity analytics."
        actions={
          <>
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <SegmentedList aria-label="Date range">
                <SegmentedTrigger value="4w">4 weeks</SegmentedTrigger>
                <SegmentedTrigger value="8w">8 weeks</SegmentedTrigger>
                <SegmentedTrigger value="12w">12 weeks</SegmentedTrigger>
                <SegmentedTrigger value="custom">Custom</SegmentedTrigger>
              </SegmentedList>
            </Tabs>
            {range === 'custom' && (
              <div className="flex items-center gap-1.5">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36" aria-label="From date" />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36" aria-label="To date" />
              </div>
            )}
            <Button variant="outline" onClick={exportCsv}>
              <Download /> Export
            </Button>
          </>
        }
      />
      <div className="grid flex-1 grid-cols-1 content-start gap-3 overflow-y-auto p-5 xl:grid-cols-2 2xl:grid-cols-3">
        <ChartCard title="Quote win / loss by customer" subtitle={`Last ${weeks} weeks`} height={250}>
          <ResponsiveContainer>
            <BarChart data={winLossByCustomer.map((w) => ({ ...w, won: Math.max(1, Math.round(w.won * scale)), lost: Math.round(w.lost * scale) }))}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="customer" {...AXIS} interval={0} tick={{ fontSize: 10 }} />
              <YAxis {...AXIS} width={28} />
              <Tooltip {...TOOLTIP} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="won" stackId="a" name="Won" fill={C.green} isAnimationActive={false} />
              <Bar dataKey="lost" stackId="a" name="Lost" fill={C.red} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Loss reasons" subtitle="Share of lost quotes" height={250}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={lossReasons} dataKey="value" nameKey="reason" innerRadius={50} outerRadius={85} paddingAngle={2} isAnimationActive={false} label={{ fontSize: 11 }}>
                {lossReasons.map((_, i) => (
                  <Cell key={i} fill={PIE[i]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="On-time delivery trend" subtitle="% of order lines shipped by promised date" height={250}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="week" {...AXIS} />
              <YAxis {...AXIS} domain={[75, 100]} unit="%" width={36} />
              <Tooltip {...TOOLTIP} />
              <Line dataKey="onTimePct" name="On-time" stroke={C.green} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} unit="%" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Quality PPM trend" subtitle="Defective parts per million shipped" height={250}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="week" {...AXIS} />
              <YAxis {...AXIS} width={40} />
              <Tooltip {...TOOLTIP} />
              <Line dataKey="ppm" name="PPM" stroke={C.red} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Margin by part family" subtitle="Average quoted margin %" height={250}>
          <ResponsiveContainer>
            <BarChart data={marginByFamily}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="family" {...AXIS} tick={{ fontSize: 10 }} interval={0} />
              <YAxis {...AXIS} unit="%" width={36} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="margin" name="Margin" fill={C.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} unit="%" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Machine utilisation" subtitle={`Average over last ${weeks} weeks`} height={250}>
          <ResponsiveContainer>
            <BarChart data={machineUtilization} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid {...GRID} vertical horizontal={false} />
              <XAxis type="number" {...AXIS} unit="%" domain={[0, 100]} />
              <YAxis type="category" dataKey="machine" {...AXIS} width={64} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="util" name="Utilisation" radius={[0, 3, 3, 0]} isAnimationActive={false} unit="%">
                {machineUtilization.map((m) => (
                  <Cell key={m.machine} fill={m.util >= 75 ? C.green : m.util >= 50 ? C.amber : C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card className="xl:col-span-2 2xl:col-span-3">
          <CardHeader>
            <CardTitle>Estimator productivity</CardTitle>
          </CardHeader>
          <div className="grid gap-4 p-3 md:grid-cols-[1fr_1.2fr]">
            <table className="w-full text-[13px]">
              <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="h-8 text-left font-semibold">Estimator</th>
                  <th className="text-right font-semibold">Quotes / week</th>
                  <th className="text-right font-semibold">Avg time</th>
                  <th className="text-right font-semibold">Win rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {estimatorProductivity.map((e) => (
                  <tr key={e.name}>
                    <td className="h-9">{e.name}</td>
                    <td className="num text-right">{e.quotesPerWeek}</td>
                    <td className="num text-right">{e.avgMinutes} min</td>
                    <td className="num text-right">{e.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="h-44">
              <ResponsiveContainer>
                <BarChart data={estimatorProductivity}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="name" {...AXIS} />
                  <YAxis {...AXIS} width={28} />
                  <Tooltip {...TOOLTIP} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="quotesPerWeek" name="Quotes / week" fill={C.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="avgMinutes" name="Avg minutes" fill={C.ai} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
