import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, FolderOpen, PackageCheck, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/DataTable'
import { MoneyText } from '@/components/common/MoneyText'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supplierName } from '@/data/core'
import { stockStatus } from '@/data/inventory'
import type { PurchaseOrder, StockItem } from '@/data/types'
import { diffDays } from '@/lib/dates'
import { formatDate, formatNumber } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

export function poValue(p: PurchaseOrder) {
  return p.lines.reduce((a, l) => a + l.qty * l.rate, 0)
}

export function InventoryPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'stock'
  const stock = useData((s) => s.stock)
  const pos = useData((s) => s.purchaseOrders)
  const createPo = useData((s) => s.createPoFromSuggestion)
  const receive = useData((s) => s.receivePo)
  const navigate = useNavigate()
  const openTab = useUi((s) => s.openTab)
  const [dismissed, setDismissed] = useState(false)
  const [createdPo, setCreatedPo] = useState<string | null>(null)
  const { loading, error, retry } = useSimulatedLoad()

  const stockCols = useMemo<ColumnDef<StockItem>[]>(
    () => [
      { accessorKey: 'material', header: 'Material', size: 110, cell: (c) => <span className="num font-medium">{c.getValue<string>()}</span> },
      { id: 'grade', accessorFn: (s) => s.material, header: 'Grade', size: 90, cell: (c) => <span className="text-xs text-muted-foreground">{c.getValue<string>().startsWith('SS') ? 'Stainless' : c.getValue<string>().startsWith('Al') ? 'Aluminium' : 'Steel'}</span> },
      { accessorKey: 'form', header: 'Form', size: 100 },
      { accessorKey: 'size', header: 'Size', size: 100, cell: (c) => <span className="num">{c.getValue<string>()}</span> },
      { accessorKey: 'onHand', header: 'On hand', size: 90, meta: { align: 'right' }, cell: (c) => <span className="num">{formatNumber(c.getValue<number>())}</span> },
      { accessorKey: 'reserved', header: 'Reserved', size: 90, meta: { align: 'right' }, cell: (c) => <span className="num text-muted-foreground">{formatNumber(c.getValue<number>())}</span> },
      {
        id: 'available',
        accessorFn: (s) => s.onHand - s.reserved,
        header: 'Available',
        size: 100,
        meta: { align: 'right' },
        cell: (c) => <span className={cn('num font-medium', c.getValue<number>() <= 0 && 'text-red-600')}>{formatNumber(Math.max(0, c.getValue<number>()))} {c.row.original.unit}</span>,
      },
      { accessorKey: 'reorderPoint', header: 'Reorder pt', size: 100, meta: { align: 'right' }, cell: (c) => <span className="num">{formatNumber(c.getValue<number>())}</span> },
      { accessorKey: 'location', header: 'Location', size: 120 },
      { id: 'status', accessorFn: stockStatus, header: 'Status', size: 90, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  )
  const poCols = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      { accessorKey: 'id', header: 'PO', size: 110, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { id: 'supplier', accessorFn: (p) => supplierName(p.supplierId), header: 'Supplier', size: 200 },
      { id: 'items', accessorFn: (p) => p.lines.map((l) => l.item).join('; '), header: 'Items', size: 280, cell: (c) => <span className="text-xs">{c.getValue<string>()}</span> },
      { id: 'value', accessorFn: poValue, header: 'Value', size: 120, meta: { align: 'right' }, cell: (c) => <MoneyText value={c.getValue<number>()} decimals={false} /> },
      { accessorKey: 'orderDate', header: 'Ordered', size: 110, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
      {
        accessorKey: 'expectedDate',
        header: 'Expected',
        size: 120,
        cell: (c) => {
          const p = c.row.original
          const late = !['Received', 'Closed', 'Draft'].includes(p.status) && diffDays(p.expectedDate) < 0
          return <span className={cn('num', late && 'font-semibold text-red-600')}>{formatDate(p.expectedDate)}{late && ' · late'}</span>
        },
      },
      { accessorKey: 'status', header: 'Goods receipt', size: 150, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  )

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Inventory and Purchasing" description="Raw material stock, reservations for open work orders and purchase orders." />
      {!dismissed && (
        <div className="flex flex-wrap items-center gap-3 border-b border-ai-border bg-ai-soft/60 px-5 py-2.5">
          <Sparkles className="h-4 w-4 text-ai" />
          <div className="min-w-0 flex-1 text-[13px]">
            {createdPo ? (
              <>
                <strong>{createdPo}</strong> sent to Ironvale Steels for 180 kg EN19 Ø65 bar, expected in 4 days.
              </>
            ) : (
              <>
                <strong>Reorder suggestion:</strong> Order 180 kg EN19 65 mm bar from Ironvale Steels: covers 4 open orders (incl. RFQ-2026-0147 if won). Available stock is 24 kg vs 150 kg reorder point.
              </>
            )}
          </div>
          {!createdPo && (
            <Button
              size="sm"
              variant="ai"
              onClick={() => {
                const id = createPo()
                setCreatedPo(id)
                toast.success(`${id} created and sent`, { action: { label: 'Open', onClick: () => navigate(`/inventory/po/${id}`) } })
              }}
            >
              Create PO
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" aria-label="Dismiss suggestion" onClick={() => setDismissed(true)}>
            <X />
          </Button>
        </div>
      )}
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 px-5">
          <TabsTrigger value="stock">
            Stock <span className="num rounded bg-amber-500/15 px-1 text-2xs text-amber-700 dark:text-amber-400">{stock.filter((s) => stockStatus(s) !== 'OK').length} low/out</span>
          </TabsTrigger>
          <TabsTrigger value="po">Purchase orders <span className="num text-2xs text-muted-foreground">{pos.length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="min-h-0 flex-1">
          <DataTable className="h-full" data={stock} columns={stockCols} getRowId={(s) => s.id} loading={loading} error={error} onRetry={retry} searchPlaceholder="Search material, size, location…" rowClassName={(s) => (stockStatus(s) === 'Out' ? 'bg-red-500/[0.04]' : undefined)} />
        </TabsContent>
        <TabsContent value="po" className="min-h-0 flex-1">
          <DataTable
            className="h-full"
            data={pos}
            columns={poCols}
            getRowId={(p) => p.id}
            loading={loading}
            error={error}
            onRetry={retry}
            onOpen={(p) => navigate(`/inventory/po/${p.id}`)}
            rowActions={(p) => [
              { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/inventory/po/${p.id}`) },
              { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `po:${p.id}`, kind: 'po', title: p.id, path: `/inventory/po/${p.id}` }) },
              {
                label: 'Receive goods',
                icon: PackageCheck,
                onSelect: () => {
                  receive(p.id)
                  toast.success(`${p.id} received into stock`)
                },
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
