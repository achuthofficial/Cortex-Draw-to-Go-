import { useParams } from 'react-router-dom'
import { PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { MoneyText } from '@/components/common/MoneyText'
import { Field } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useWorkspaceTab } from '@/app/useTab'
import { suppliers } from '@/data/core'
import { GST_RATE } from '@/lib/costing'
import { formatDate, formatINR } from '@/lib/format'
import { useData } from '@/store/data'
import { poValue } from './InventoryPage'

export function PoDetail() {
  const { id = '' } = useParams()
  const po = useData((s) => s.purchaseOrders.find((p) => p.id === id))
  const receive = useData((s) => s.receivePo)
  useWorkspaceTab('po', po?.id, po?.id ?? '')
  if (!po) return <EmptyState title="Purchase order not found" />
  const sup = suppliers.find((s) => s.id === po.supplierId)!
  const value = poValue(po)
  const open = !['Received', 'Closed'].includes(po.status)
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="num text-lg font-semibold">{po.id}</h1>
        <StatusBadge status={po.status} />
        <span className="text-sm text-muted-foreground">{sup.name}</span>
        {open && po.status !== 'Draft' && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              receive(po.id)
              toast.success('Goods received', { description: 'Stock updated and incoming inspection queued.' })
            }}
          >
            <PackageCheck /> Record goods receipt
          </Button>
        )}
      </div>
      <Card className="mb-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-5">
        <Field label="Supplier">{sup.name}</Field>
        <Field label="Contact">{sup.contact.name}</Field>
        <Field label="Order date" mono>{formatDate(po.orderDate)}</Field>
        <Field label="Expected" mono>{formatDate(po.expectedDate)}</Field>
        <Field label="Value incl. GST" mono>{formatINR(value * (1 + GST_RATE))}</Field>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Lines and goods receipt</CardTitle>
        </CardHeader>
        <table className="w-full text-[13px]">
          <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="h-8 px-3 text-left font-semibold">Item</th>
              <th className="px-3 text-right font-semibold">Qty</th>
              <th className="px-3 text-right font-semibold">Rate</th>
              <th className="px-3 text-right font-semibold">Amount</th>
              <th className="w-56 px-3 text-left font-semibold">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {po.lines.map((l) => (
              <tr key={l.item}>
                <td className="h-9 px-3">{l.item}</td>
                <td className="num px-3 text-right">
                  {l.qty} {l.unit}
                </td>
                <td className="px-3 text-right"><MoneyText value={l.rate} /></td>
                <td className="px-3 text-right"><MoneyText value={l.qty * l.rate} /></td>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <Progress value={(l.receivedQty / l.qty) * 100} className="h-1.5 flex-1" indicatorClassName="bg-emerald-500" />
                    <span className="num text-xs">
                      {l.receivedQty}/{l.qty}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
