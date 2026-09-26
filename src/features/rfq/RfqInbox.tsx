import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Archive, Copy, ExternalLink, FolderOpen, Plus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfidenceBadge } from '@/components/common/AiMark'
import { DataTable } from '@/components/common/DataTable'
import { MoneyText } from '@/components/common/MoneyText'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SegmentedList, SegmentedTrigger, Tabs } from '@/components/ui/tabs'
import { customerName, CURRENT_USER_ID, userById, users } from '@/data/core'
import type { Rfq, RfqStatus } from '@/data/types'
import { diffDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { costFor } from '@/lib/costing'
import { useData } from '@/store/data'
import { quoteIdFor } from '@/store/quote-factory'
import { useUi } from '@/store/ui'

const STATUSES: RfqStatus[] = ['New', 'Extracting', 'Needs review', 'Costing', 'Sent', 'Won', 'Lost']
type View = 'all' | 'mine' | 'week' | 'review'

export function RfqInbox() {
  const navigate = useNavigate()
  const rfqs = useData((s) => s.rfqs)
  const quotes = useData((s) => s.quotes)
  const assign = useData((s) => s.assignRfqs)
  const archive = useData((s) => s.archiveRfqs)
  const duplicate = useData((s) => s.duplicateRfq)
  const openTab = useUi((s) => s.openTab)
  const setNewRfq = useUi((s) => s.setNewRfq)
  const [view, setView] = useState<View>('all')
  const [statusFilter, setStatusFilter] = useState<RfqStatus[]>([])
  const [toArchive, setToArchive] = useState<Rfq[] | null>(null)
  const { loading, error, retry } = useSimulatedLoad()

  const rows = useMemo(() => {
    let list = rfqs.filter((r) => !r.archived)
    if (view === 'mine') list = list.filter((r) => r.estimatorId === CURRENT_USER_ID)
    if (view === 'week') list = list.filter((r) => diffDays(r.dueAt) >= 0 && diffDays(r.dueAt) <= 7 && !['Won', 'Lost'].includes(r.status))
    if (view === 'review') list = list.filter((r) => r.status === 'Needs review')
    if (statusFilter.length) list = list.filter((r) => statusFilter.includes(r.status))
    return list.map((r) => {
      const q = quotes[quoteIdFor(r.id)]
      const live = q && q.extracted && ['Needs review', 'Costing'].includes(r.status) ? costFor(q.costing, q.operations, q.costing.primaryQty).total : undefined
      return { ...r, value: r.quotedValue ?? live }
    })
  }, [rfqs, quotes, view, statusFilter])

  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      { accessorKey: 'id', header: 'RFQ no.', size: 128, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { id: 'customer', accessorFn: (r) => customerName(r.customerId), header: 'Customer', size: 190 },
      {
        id: 'part',
        accessorFn: (r) => r.parts.map((p) => p.partNo).join(', '),
        header: 'Part(s)',
        size: 180,
        cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span>,
      },
      { id: 'parts', accessorFn: (r) => r.parts.length, header: 'Parts', size: 64, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      { accessorKey: 'receivedAt', header: 'Received', size: 110, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
      {
        accessorKey: 'dueAt',
        header: 'Due',
        size: 118,
        cell: (c) => {
          const r = c.row.original
          const d = diffDays(r.dueAt)
          const open = !['Sent', 'Won', 'Lost'].includes(r.status)
          return (
            <span className={cn('num', open && d < 0 && 'font-semibold text-red-600 dark:text-red-400', open && d === 0 && 'font-semibold text-amber-600')}>
              {formatDate(r.dueAt)}
              {open && d < 0 && <span className="ml-1 text-2xs">({-d}d late)</span>}
              {open && d === 0 && <span className="ml-1 text-2xs">today</span>}
            </span>
          )
        },
      },
      { accessorKey: 'status', header: 'Status', size: 120, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { id: 'estimator', accessorFn: (r) => userById(r.estimatorId)?.name ?? '', header: 'Estimator', size: 120 },
      { id: 'value', accessorFn: (r) => r.value ?? -1, header: 'Quoted value', size: 130, meta: { align: 'right' }, cell: (c) => <MoneyText value={c.row.original.value} decimals={false} /> },
      {
        id: 'conf',
        accessorFn: (r) => r.aiConfidence ?? -1,
        header: 'AI confidence',
        size: 118,
        cell: (c) => (c.row.original.aiConfidence ? <ConfidenceBadge value={c.row.original.aiConfidence} compact /> : <span className="text-xs text-muted-foreground">{c.row.original.status === 'Extracting' ? 'Extracting…' : '—'}</span>),
      },
    ],
    [],
  )

  const counts = useMemo(() => {
    const live = rfqs.filter((r) => !r.archived)
    return {
      all: live.length,
      mine: live.filter((r) => r.estimatorId === CURRENT_USER_ID).length,
      week: live.filter((r) => diffDays(r.dueAt) >= 0 && diffDays(r.dueAt) <= 7 && !['Won', 'Lost'].includes(r.status)).length,
      review: live.filter((r) => r.status === 'Needs review').length,
    }
  }, [rfqs])

  const open = (r: Rfq) => navigate(`/quotes/${r.id}`)
  const estimators = users.filter((u) => u.role === 'Estimator' || u.role === 'Owner')

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="RFQs and Quotes"
        description="Every enquiry from drawing to quote. Click a row to open the Quote Workspace."
        actions={
          <Button onClick={() => setNewRfq(true)}>
            <Plus /> New RFQ
          </Button>
        }
      >
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <SegmentedList aria-label="Saved views">
            <SegmentedTrigger value="all">All <span className="num text-muted-foreground">{counts.all}</span></SegmentedTrigger>
            <SegmentedTrigger value="mine">My RFQs <span className="num text-muted-foreground">{counts.mine}</span></SegmentedTrigger>
            <SegmentedTrigger value="week">Due this week <span className="num text-muted-foreground">{counts.week}</span></SegmentedTrigger>
            <SegmentedTrigger value="review">Needs review <span className="num text-muted-foreground">{counts.review}</span></SegmentedTrigger>
          </SegmentedList>
        </Tabs>
      </PageHeader>
      <DataTable
        className="flex-1"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onOpen={open}
        selectable
        searchPlaceholder="Search RFQ, customer, part…"
        initialSorting={[{ id: 'receivedAt', desc: true }]}
        empty={{ title: 'No RFQs in this view', description: 'New enquiries appear here as soon as drawings are uploaded.', action: <Button size="sm" onClick={() => setNewRfq(true)}><Plus /> New RFQ</Button> }}
        toolbar={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                Status {statusFilter.length > 0 && <span className="num rounded bg-primary/10 px-1 text-primary">{statusFilter.length}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              {STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter.includes(s)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(v) => setStatusFilter((cur) => (v ? [...cur, s] : cur.filter((x) => x !== s)))}
                >
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && <DropdownMenuItem onSelect={() => setStatusFilter([])}>Clear filter</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        bulkActions={(sel, clear) => (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="xs" variant="outline">
                  <UserPlus /> Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {estimators.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onSelect={() => {
                      assign(sel.map((r) => r.id), u.id)
                      toast.success(`${sel.length} RFQ${sel.length > 1 ? 's' : ''} assigned to ${u.name}`)
                      clear()
                    }}
                  >
                    {u.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="xs" variant="outline" onClick={() => setToArchive(sel)}>
              <Archive /> Archive
            </Button>
          </>
        )}
        rowActions={(r) => [
          { label: 'Open', icon: FolderOpen, onSelect: () => open(r), shortcut: 'Enter' },
          { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `quote:${r.id}`, kind: 'quote', title: r.id.replace('RFQ', 'Q'), subtitle: r.parts[0].partNo, path: `/quotes/${r.id}` }) },
          {
            label: 'Duplicate',
            icon: Copy,
            onSelect: () => {
              const id = duplicate(r.id)
              toast.success(`Duplicated as ${id}`)
            },
          },
          ...estimators.slice(0, 2).map((u, i) => ({
            label: `Assign to ${u.name}`,
            icon: UserPlus,
            separatorBefore: i === 0,
            onSelect: () => {
              assign([r.id], u.id)
              toast.success(`${r.id} assigned to ${u.name}`)
            },
          })),
          { label: 'Archive', icon: Archive, destructive: true, separatorBefore: true, onSelect: () => setToArchive([r]) },
        ]}
      />
      <AlertDialog open={!!toArchive} onOpenChange={(o) => !o && setToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Archive {toArchive?.length === 1 ? toArchive[0].id : `${toArchive?.length} RFQs`}?</AlertDialogTitle>
          <AlertDialogDescription>Archived RFQs are hidden from the inbox. Quotes and history are kept.</AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              destructive
              onClick={() => {
                if (!toArchive) return
                archive(toArchive.map((r) => r.id))
                toast.success(`${toArchive.length} RFQ${toArchive.length > 1 ? 's' : ''} archived`)
                setToArchive(null)
              }}
            >
              Archive
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
