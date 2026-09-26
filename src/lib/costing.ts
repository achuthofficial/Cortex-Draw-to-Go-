import { materialByCode, workCenterRate } from '@/data/core'
import type { CostingInputs, Operation } from '@/data/types'

export const GST_RATE = 0.18

let roundTo = 1
/** Unit-price rounding from Settings → Quoting rules. */
export function setPriceRounding(n: number) {
  roundTo = n > 0 ? n : 1
}

export function stockWeightKg(c: CostingInputs): number {
  const density = materialByCode(c.material).density // g/cm3
  let volumeMm3: number
  if (c.stockShape === 'Round bar' || c.stockShape === 'Forging') {
    volumeMm3 = (Math.PI / 4) * c.stockDia * c.stockDia * c.stockLength
  } else {
    volumeMm3 = c.stockLength * (c.stockWidth ?? 0) * (c.stockThk ?? 0)
  }
  return (volumeMm3 / 1000) * density / 1000
}

export function materialCostPerPart(c: CostingInputs): number {
  return stockWeightKg(c) * c.ratePerKg * (1 + c.scrapPct / 100)
}

export interface OpCost {
  op: Operation
  rate: number
  setupH: number
  cycleH: number
  cost: number
}

export type RateMap = Record<string, number>

export function operationCosts(ops: Operation[], qty: number, rates?: RateMap): OpCost[] {
  return ops
    .filter((o) => !o.outside)
    .map((op) => {
      const rate = rates?.[op.workCenter] ?? workCenterRate(op.workCenter)
      const setupH = op.setupMin / 60
      const cycleH = (op.cycleMin / 60) * qty
      return { op, rate, setupH, cycleH, cost: (setupH + cycleH) * rate }
    })
}

export interface CostBreakdown {
  qty: number
  material: number
  machining: number
  outside: number
  inspection: number
  packaging: number
  direct: number
  overhead: number
  margin: number
  total: number
  unitPrice: number
  leadDays: number
}

export function leadTimeDays(qty: number, ops: Operation[]): number {
  const outside = ops.reduce((a, o) => a + (o.outside?.leadDays ?? 0), 0)
  const base = qty <= 1 ? 8 : qty <= 10 ? 10 : qty <= 50 ? 14 : qty <= 100 ? 18 : 30
  return base + outside
}

export function costFor(c: CostingInputs, ops: Operation[], qty: number, rates?: RateMap): CostBreakdown {
  const material = materialCostPerPart(c) * qty
  const machining = operationCosts(ops, qty, rates).reduce((a, o) => a + o.cost, 0)
  const outside = ops.reduce((a, o) => a + (o.outside?.costPerPart ?? 0), 0) * qty
  const inspection = c.inspectionPerPart * qty
  const packaging = c.packagingPerPart * qty
  const direct = material + machining + outside + inspection + packaging
  const overhead = direct * (c.overheadPct / 100)
  const margin = (direct + overhead) * (c.marginPct / 100)
  const rawTotal = direct + overhead + margin
  const unitPrice = Math.ceil(rawTotal / qty / roundTo) * roundTo
  return { qty, material, machining, outside, inspection, packaging, direct, overhead, margin, total: unitPrice * qty, unitPrice, leadDays: leadTimeDays(qty, ops) }
}

export function quantityBreaks(c: CostingInputs, ops: Operation[], rates?: RateMap): CostBreakdown[] {
  return c.quantities.map((q) => costFor(c, ops, q, rates))
}

/** Worst-case and RSS results of a 1-D tolerance chain. */
export function stackupResult(links: { nominal: number; tol: number; direction: 1 | -1 }[]) {
  const nominal = links.reduce((a, l) => a + l.nominal * l.direction, 0)
  const worst = links.reduce((a, l) => a + l.tol, 0)
  const rss = Math.sqrt(links.reduce((a, l) => a + l.tol * l.tol, 0))
  return { nominal, worst, rss }
}
