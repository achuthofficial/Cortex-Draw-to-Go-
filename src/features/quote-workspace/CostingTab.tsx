import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Plus, Sparkles, X } from 'lucide-react'
import { AiSparkle } from '@/components/common/AiMark'
import { MoneyText } from '@/components/common/MoneyText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { customers, supplierName, workCenterName } from '@/data/core'
import type { CostingInputs, DrawingSpec, QuoteState, Rfq } from '@/data/types'
import { costFor, operationCosts, quantityBreaks, stockWeightKg } from '@/lib/costing'
import { formatDate, formatINR, formatNumber, formatPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData, useRates } from '@/store/data'
import { useUi } from '@/store/ui'

const SPLIT_COLORS = ['#64748b', '#2563eb', '#14b8a6', '#f59e0b', '#10b981']

function NumField({ label, value, onChange, suffix, step = 1, min = 0, id, className }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; step?: number; min?: number; id: string; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type="number" step={step} min={min} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Math.max(min, parseFloat(e.target.value) || 0))} className={cn('num text-right', suffix && 'pr-10')} />
        {suffix && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

export function CostingTab({ quote, spec, rfq }: { quote: QuoteState; spec: DrawingSpec; rfq: Rfq }) {
  const update = useData((s) => s.updateCosting)
  const updateOp = useData((s) => s.updateOp)
  const materials = useData((s) => s.materials)
  const rules = useData((s) => s.rules)
  const setCopilot = useUi((s) => s.setCopilot)
  const rates = useRates()
  const [newQty, setNewQty] = useState('')
  const c = quote.costing
  const set = (patch: Partial<CostingInputs>) => update(quote.id, patch)
  const qty = c.primaryQty

  const weight = stockWeightKg(c)
  const breakdown = useMemo(() => costFor(c, quote.operations, qty, rates), [c, quote.operations, qty, rates])
  const breaks = useMemo(() => quantityBreaks(c, quote.operations, rates), [c, quote.operations, rates])
  const opCosts = useMemo(() => operationCosts(quote.operations, qty, rates), [quote.operations, qty, rates])
  const outsideOps = quote.operations.filter((o) => o.outside)
  const customer = customers.find((x) => x.id === rfq.customerId)
  const tierMargin = customer ? rules.marginByTier[customer.tier] : undefined

  const split = [
    { name: 'Material', value: breakdown.material },
    { name: 'Machining and inspection', value: breakdown.machining + breakdown.inspection + breakdown.packaging },
    { name: 'Outside processing', value: breakdown.outside },
    { name: 'Overhead', value: breakdown.overhead },
    { name: 'Margin', value: breakdown.margin },
  ]
  const lastQ = spec.lastQuoted
  const atLastQty = costFor(c, quote.operations, lastQ.qty, rates)
  const diffPct = ((atLastQty.unitPrice - lastQ.unitPrice) / lastQ.unitPrice) * 100
  const round = c.stockShape === 'Round bar' || c.stockShape === 'Forging'

  return (
    <div className="h-full overflow-y-auto">
      {/* Summary strip */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-1 border-b bg-background/95 px-4 py-2.5 backdrop-blur">
        <div>
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">Unit price @ {formatNumber(qty)} pcs</div>
          <div className="num text-lg font-semibold">{formatINR(breakdown.unitPrice)}</div>
        </div>
        <div>
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">Quote total (excl. GST)</div>
          <div className="num text-lg font-semibold">{formatINR(breakdown.total)}</div>
        </div>
        <div>
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">Margin</div>
          <div className="num text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(breakdown.margin, { decimals: false })}</div>
        </div>
        <div>
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">Lead time</div>
          <div className="num text-lg font-semibold">{breakdown.leadDays} days</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-2xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-ai" /> Recalculates live as you edit
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-start gap-3 p-3">
        <div className="space-y-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">Material <AiSparkle /></CardTitle>
              <span className="num text-xs text-muted-foreground">{formatINR(breakdown.material / qty)}/pc</span>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-3 p-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="c-shape">Stock shape</Label>
                <Select value={c.stockShape} onValueChange={(v) => set({ stockShape: v as CostingInputs['stockShape'], stockWidth: c.stockWidth ?? 100, stockThk: c.stockThk ?? 25 })}>
                  <SelectTrigger id="c-shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Round bar', 'Plate', 'Flat bar', 'Forging'].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="c-grade">Grade</Label>
                <Select
                  value={c.material}
                  onValueChange={(v) => {
                    const m = materials.find((x) => x.code === v)
                    set({ material: v as CostingInputs['material'], ratePerKg: m?.pricePerKg ?? c.ratePerKg })
                  }}
                >
                  <SelectTrigger id="c-grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.code} value={m.code}>
                        {m.code} · ₹{m.pricePerKg}/kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {round ? (
                <>
                  <NumField id="c-dia" label="Diameter" suffix="mm" value={c.stockDia} onChange={(n) => set({ stockDia: n, stockSize: `Ø${n} × ${c.stockLength}` })} />
                  <NumField id="c-len" label="Length" suffix="mm" value={c.stockLength} onChange={(n) => set({ stockLength: n, stockSize: `Ø${c.stockDia} × ${n}` })} />
                </>
              ) : (
                <>
                  <NumField id="c-len" label="Length" suffix="mm" value={c.stockLength} onChange={(n) => set({ stockLength: n, stockSize: `${n} × ${c.stockWidth} × ${c.stockThk}` })} />
                  <NumField id="c-w" label="Width" suffix="mm" value={c.stockWidth ?? 0} onChange={(n) => set({ stockWidth: n, stockSize: `${c.stockLength} × ${n} × ${c.stockThk}` })} />
                  <NumField id="c-t" label="Thickness" suffix="mm" value={c.stockThk ?? 0} onChange={(n) => set({ stockThk: n, stockSize: `${c.stockLength} × ${c.stockWidth} × ${n}` })} />
                </>
              )}
              <div className="space-y-1">
                <Label>Weight (auto)</Label>
                <div className="num flex h-8 items-center justify-end rounded-md bg-muted px-2.5 text-[13px]">{formatNumber(weight, 2)} kg</div>
              </div>
              <NumField id="c-rate" label="Rate" suffix="₹/kg" value={c.ratePerKg} onChange={(n) => set({ ratePerKg: n })} />
              <NumField id="c-scrap" label="Scrap" suffix="%" value={c.scrapPct} step={0.5} onChange={(n) => set({ scrapPct: n })} />
              {!round && <div />}
              <div className="col-span-4 text-2xs text-muted-foreground">
                Stock <span className="num">{c.stockSize}</span> {c.material}: <span className="num">{formatNumber(weight, 2)} kg × ₹{c.ratePerKg} × {(1 + c.scrapPct / 100).toFixed(3)}</span> = <span className="num font-medium text-foreground">{formatINR(breakdown.material / qty)}</span> per part
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Operations @ {formatNumber(qty)} pcs</CardTitle>
              <MoneyText value={breakdown.machining} className="text-xs" />
            </CardHeader>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b text-2xs uppercase tracking-wide text-muted-foreground">
                  <th className="h-7 px-3 text-left font-semibold">Op · Machine</th>
                  <th className="px-2 text-right font-semibold">Setup h</th>
                  <th className="px-2 text-right font-semibold">Cycle h × qty</th>
                  <th className="px-2 text-right font-semibold">₹/h</th>
                  <th className="px-3 text-right font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {opCosts.map((o) => (
                  <tr key={o.op.id}>
                    <td className="h-8 px-3">
                      <span className="num text-xs text-muted-foreground">{o.op.opNo}</span> {workCenterName(o.op.workCenter)}
                    </td>
                    <td className="num px-2 text-right">{o.setupH.toFixed(2)}</td>
                    <td className="num px-2 text-right">{o.cycleH.toFixed(2)}</td>
                    <td className="num px-2 text-right">{formatNumber(o.rate)}</td>
                    <td className="num px-3 text-right">{formatINR(o.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Outside processing, inspection and overheads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              {outsideOps.map((o) => (
                <div key={o.id} className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{o.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {supplierName(o.outside!.supplierId)} · {o.outside!.leadDays} days
                    </div>
                  </div>
                  <NumField id={`c-out-${o.id}`} label="Cost per part" suffix="₹" className="w-36" value={o.outside!.costPerPart} onChange={(n) => updateOp(quote.id, o.id, { outside: { ...o.outside!, costPerPart: n } })} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <NumField id="c-insp" label="Inspection / part" suffix="₹" value={c.inspectionPerPart} onChange={(n) => set({ inspectionPerPart: n })} />
                <NumField id="c-pack" label="Packaging / part" suffix="₹" value={c.packagingPerPart} onChange={(n) => set({ packagingPerPart: n })} />
                <NumField id="c-oh" label="Overhead" suffix="%" step={0.5} value={c.overheadPct} onChange={(n) => set({ overheadPct: n })} />
              </div>
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="c-margin" className="text-[13px] text-foreground">
                    Margin
                  </Label>
                  <span className="num text-sm font-semibold">{formatPct(c.marginPct, 1)}</span>
                </div>
                <Slider id="c-margin" min={0} max={40} step={0.5} value={[c.marginPct]} onValueChange={([v]) => set({ marginPct: v })} aria-label="Margin percent" />
                <div className="flex justify-between text-2xs text-muted-foreground">
                  <span>0%</span>
                  {tierMargin !== undefined && (
                    <button className="underline-offset-2 hover:underline" onClick={() => set({ marginPct: tierMargin })}>
                      {customer?.tier} tier default: {tierMargin}%
                    </button>
                  )}
                  <span>40%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Quantity breaks</CardTitle>
              <span className="text-2xs text-muted-foreground">Click a row to make it the quoted quantity</span>
            </CardHeader>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b text-2xs uppercase tracking-wide text-muted-foreground">
                  <th className="h-7 px-3 text-right font-semibold">Qty</th>
                  <th className="px-2 text-right font-semibold">Unit price</th>
                  <th className="px-2 text-right font-semibold">Total</th>
                  <th className="px-2 text-right font-semibold">Lead time</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {breaks.map((b) => (
                  <tr
                    key={b.qty}
                    className={cn('cursor-pointer hover:bg-accent/60', b.qty === qty && 'bg-primary/10 font-medium')}
                    onClick={() => set({ primaryQty: b.qty })}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && set({ primaryQty: b.qty })}
                    aria-current={b.qty === qty}
                  >
                    <td className="num h-8 px-3 text-right">{formatNumber(b.qty)}</td>
                    <td className="num px-2 text-right">{formatINR(b.unitPrice)}</td>
                    <td className="num px-2 text-right">{formatINR(b.total)}</td>
                    <td className="num px-2 text-right">{b.leadDays} days</td>
                    <td className="px-1">
                      {c.quantities.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove quantity ${b.qty}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            const next = c.quantities.filter((q) => q !== b.qty)
                            set({ quantities: next, primaryQty: b.qty === qty ? next[0] : qty })
                          }}
                        >
                          <X />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form
              className="flex items-center gap-2 border-t p-2"
              onSubmit={(e) => {
                e.preventDefault()
                const n = parseInt(newQty, 10)
                if (n > 0 && !c.quantities.includes(n)) set({ quantities: [...c.quantities, n].sort((a, b) => a - b) })
                setNewQty('')
              }}
            >
              <Input value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="Add quantity" className="num h-7 w-32 text-xs" aria-label="Add quantity break" inputMode="numeric" />
              <Button size="xs" variant="outline" type="submit">
                <Plus /> Add break
              </Button>
            </form>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Cost split @ {formatNumber(qty)} pcs</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4 p-3">
              <div className="relative h-44 w-44 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={split} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={1.5} stroke="none" isAnimationActive={false}>
                      {split.map((_, i) => (
                        <Cell key={i} fill={SPLIT_COLORS[i]} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v: number) => formatINR(v)} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xs text-muted-foreground">per part</span>
                  <span className="num text-sm font-semibold">{formatINR(breakdown.unitPrice, { decimals: false })}</span>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 text-[13px]">
                {split.map((s, i) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SPLIT_COLORS[i] }} />
                    <span className="flex-1">{s.name}</span>
                    <span className="num text-xs text-muted-foreground">{formatPct((s.value / breakdown.total) * 100, 1)}</span>
                    <span className="num w-24 text-right">{formatINR(s.value / qty)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-ai-border bg-ai-soft/40 shadow-none">
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                <Sparkles className="h-4 w-4 text-ai" /> Last quoted price for a similar part
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  <span className="num font-medium text-foreground">{lastQ.quoteNo}</span> · {lastQ.partNo} · {formatDate(lastQ.date)} · {formatNumber(lastQ.qty)} pcs
                  <div className="mt-0.5 italic">{lastQ.note}</div>
                </div>
                <div className="text-right">
                  <div className="num text-xs text-muted-foreground line-through">{formatINR(lastQ.unitPrice)}</div>
                  <div className="num text-base font-semibold">{formatINR(atLastQty.unitPrice)}</div>
                  <div className={cn('num inline-flex items-center text-xs font-semibold', diffPct >= 0 ? 'text-amber-600' : 'text-emerald-600')}>
                    {diffPct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {diffPct >= 0 ? '+' : ''}
                    {formatPct(diffPct, 1)} vs last
                  </div>
                </div>
              </div>
              <Button size="xs" variant="ai-outline" onClick={() => setCopilot(true, `Why is this quote ${Math.round(Math.abs(diffPct))}% higher than the last one?`)}>
                <Sparkles /> Ask Copilot why
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
