// Builds the in-memory quote workspace state for an RFQ from its drawing.
import { materialByCode } from '@/data/core'
import { getDrawing } from '@/data/drawings'
import type { DrawingSpec, ItemStatus, QuoteState, Rfq } from '@/data/types'
import { daysFromToday } from '@/lib/dates'

export interface AiSettings {
  autoAcceptThreshold: number
  alwaysReview: string[] // dimension types, 'gdt', 'notes'
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  autoAcceptThreshold: 95,
  alwaysReview: ['thread', 'gdt'],
}

export function quoteIdFor(rfqId: string) {
  return rfqId.replace('RFQ', 'Q')
}

/** A drawing spec with the title block adjusted to the RFQ's part (for non-detailed RFQs). */
export function drawingForRfq(rfq: Rfq, partIndex = 0): DrawingSpec {
  const part = rfq.parts[partIndex] ?? rfq.parts[0]
  const base = getDrawing(part.drawingId)
  if (base.titleBlock.partNo === part.partNo) return base
  const mat = materialByCode(part.material)
  return {
    ...base,
    titleBlock: {
      ...base.titleBlock,
      partNo: part.partNo,
      revision: part.revision,
      description: part.description,
      material: part.material,
      materialSpec: mat.name,
    },
  }
}

function flaggedIds(spec: DrawingSpec): Set<string> {
  return new Set(spec.checks.filter((c) => c.severity === 'Critical').flatMap((c) => c.refs))
}

export function reviewStatus(id: string, confidence: number, type: string, spec: DrawingSpec, threshold: number, alwaysReview: string[]): ItemStatus {
  if (flaggedIds(spec).has(id)) return 'Flagged'
  if (alwaysReview.includes(type)) return 'Pending'
  return confidence >= threshold ? 'Accepted' : 'Pending'
}

export function applyExtraction(state: QuoteState, spec: DrawingSpec, ai: AiSettings, threshold = ai.autoAcceptThreshold): QuoteState {
  const st = (id: string, c: number, type: string) => reviewStatus(id, c, type, spec, threshold, ai.alwaysReview)
  return {
    ...state,
    extracted: true,
    dimensions: spec.dimensions.map((d) => ({ ...d, status: st(d.id, d.confidence, d.type) })),
    gdt: spec.gdt.map((g) => ({ ...g, status: st(g.id, g.confidence, 'gdt') })),
    datums: spec.datums.map((d) => ({ ...d, status: st(d.id, d.confidence, 'datum') })),
    notes: spec.notes.map((n) => ({ ...n, status: st(n.id, n.confidence, 'notes') })),
    checks: spec.checks.map((c) => ({ ...c })),
  }
}

export function createQuoteState(rfq: Rfq, ai: AiSettings): QuoteState {
  const spec = drawingForRfq(rfq)
  const part = rfq.parts[0]
  const mat = materialByCode(part.material)
  const detailed = getDrawing(part.drawingId).titleBlock.partNo === part.partNo
  const qtys = Array.from(new Set([...(detailed ? spec.costing.quantities : []), ...part.quantities])).sort((a, b) => a - b)
  const base: QuoteState = {
    id: quoteIdFor(rfq.id),
    rfqId: rfq.id,
    drawingId: part.drawingId,
    extracted: false,
    dimensions: [],
    gdt: [],
    datums: [],
    notes: [],
    titleBlock: { ...spec.titleBlock },
    checks: [],
    operations: spec.operations.map((o) => ({ ...o, outside: o.outside ? { ...o.outside } : undefined })),
    costing: {
      ...spec.costing,
      material: part.material,
      ratePerKg: detailed ? spec.costing.ratePerKg : mat.pricePerKg,
      quantities: qtys.slice(0, 6),
      primaryQty: detailed && part.quantities.includes(spec.costing.primaryQty) ? spec.costing.primaryQty : part.quantities[Math.min(1, part.quantities.length - 1)] ?? spec.costing.primaryQty,
    },
    versions: [],
    startedAt: rfq.receivedAt,
  }
  if (rfq.status === 'New' || rfq.status === 'Extracting') return base
  // Already extracted. 'Needs review' leaves medium/low-confidence items pending;
  // later stages have everything accepted.
  const reviewed = rfq.status === 'Needs review' ? applyExtraction(base, spec, ai, 85) : acceptAll(applyExtraction(base, spec, ai))
  const versions = ['Costing', 'Sent', 'Won', 'Lost'].includes(rfq.status)
    ? [{ version: 1, at: daysFromToday(-1, 15), by: rfq.estimatorId, note: 'First costing', total: 0 }]
    : []
  return { ...reviewed, versions, sentAt: ['Sent', 'Won', 'Lost'].includes(rfq.status) ? rfq.dueAt : undefined }
}

function acceptAll(s: QuoteState): QuoteState {
  const acc = <T extends { status: ItemStatus }>(x: T): T => ({ ...x, status: 'Accepted' })
  return { ...s, dimensions: s.dimensions.map(acc), gdt: s.gdt.map(acc), datums: s.datums.map(acc), notes: s.notes.map(acc), checks: s.checks.map((c) => ({ ...c, resolved: true })) }
}
