import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, FolderOpen, Plus, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/DataTable'
import { MoneyText } from '@/components/common/MoneyText'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { customerName } from '@/data/core'
import type { SalesOrder } from '@/data/types'
import { costFor } from '@/lib/costing'
import { diffDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { quoteIdFor } from '@/store/quote-factory'
import { useUi } from '@/store/ui'

export function soValue(o: SalesOrder) {
  return o.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0)
}

export function OrdersPage() {
  const orders = useData((s) => s.salesOrders)
  const rfqs = useData((s) => s.rfqs)
  const quotes = useData((s) => s.quotes)
  const markWon = useData((s) => s.markWon)
  const navigate = useNavigate()
  const openTab = useUi((s) => s.openTab)
  const [createOpen, setCreateOpen] = useState(false)
  const { loading, error, retry } = useSimulatedLoad()
  const candidates = rfqs.filter((r) => r.status === 'Sent' && !r.archived)

  const cols = useMemo<ColumnDef<SalesOrder>[]>(
    () => [
      { accessorKey: 'id', header: 'SO no.', size: 116, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'customerPo', header: 'Customer PO', size: 170, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { id: 'customer', accessorFn: (o) => customerName(o.customerId), header: 'Customer', size: 180 },
      { id: 'part', accessorFn: (o) => o.lines.map((l) => `${l.partNo} × ${l.qty}`).join(', '), header: 'Lines', size: 180, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { id: 'value', accessorFn: soValue, header: 'Value', size: 130, meta: { align: 'right' }, cell: (c) => <MoneyText value={c.getValue<number>()} decimals={false} /> },
      { accessorKey: 'orderDate', header: 'Order date', size: 110, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
      {
        accessorKey: 'promisedDate',
        header: 'Promised',
        size: 120,
        cell: (c) => {
          const o = c.row.original
          const late = !['Shipped', 'Invoiced'].includes(o.status) && diffDays(o.promisedDate) < 0
          return <span className={cn('num', late && 'font-semibold text-red-600')}>{formatDate(o.promisedDate)}</span>
        },
      },
      { accessorKey: 'status', header: 'Status', size: 120, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: 'quoteId', header: 'Quote', size: 110, cell: (c) => (c.getValue<string>() ? <span className="num text-xs">{c.getValue<string>()}</span> : <span className="text-xs text-muted-foreground">Repeat order</span>) },
    ],
    [],
  )

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Orders"
        description="Sales orders, deliveries, dispatch documents and invoicing."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Create from won quote
          </Button>
        }
      />
      <DataTable
        className="flex-1"
        data={orders}
        columns={cols}
        getRowId={(o) => o.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onOpen={(o) => navigate(`/orders/${o.id}`)}
        initialSorting={[{ id: 'orderDate', desc: true }]}
        searchPlaceholder="Search SO, PO, customer, part…"
        rowActions={(o) => [
          { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/orders/${o.id}`) },
          { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `so:${o.id}`, kind: 'so', title: o.id, subtitle: customerName(o.customerId).split(' ')[0], path: `/orders/${o.id}` }) },
        ]}
        empty={{ title: 'No sales orders', description: 'Mark a quote as won to create one.' }}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create sales order from a won quote</DialogTitle>
            <DialogDescription>Pick a sent quote the customer has accepted. We create the sales order, release the work order and draft the inspection plan.</DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 divide-y overflow-y-auto rounded-md border">
            {candidates.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">No sent quotes waiting for a decision.</li>}
            {candidates.map((r) => {
              const q = quotes[quoteIdFor(r.id)]
              const total = q ? costFor(q.costing, q.operations, q.costing.primaryQty).total : r.quotedValue
              return (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="num text-[13px] font-medium">
                      {quoteIdFor(r.id)} · {r.parts[0].partNo}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {customerName(r.customerId)} · sent {formatDate(r.dueAt)}
                    </div>
                  </div>
                  <MoneyText value={total} decimals={false} className="text-xs" />
                  <Button
                    size="xs"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      const res = markWon(quoteIdFor(r.id))
                      setCreateOpen(false)
                      toast.success(`${res.soId} created`, { description: `${res.woId} released · ${res.planId} drafted` })
                      navigate(`/orders/${res.soId}`)
                    }}
                  >
                    <Trophy /> Won, create SO
                  </Button>
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
