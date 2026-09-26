import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, ExternalLink, FolderOpen, Tablet, User } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/DataTable'
import { GanttChart, findConflicts } from '@/components/common/GanttChart'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { customerName, userById, workCenterName } from '@/data/core'
import { machineDowntime, NOW_HOUR, SCHEDULE_WEEK_START, vmc2GrindShift, vmc2Reschedule } from '@/data/orders'
import type { Machine, MachineState, WorkOrder } from '@/data/types'
import { diffDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'
import { RescheduleBanner } from './RescheduleBanner'

const STATE_STYLE: Record<MachineState, string> = {
  Running: 'border-t-emerald-500',
  Idle: 'border-t-amber-500',
  Setup: 'border-t-amber-500',
  Down: 'border-t-red-500',
  Maintenance: 'border-t-blue-500',
}

export function ProductionPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'board'
  const [previewing, setPreviewing] = useState(false)
  const blocks = useData((s) => s.blocks)
  const conflicts = useMemo(() => findConflicts(blocks, machineDowntime).size, [blocks])
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Production" description="Live machine status, the weekly schedule and work orders." />
      <RescheduleBanner
        previewing={previewing}
        onPreview={(v) => {
          setPreviewing(v)
          if (v) setParams({ tab: 'schedule' })
        }}
      />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 px-5">
          <TabsTrigger value="board">Machine board</TabsTrigger>
          <TabsTrigger value="schedule">
            Weekly schedule {conflicts > 0 && <span className="num rounded bg-red-500/15 px-1 text-2xs text-red-700 dark:text-red-400">{conflicts} conflicts</span>}
          </TabsTrigger>
          <TabsTrigger value="wo">Work orders</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="min-h-0 flex-1 overflow-y-auto">
          <MachineBoard />
        </TabsContent>
        <TabsContent value="schedule" className="min-h-0 flex-1">
          <Schedule previewing={previewing} />
        </TabsContent>
        <TabsContent value="wo" className="min-h-0 flex-1">
          <WorkOrderList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MachineBoard() {
  const machines = useData((s) => s.machines)
  const wos = useData((s) => s.workOrders)
  const setState = useData((s) => s.setMachineState)
  const navigate = useNavigate()
  const { loading } = useSimulatedLoad(300)
  const counts = machines.reduce<Record<string, number>>((a, m) => ({ ...a, [m.state]: (a[m.state] ?? 0) + 1 }), {})
  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        {(['Running', 'Setup', 'Idle', 'Down', 'Maintenance'] as MachineState[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <StatusBadge status={s} /> <span className="num">{counts[s] ?? 0}</span>
          </span>
        ))}
        <span className="ml-auto text-muted-foreground">
          Plant utilisation today <span className="num font-semibold text-foreground">{Math.round(machines.reduce((a, m) => a + m.utilization, 0) / machines.length)}%</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
        {machines.map((m) =>
          loading ? (
            <div key={m.id} className="skeleton h-44 rounded-lg" />
          ) : (
            <MachineTile key={m.id} m={m} wo={wos.find((w) => w.id === m.currentWoId)} onOpen={(id) => navigate(`/production/wo/${id}`)} onState={(s) => setState(m.id, s)} />
          ),
        )}
      </div>
    </div>
  )
}

function MachineTile({ m, wo, onOpen, onState }: { m: Machine; wo?: WorkOrder; onOpen: (id: string) => void; onState: (s: MachineState) => void }) {
  const op = wo?.operations.find((o) => o.status === 'Running') ?? wo?.operations.find((o) => o.status === 'Pending')
  const operator = m.operatorId ? userById(m.operatorId) : undefined
  const navigate = useNavigate()
  return (
    <Card className={cn('flex flex-col border-t-4 p-3', STATE_STYLE[m.state])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{m.name}</div>
          <div className="truncate text-2xs text-muted-foreground">{m.make}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Change state of ${m.name}`}>
              <StatusBadge status={m.state} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Set state</DropdownMenuLabel>
            {(['Running', 'Idle', 'Setup', 'Down', 'Maintenance'] as MachineState[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onSelect={() => {
                  onState(s)
                  toast.success(`${m.name} set to ${s}`)
                }}
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 min-h-[48px] flex-1 text-xs">
        {m.state === 'Down' || m.state === 'Maintenance' ? (
          <div className={cn('flex gap-1.5', m.state === 'Down' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400')}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m.downReason}
          </div>
        ) : wo ? (
          <button className="w-full text-left hover:underline" onClick={() => onOpen(wo.id)}>
            <div className="num font-medium text-primary">{wo.id}</div>
            <div className="truncate text-muted-foreground">
              {wo.partNo} · Op {op?.opNo} {op?.name}
            </div>
            <Progress value={(wo.good / wo.qty) * 100} className="mt-1.5 h-1" />
            <div className="num mt-0.5 text-2xs text-muted-foreground">
              {wo.good}/{wo.qty} good
            </div>
          </button>
        ) : (
          <div className="text-muted-foreground">No job loaded</div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between border-t pt-2 text-2xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" /> {operator?.name ?? '—'}
        </span>
        <span>
          Util. <span className={cn('num font-semibold', m.utilization >= 75 ? 'text-emerald-600' : m.utilization >= 40 ? 'text-amber-600' : 'text-red-600')}>{m.utilization}%</span>
        </span>
      </div>
      {wo && m.state !== 'Down' && (
        <Button size="xs" variant="ghost" className="mt-1" onClick={() => navigate(`/operator/${wo.id}`)}>
          <Tablet /> Operator view
        </Button>
      )}
    </Card>
  )
}

function Schedule({ previewing }: { previewing: boolean }) {
  const machines = useData((s) => s.machines)
  const blocks = useData((s) => s.blocks)
  const wos = useData((s) => s.workOrders)
  const move = useData((s) => s.moveBlock)
  const applied = useData((s) => s.rescheduleApplied)
  const navigate = useNavigate()
  const preview = useMemo(() => {
    if (!previewing || applied) return undefined
    const p: Record<string, { machineId: string; start: number }> = {}
    for (const r of vmc2Reschedule) p[r.blockId] = { machineId: r.machineId, start: r.start }
    const g = blocks.find((b) => b.id === vmc2GrindShift.blockId)
    if (g) p[g.id] = { machineId: g.machineId, start: vmc2GrindShift.start }
    return p
  }, [previewing, applied, blocks])
  const conflicts = findConflicts(blocks, machineDowntime)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b px-5 py-2 text-xs text-muted-foreground">
        <span>
          Week of <span className="num text-foreground">{formatDate(SCHEDULE_WEEK_START)}</span> · 2 shifts (06:00–22:00)
        </span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm border border-blue-600/40 bg-blue-500/20" /> Scheduled</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm border border-amber-500/60 bg-amber-500/20" /> At risk</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm border border-slate-400/40 bg-slate-400/20" /> Done</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm border border-red-600" /> Conflict</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-4 rounded-sm border-2 border-dashed border-ai bg-ai-soft" /> AI suggestion</span>
        <span className="ml-auto">Drag jobs between machines and time slots · arrow keys move a focused job</span>
      </div>
      {conflicts.size > 0 && (
        <div className="flex items-center gap-2 border-b bg-red-500/10 px-5 py-1.5 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" /> {conflicts.size} jobs overlap another job or a machine breakdown.
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        <GanttChart
          machines={machines}
          blocks={blocks}
          workOrders={wos}
          downtime={machineDowntime}
          nowHour={NOW_HOUR}
          weekStart={new Date(SCHEDULE_WEEK_START)}
          preview={preview}
          onMove={(id, machineId, start) => {
            const b = blocks.find((x) => x.id === id)
            move(id, machineId, start)
            if (b && b.machineId !== machineId) toast.success(`${b.woId} Op ${b.opNo} moved to ${workCenterName(machineId)}`)
          }}
          onOpen={(b) => navigate(`/production/wo/${b.woId}`)}
        />
      </div>
    </div>
  )
}

function WorkOrderList() {
  const wos = useData((s) => s.workOrders)
  const sos = useData((s) => s.salesOrders)
  const navigate = useNavigate()
  const openTab = useUi((s) => s.openTab)
  const { loading, error, retry } = useSimulatedLoad()
  const columns = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      { accessorKey: 'id', header: 'WO', size: 110, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'partNo', header: 'Part', size: 130, cell: (c) => <span className="num">{c.getValue<string>()}</span> },
      { id: 'customer', accessorFn: (w) => customerName(sos.find((s) => s.id === w.soId)?.customerId ?? ''), header: 'Customer', size: 170 },
      { accessorKey: 'soId', header: 'Sales order', size: 110, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { accessorKey: 'qty', header: 'Qty', size: 64, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      {
        id: 'progress',
        accessorFn: (w) => w.operations.filter((o) => o.status === 'Done').length / w.operations.length,
        header: 'Progress',
        size: 150,
        cell: (c) => {
          const w = c.row.original
          const done = w.operations.filter((o) => o.status === 'Done').length
          return (
            <div className="flex items-center gap-2">
              <Progress value={(done / w.operations.length) * 100} className="h-1.5 w-20" />
              <span className="num text-xs">
                {done}/{w.operations.length} ops
              </span>
            </div>
          )
        },
      },
      { accessorKey: 'priority', header: 'Priority', size: 90, cell: (c) => <StatusBadge status={c.getValue<string>()} dot={false} /> },
      {
        accessorKey: 'dueDate',
        header: 'Due',
        size: 130,
        cell: (c) => {
          const w = c.row.original
          const late = w.status !== 'Completed' && diffDays(w.dueDate) < 0
          return (
            <span className={cn('num', (late || w.atRisk) && 'font-semibold text-red-600')}>
              {formatDate(w.dueDate)} {w.atRisk && <AlertTriangle className="inline h-3 w-3" />}
            </span>
          )
        },
      },
      { accessorKey: 'status', header: 'Status', size: 110, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [sos],
  )
  return (
    <DataTable
      className="h-full"
      data={wos}
      columns={columns}
      getRowId={(w) => w.id}
      loading={loading}
      error={error}
      onRetry={retry}
      onOpen={(w) => navigate(`/production/wo/${w.id}`)}
      initialSorting={[{ id: 'dueDate', desc: false }]}
      rowActions={(w) => [
        { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/production/wo/${w.id}`) },
        { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `wo:${w.id}`, kind: 'wo', title: w.id, subtitle: w.partNo, path: `/production/wo/${w.id}` }) },
        { label: 'Operator view', icon: Tablet, onSelect: () => navigate(`/operator/${w.id}`) },
      ]}
      empty={{ title: 'No work orders', description: 'Work orders are created when a quote is won.' }}
    />
  )
}
