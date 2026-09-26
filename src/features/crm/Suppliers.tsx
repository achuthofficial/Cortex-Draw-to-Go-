import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, FolderOpen, Mail, Phone } from 'lucide-react'
import { DataTable } from '@/components/common/DataTable'
import { KpiCard } from '@/components/common/KpiCard'
import { MoneyText } from '@/components/common/MoneyText'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceTab } from '@/app/useTab'
import type { Supplier } from '@/data/types'
import { formatDate } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { poValue } from '@/features/inventory/InventoryPage'
import { useShallow } from 'zustand/react/shallow'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

export function SuppliersPage() {
  const suppliers = useData((s) => s.suppliers)
  const pos = useData((s) => s.purchaseOrders)
  const navigate = useNavigate()
  const openTab = useUi((s) => s.openTab)
  const { loading, error, retry } = useSimulatedLoad()
  const cols = useMemo<ColumnDef<Supplier>[]>(
    () => [
      { accessorKey: 'name', header: 'Supplier', size: 220, cell: (c) => <span className="font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'city', header: 'City', size: 110 },
      { accessorKey: 'category', header: 'Category', size: 130 },
      { id: 'materials', accessorFn: (s) => s.materials.join(', '), header: 'Supplies', size: 220, cell: (c) => <span className="text-xs">{c.getValue<string>()}</span> },
      { accessorKey: 'onTimePct', header: 'On-time', size: 90, meta: { align: 'right' }, cell: (c) => <span className={cn('num', c.getValue<number>() < 90 && 'text-amber-600')}>{c.getValue<number>()}%</span> },
      { accessorKey: 'rejectionPct', header: 'Rejection', size: 90, meta: { align: 'right' }, cell: (c) => <span className={cn('num', c.getValue<number>() > 2 && 'text-red-600')}>{c.getValue<number>()}%</span> },
      { id: 'openPos', accessorFn: (s) => pos.filter((p) => p.supplierId === s.id && !['Received', 'Closed'].includes(p.status)).length, header: 'Open POs', size: 90, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      { accessorKey: 'rating', header: 'Rating', size: 80, meta: { align: 'center' }, cell: (c) => <Badge variant={c.getValue<string>() === 'A' ? 'green' : 'amber'}>{c.getValue<string>()}</Badge> },
    ],
    [pos],
  )
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Suppliers" description="Raw material, special process and tooling suppliers with delivery and quality performance." />
      <DataTable
        className="flex-1"
        data={suppliers}
        columns={cols}
        getRowId={(s) => s.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onOpen={(s) => navigate(`/suppliers/${s.id}`)}
        rowActions={(s) => [
          { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/suppliers/${s.id}`) },
          { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `supplier:${s.id}`, kind: 'supplier', title: s.name.split(' ')[0], path: `/suppliers/${s.id}` }) },
        ]}
      />
    </div>
  )
}

export function SupplierDetail() {
  const { id = '' } = useParams()
  const s = useData((st) => st.suppliers.find((x) => x.id === id))
  const pos = useData(useShallow((st) => st.purchaseOrders.filter((p) => p.supplierId === id)))
  const ncrs = useData(useShallow((st) => st.ncrs.filter((n) => n.supplierId === id)))
  const navigate = useNavigate()
  useWorkspaceTab('supplier', s?.id, s?.name.split(' ')[0] ?? '')
  if (!s) return <EmptyState title="Supplier not found" />
  const open = pos.filter((p) => !['Received', 'Closed'].includes(p.status))
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{s.name}</h1>
        <Badge variant={s.rating === 'A' ? 'green' : 'amber'}>Rating {s.rating}</Badge>
        <span className="text-sm text-muted-foreground">
          {s.category} · {s.city}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="On-time delivery" value={`${s.onTimePct}%`} />
        <KpiCard label="Rejection rate" value={`${s.rejectionPct}%`} good="down" />
        <KpiCard label="Open POs" value={open.length} />
        <KpiCard label="Open PO value" value={<MoneyText value={open.reduce((a, p) => a + poValue(p), 0)} compact />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Materials and services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {s.materials.map((m) => (
                <Badge key={m} variant="outline" className="num text-xs">
                  {m}
                </Badge>
              ))}
            </div>
            <div className="text-[13px]">
              <div className="font-medium">{s.contact.name}</div>
              <div className="text-xs text-muted-foreground">{s.contact.title}</div>
              <div className="mt-1 flex flex-col gap-0.5 text-xs">
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {s.contact.email}</span>
                <span className="num inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {s.contact.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Purchase orders</CardTitle>
          </CardHeader>
          <ul className="divide-y">
            {pos.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">No purchase orders.</li>}
            {pos.map((p) => (
              <li key={p.id}>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] hover:bg-accent/50" onClick={() => navigate(`/inventory/po/${p.id}`)}>
                  <span className="num w-24 font-medium text-primary">{p.id}</span>
                  <span className="flex-1 truncate text-xs">{p.lines.map((l) => l.item).join('; ')}</span>
                  <span className="num text-xs text-muted-foreground">{formatDate(p.expectedDate)}</span>
                  <MoneyText value={poValue(p)} decimals={false} className="w-24 text-right text-xs" />
                  <StatusBadge status={p.status} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        {ncrs.length > 0 && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Supplier NCRs</CardTitle>
            </CardHeader>
            <ul className="divide-y">
              {ncrs.map((n) => (
                <li key={n.id}>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] hover:bg-accent/50" onClick={() => navigate(`/quality/ncr/${n.id}`)}>
                    <span className="num w-24 font-medium text-primary">{n.id}</span>
                    <span className="flex-1">{n.defect}</span>
                    <StatusBadge status={n.disposition} />
                    <StatusBadge status={n.status} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
