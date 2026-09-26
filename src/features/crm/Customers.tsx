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
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceTab } from '@/app/useTab'
import type { Customer } from '@/data/types'
import { formatDate, formatINRCompact } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { useData, type DataState } from '@/store/data'
import { useUi } from '@/store/ui'

const MARGIN_BY_TIER = { Strategic: 16.8, Key: 19.4, Standard: 22.1 }

export function customerStats(c: Customer, s: Pick<DataState, 'rfqs' | 'salesOrders' | 'ncrs' | 'parts'>) {
  const rfqs = s.rfqs.filter((r) => r.customerId === c.id)
  const won = rfqs.filter((r) => r.status === 'Won').length
  const lost = rfqs.filter((r) => r.status === 'Lost').length
  const orders = s.salesOrders.filter((o) => o.customerId === c.id)
  const orderValue = orders.reduce((a, o) => a + o.lines.reduce((b, l) => b + l.qty * l.unitPrice, 0), 0)
  const partNos = new Set(s.parts.filter((p) => p.customerId === c.id).map((p) => p.partNo))
  const issues = s.ncrs.filter((n) => partNos.has(n.partNo))
  return { rfqs, won, lost, winRate: won + lost ? Math.round((won / (won + lost)) * 100) : 0, orders, orderValue, issues, margin: MARGIN_BY_TIER[c.tier] }
}

export function CustomersPage() {
  const state = useData()
  const navigate = useNavigate()
  const openTab = useUi((s) => s.openTab)
  const { loading, error, retry } = useSimulatedLoad()
  const rows = useMemo(() => state.customers.map((c) => ({ ...c, stats: customerStats(c, state) })), [state])
  const cols = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      { accessorKey: 'name', header: 'Customer', size: 220, cell: (c) => <span className="font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'city', header: 'City', size: 110 },
      { accessorKey: 'industry', header: 'Industry', size: 160 },
      { accessorKey: 'tier', header: 'Tier', size: 100, cell: (c) => <Badge variant={c.getValue<string>() === 'Strategic' ? 'violet' : c.getValue<string>() === 'Key' ? 'blue' : 'gray'}>{c.getValue<string>()}</Badge> },
      { id: 'rfqs', accessorFn: (r) => r.stats.rfqs.length, header: 'RFQs', size: 70, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
      { id: 'win', accessorFn: (r) => r.stats.winRate, header: 'Win rate', size: 90, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}%</span> },
      { id: 'orders', accessorFn: (r) => r.stats.orderValue, header: 'Order value', size: 120, meta: { align: 'right' }, cell: (c) => <MoneyText value={c.getValue<number>()} compact /> },
      { id: 'margin', accessorFn: (r) => r.stats.margin, header: 'Avg margin', size: 100, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}%</span> },
      { id: 'issues', accessorFn: (r) => r.stats.issues.length, header: 'Quality issues', size: 110, meta: { align: 'right' }, cell: (c) => <span className="num">{c.getValue<number>()}</span> },
    ],
    [],
  )
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Customers" description="Accounts, contacts, quoting history and quality performance." />
      <DataTable
        className="flex-1"
        data={rows}
        columns={cols}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onOpen={(c) => navigate(`/customers/${c.id}`)}
        rowActions={(c) => [
          { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/customers/${c.id}`) },
          { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `customer:${c.id}`, kind: 'customer', title: c.short, path: `/customers/${c.id}` }) },
        ]}
      />
    </div>
  )
}

export function CustomerDetail() {
  const { id = '' } = useParams()
  const state = useData()
  const navigate = useNavigate()
  const c = state.customers.find((x) => x.id === id)
  useWorkspaceTab('customer', c?.id, c?.short ?? '')
  if (!c) return <EmptyState title="Customer not found" />
  const st = customerStats(c, state)
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{c.name}</h1>
        <Badge variant={c.tier === 'Strategic' ? 'violet' : 'blue'}>{c.tier}</Badge>
        <span className="text-sm text-muted-foreground">
          {c.industry} · {c.city} · GSTIN <span className="num">{c.gstin}</span> · customer since {formatDate(c.since)}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="RFQs (all time)" value={st.rfqs.length} />
        <KpiCard label="Win rate" value={`${st.winRate}%`} />
        <KpiCard label="Total orders" value={formatINRCompact(st.orderValue)} />
        <KpiCard label="Average margin" value={`${st.margin}%`} />
        <KpiCard label="Quality issues" value={st.issues.length} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <span className="text-xs text-muted-foreground">Payment terms {c.paymentTerms}</span>
          </CardHeader>
          <ul className="divide-y">
            {c.contacts.map((p) => (
              <li key={p.email} className="px-4 py-2.5 text-[13px]">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.title}</div>
                <div className="mt-1 flex gap-4 text-xs">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>
                  <span className="num inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RFQ history</CardTitle>
          </CardHeader>
          <ul className="divide-y">
            {st.rfqs.map((r) => (
              <li key={r.id}>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] hover:bg-accent/50" onClick={() => navigate(`/quotes/${r.id}`)}>
                  <span className="num w-28 font-medium text-primary">{r.id}</span>
                  <span className="num flex-1 truncate text-xs">{r.parts.map((p) => p.partNo).join(', ')}</span>
                  <span className="num text-xs text-muted-foreground">{formatDate(r.receivedAt)}</span>
                  <MoneyText value={r.quotedValue} decimals={false} className="w-24 text-right text-xs" />
                  <StatusBadge status={r.status} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Quality issues on this customer's parts</CardTitle>
          </CardHeader>
          <ul className="divide-y">
            {st.issues.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">No NCRs.</li>}
            {st.issues.map((n) => (
              <li key={n.id}>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] hover:bg-accent/50" onClick={() => navigate(`/quality/ncr/${n.id}`)}>
                  <span className="num w-24 font-medium text-primary">{n.id}</span>
                  <span className="num w-28 text-xs">{n.partNo}</span>
                  <span className="flex-1">{n.defect}</span>
                  <StatusBadge status={n.status} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
