import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Download, Mail, Send, ThumbsDown, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { company, customers, userById } from '@/data/core'
import type { LostReason, QuoteState, Rfq } from '@/data/types'
import { costFor, GST_RATE, quantityBreaks } from '@/lib/costing'
import { daysFromToday, TODAY } from '@/lib/dates'
import { formatDate, formatINR, formatNumber } from '@/lib/format'
import { platform } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useData, useRates } from '@/store/data'

const REASONS: LostReason[] = ['Price', 'Lead time', 'Capability', 'No response']

export function PreviewTab({ quote, rfq }: { quote: QuoteState; rfq: Rfq }) {
  const navigate = useNavigate()
  const rules = useData((s) => s.rules)
  const markSent = useData((s) => s.markSent)
  const markWon = useData((s) => s.markWon)
  const markLost = useData((s) => s.markLost)
  const rates = useRates()
  const [emailOpen, setEmailOpen] = useState(false)
  const [wonOpen, setWonOpen] = useState(false)
  const [lostOpen, setLostOpen] = useState(false)
  const [reason, setReason] = useState<LostReason>('Price')
  const [exporting, setExporting] = useState(false)
  const customer = customers.find((c) => c.id === rfq.customerId)!
  const contact = customer.contacts[0]
  const estimator = userById(rfq.estimatorId)
  const c = quote.costing
  const breaks = quantityBreaks(c, quote.operations, rates)
  const primary = costFor(c, quote.operations, c.primaryQty, rates)
  const sameState = customer.gstin.slice(0, 2) === company.gstin.slice(0, 2)
  const gst = primary.total * GST_RATE
  const version = Math.max(1, quote.versions.length)
  const quoteNo = `${quote.id}-v${version}`
  const closed = rfq.status === 'Won' || rfq.status === 'Lost'
  const tb = quote.titleBlock

  const [email, setEmail] = useState({
    to: contact.email,
    subject: `Quotation ${quoteNo} for ${tb.partNo} rev ${tb.revision} (your ref ${rfq.customerRef})`,
    body: `Dear ${contact.name.split(' ')[0]},\n\nThank you for your enquiry ${rfq.customerRef}. Please find attached our quotation ${quoteNo} for ${tb.partNo} rev ${tb.revision} (${tb.description}).\n\nFor ${formatNumber(c.primaryQty)} pcs the unit price is ${formatINR(primary.unitPrice)} excluding GST, with delivery in ${primary.leadDays} days from PO. Prices for other quantities are in the attached quote, valid for ${rules.validityDays} days.\n\nPlease let us know if you have any questions.\n\nRegards,\n${estimator?.name}\n${company.name}\n${company.phone}`,
  })

  const exportPdf = async () => {
    setExporting(true)
    try {
      await platform.exportPdf(`${quoteNo}.pdf`, 'quote-document')
      toast.success(`${quoteNo}.pdf generated`, { description: 'Mock export. The desktop build writes a real PDF via the platform adapter.' })
    } catch {
      toast.error('Could not export PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button size="sm" variant="outline" onClick={exportPdf} disabled={exporting}>
          <Download /> {exporting ? 'Generating…' : 'Download PDF'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)} disabled={closed}>
          <Mail /> Send by email
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={closed || rfq.status === 'Sent'}
          onClick={() => {
            markSent(quote.id)
            toast.success(`${quoteNo} marked as sent`)
          }}
        >
          <Send /> Mark as sent
        </Button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" disabled={closed} onClick={() => setLostOpen(true)}>
            <ThumbsDown /> Mark as lost
          </Button>
          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={closed} onClick={() => setWonOpen(true)}>
            <Trophy /> Mark as won
          </Button>
        </div>
      </div>
      {rfq.status === 'Won' && rfq.salesOrderId && (
        <div className="flex items-center gap-2 border-b bg-emerald-500/10 px-3 py-2 text-[13px]">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Won · sales order
          <button className="num font-medium text-primary hover:underline" onClick={() => navigate(`/orders/${rfq.salesOrderId}`)}>
            {rfq.salesOrderId}
          </button>
          created.
        </div>
      )}
      {rfq.status === 'Lost' && (
        <div className="border-b bg-red-500/10 px-3 py-2 text-[13px]">
          Lost · reason: <strong>{rfq.lostReason}</strong>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 p-5">
        <article id="quote-document" className="print-area mx-auto max-w-[800px] bg-white p-10 text-[12px] leading-relaxed text-slate-800 shadow-md ring-1 ring-black/5" aria-label="Quote document">
          <header className="flex items-start justify-between border-b-2 border-blue-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-dashed border-slate-300 text-[9px] uppercase text-slate-400">Logo</div>
              <div>
                <div className="text-lg font-bold text-blue-900">{company.name}</div>
                <div className="text-[11px] text-slate-500">{company.address}</div>
                <div className="font-mono text-[11px] text-slate-500">
                  GSTIN {company.gstin} · {company.phone} · {company.email}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold tracking-wide text-slate-900">QUOTATION</div>
              <div className="font-mono text-[12px]">{quoteNo}</div>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-6 py-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Bill to</div>
              <div className="font-semibold">{customer.name}</div>
              <div>{customer.city}, India</div>
              <div className="font-mono text-[11px]">GSTIN {customer.gstin}</div>
              <div className="mt-1">
                Attn: {contact.name}, {contact.title}
              </div>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-right">
              <dt className="text-slate-500">Date</dt>
              <dd className="font-mono">{formatDate(quote.sentAt ?? TODAY)}</dd>
              <dt className="text-slate-500">Valid until</dt>
              <dd className="font-mono">{formatDate(daysFromToday(rules.validityDays))} ({rules.validityDays} days)</dd>
              <dt className="text-slate-500">Your reference</dt>
              <dd className="font-mono">{rfq.customerRef}</dd>
              <dt className="text-slate-500">Our reference</dt>
              <dd className="font-mono">{rfq.id}</dd>
              <dt className="text-slate-500">Prepared by</dt>
              <dd>{estimator?.name}</dd>
            </dl>
          </section>

          <section>
            <div className="mb-1 font-semibold">
              {tb.partNo} rev {tb.revision} · {tb.description}
            </div>
            <div className="mb-2 text-[11px] text-slate-500">
              Material {tb.material} · {tb.finish} · {tb.heatTreatment} · tolerances {tb.generalTolerance} · made to customer drawing
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-600">
                  <th className="border border-slate-200 px-2 py-1.5">#</th>
                  <th className="border border-slate-200 px-2 py-1.5">Description</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">Qty</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">Unit price (₹)</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">Amount (₹)</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {breaks.map((b, i) => (
                  <tr key={b.qty} className={cn(b.qty === c.primaryQty && 'bg-blue-50 font-semibold')}>
                    <td className="border border-slate-200 px-2 py-1.5 font-mono">{i + 1}</td>
                    <td className="border border-slate-200 px-2 py-1.5">
                      {tb.partNo} · option {String.fromCharCode(65 + i)}
                      {b.qty === c.primaryQty && <span className="ml-1 text-[10px] font-normal text-blue-700">(quoted)</span>}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{formatNumber(b.qty)}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{formatINR(b.unitPrice).replace('₹', '')}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{formatINR(b.total).replace('₹', '')}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-right font-mono">{b.leadDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end">
              <table className="w-72 text-[12px]">
                <tbody>
                  <tr>
                    <td className="py-0.5 text-slate-500">Subtotal ({formatNumber(c.primaryQty)} pcs)</td>
                    <td className="py-0.5 text-right font-mono">{formatINR(primary.total)}</td>
                  </tr>
                  {sameState ? (
                    <>
                      <tr>
                        <td className="py-0.5 text-slate-500">CGST 9%</td>
                        <td className="py-0.5 text-right font-mono">{formatINR(gst / 2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-slate-500">SGST 9%</td>
                        <td className="py-0.5 text-right font-mono">{formatINR(gst / 2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="py-0.5 text-slate-500">IGST 18%</td>
                      <td className="py-0.5 text-right font-mono">{formatINR(gst)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-slate-800 text-[13px] font-bold">
                    <td className="py-1">Total</td>
                    <td className="py-1 text-right font-mono">{formatINR(primary.total + gst)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-6 border-t pt-3 text-[11px]">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Terms</div>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>Payment: {customer.paymentTerms} from invoice date.</li>
                <li>Delivery: ex-works Hyderabad, lead time from PO and drawing sign-off.</li>
                <li>Freight and insurance extra at actuals. HSN 8483 (shafts) / 7326.</li>
                <li>GST 18% extra as applicable. Prices in INR.</li>
                <li>Material test certificates and inspection report supplied with each lot.</li>
              </ul>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Bank details</div>
              <div>{company.bank}</div>
              <div className="mt-8 text-right">
                <div className="text-slate-500">For {company.name}</div>
                <div className="mt-8 inline-block min-w-48 border-t border-slate-400 pt-1 text-center">
                  {estimator?.name}
                  <div className="text-[10px] text-slate-500">Authorised signatory</div>
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send quote by email</DialogTitle>
            <DialogDescription>Draft prepared by AI from the quote. Edit before sending. {quoteNo}.pdf will be attached.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="em-to">To</Label>
              <Input id="em-to" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="em-sub">Subject</Label>
              <Input id="em-sub" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="em-body">Message</Label>
              <Textarea id="em-body" rows={11} value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} className="border-ai-border bg-ai-soft/30" />
            </div>
            <div className="flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs text-muted-foreground">
              <Download className="h-3.5 w-3.5" /> {quoteNo}.pdf · 212 KB
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                markSent(quote.id)
                setEmailOpen(false)
                toast.success(`Quote sent to ${email.to}`, { description: 'RFQ status set to Sent.' })
              }}
            >
              <Send /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={wonOpen} onOpenChange={setWonOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Mark {quoteNo} as won?</AlertDialogTitle>
          <AlertDialogDescription>
            This creates a sales order for {formatNumber(c.primaryQty)} × {tb.partNo} at {formatINR(primary.unitPrice)}, releases a work order to Production and drafts an inspection plan in Quality from the reviewed drawing.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                const r = markWon(quote.id)
                toast.success(`Won! ${r.soId} created`, {
                  description: `${r.woId} released to Production · ${r.planId} drafted in Quality`,
                  action: { label: 'Open order', onClick: () => navigate(`/orders/${r.soId}`) },
                  duration: 8000,
                })
              }}
            >
              Mark as won
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as lost</DialogTitle>
            <DialogDescription>Why did we lose this quote? This feeds win/loss reports.</DialogDescription>
          </DialogHeader>
          <div role="radiogroup" aria-label="Lost reason" className="grid gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(r)}
                className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[13px] hover:bg-accent', reason === r && 'border-primary bg-primary/5')}
              >
                <span className={cn('h-3.5 w-3.5 rounded-full border', reason === r && 'border-4 border-primary')} />
                {r}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                markLost(quote.id, reason)
                setLostOpen(false)
                toast(`${quoteNo} marked as lost`, { description: `Reason: ${reason}` })
              }}
            >
              Mark as lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
