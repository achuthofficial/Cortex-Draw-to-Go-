import { useNavigate, useParams } from 'react-router-dom'
import { Check, Download, FileText, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { MoneyText } from '@/components/common/MoneyText'
import { Field } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useWorkspaceTab } from '@/app/useTab'
import { company, customers } from '@/data/core'
import type { SoStatus } from '@/data/types'
import { GST_RATE } from '@/lib/costing'
import { formatDate, formatINR } from '@/lib/format'
import { platform } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useData } from '@/store/data'
import { soValue } from './OrdersPage'

const FLOW: SoStatus[] = ['Confirmed', 'In production', 'Ready to ship', 'Shipped', 'Invoiced']

export function OrderDetail() {
  const { id = '' } = useParams()
  const so = useData((s) => s.salesOrders.find((o) => o.id === id))
  const wos = useData(useShallow((s) => s.workOrders.filter((w) => w.soId === id)))
  const setStatus = useData((s) => s.setSoStatus)
  const navigate = useNavigate()
  useWorkspaceTab('so', so?.id, so?.id ?? '', so ? customers.find((c) => c.id === so.customerId)?.short : undefined)
  if (!so) return <EmptyState title="Sales order not found" />
  const customer = customers.find((c) => c.id === so.customerId)!
  const value = soValue(so)
  const idx = FLOW.indexOf(so.status)
  const next = FLOW[idx + 1]
  const sameState = customer.gstin.slice(0, 2) === company.gstin.slice(0, 2)

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="num text-lg font-semibold">{so.id}</h1>
        <StatusBadge status={so.status} />
        <span className="text-sm text-muted-foreground">
          {customer.name} · PO <span className="num">{so.customerPo}</span>
        </span>
        {next && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              setStatus(so.id, next)
              toast.success(`${so.id} → ${next}`)
            }}
          >
            {next === 'Shipped' ? <Truck /> : <Check />} Mark {next.toLowerCase()}
          </Button>
        )}
      </div>
      <ol className="mb-4 flex items-center" aria-label="Order status">
        {FLOW.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <span className={cn('flex items-center gap-1.5 whitespace-nowrap text-xs font-medium', i > idx && 'text-muted-foreground')}>
              <span className={cn('h-2.5 w-2.5 rounded-full', i <= idx ? 'bg-primary' : 'bg-border')} /> {s}
            </span>
            {i < FLOW.length - 1 && <span className={cn('mx-2 h-0.5 flex-1', i < idx ? 'bg-primary' : 'bg-border')} />}
          </li>
        ))}
      </ol>
      <Card className="mb-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-6">
        <Field label="Order value" mono>
          {formatINR(value)}
        </Field>
        <Field label={sameState ? 'CGST + SGST' : 'IGST 18%'} mono>
          {formatINR(value * GST_RATE)}
        </Field>
        <Field label="Order date" mono>{formatDate(so.orderDate)}</Field>
        <Field label="Promised" mono>{formatDate(so.promisedDate)}</Field>
        <Field label="Payment terms">{customer.paymentTerms}</Field>
        <Field label="Linked quote" mono>
          {so.rfqId ? (
            <button className="text-primary hover:underline" onClick={() => navigate(`/quotes/${so.rfqId}`)}>
              {so.quoteId}
            </button>
          ) : (
            'Repeat order'
          )}
        </Field>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Line items and delivery schedule</CardTitle>
          </CardHeader>
          <table className="w-full text-[13px]">
            <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="h-8 px-3 text-left font-semibold">Part</th>
                <th className="px-3 text-right font-semibold">Qty</th>
                <th className="px-3 text-right font-semibold">Unit price</th>
                <th className="px-3 text-right font-semibold">Amount</th>
                <th className="px-3 text-right font-semibold">Delivery</th>
                <th className="px-3 text-right font-semibold">Shipped</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {so.lines.map((l) => (
                <tr key={l.partNo}>
                  <td className="h-9 px-3">
                    <button className="num font-medium text-primary hover:underline" onClick={() => navigate(`/parts/${l.partNo}`)}>
                      {l.partNo}
                    </button>
                    <div className="text-xs text-muted-foreground">{l.description}</div>
                  </td>
                  <td className="num px-3 text-right">{l.qty}</td>
                  <td className="px-3 text-right"><MoneyText value={l.unitPrice} /></td>
                  <td className="px-3 text-right"><MoneyText value={l.qty * l.unitPrice} /></td>
                  <td className="num px-3 text-right">{formatDate(l.deliveryDate)}</td>
                  <td className="num px-3 text-right">
                    {l.shippedQty}/{l.qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Work orders</CardTitle>
          </CardHeader>
          <ul className="divide-y">
            {wos.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">No work orders yet.</li>}
            {wos.map((w) => {
              const done = w.operations.filter((o) => o.status === 'Done').length
              return (
                <li key={w.id}>
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50" onClick={() => navigate(`/production/wo/${w.id}`)}>
                    <span className="num w-24 font-medium text-primary">{w.id}</span>
                    <span className="num w-14 text-xs">× {w.qty}</span>
                    <Progress value={(done / w.operations.length) * 100} className="h-2 flex-1" indicatorClassName={w.atRisk ? 'bg-amber-500' : undefined} />
                    <span className="num w-16 text-right text-xs">
                      {done}/{w.operations.length} ops
                    </span>
                    <StatusBadge status={w.status} />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dispatch documents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {so.dispatches.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Documents are generated when the order ships.</div>
            ) : (
              <ul className="divide-y">
                {so.dispatches.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{d.docType}</span>
                    <span className="num text-xs text-muted-foreground">{d.id}</span>
                    <span className="num text-xs">{formatDate(d.date)}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Download ${d.docType}`}
                      onClick={async () => {
                        await platform.saveTextFile(`${d.id}.txt`, `${d.docType} ${d.id}\n${so.id} · ${customer.name}\nQty ${d.qty}\n(mock document)`)
                        toast.success(`${d.id} downloaded (mock)`)
                      }}
                    >
                      <Download />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
            <StatusBadge status={so.invoiceStatus} />
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-[13px]">
            <Field label="Taxable value" mono>{formatINR(value)}</Field>
            <Field label="GST" mono>{formatINR(value * GST_RATE)}</Field>
            <Field label="Invoice total" mono>{formatINR(value * (1 + GST_RATE))}</Field>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
