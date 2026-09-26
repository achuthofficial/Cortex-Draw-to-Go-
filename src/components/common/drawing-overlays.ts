import type { BBox, Datum, Dimension, DrawingNote, DrawingSpec, GdtCallout, ItemStatus } from '@/data/types'
import { datumLayout, dimensionLayout, fcfLayout, noteBox, padBox, TITLE_BLOCK, viewMap } from '@/lib/drawing'

export type OverlayKind = 'dimension' | 'gdt' | 'datum' | 'note' | 'title'

export interface OverlayItem {
  id: string
  kind: OverlayKind
  bbox: BBox
  confidence: number
  status: ItemStatus
  balloon?: number
  label: string
}

export const OVERLAY_COLOR: Record<OverlayKind, string> = {
  dimension: '#0ea5e9',
  gdt: '#f97316',
  datum: '#14b8a6',
  note: '#eab308',
  title: '#64748b',
}

export const OVERLAY_NAME: Record<OverlayKind, string> = {
  dimension: 'Dimension',
  gdt: 'GD&T',
  datum: 'Datum',
  note: 'Note',
  title: 'Title block',
}

export interface ExtractionItems {
  dimensions: Dimension[]
  gdt: GdtCallout[]
  datums: Datum[]
  notes: DrawingNote[]
  titleConfidence: number
}

/** Balloon numbering shared by the drawing, the inspection plan and FAI forms: dimensions first, then GD&T. */
export function balloonNumbers(items: Pick<ExtractionItems, 'dimensions' | 'gdt'>): Record<string, number> {
  const map: Record<string, number> = {}
  let n = 1
  for (const d of items.dimensions) map[d.id] = n++
  for (const g of items.gdt) map[g.id] = n++
  return map
}

export function computeOverlays(spec: DrawingSpec, items: ExtractionItems): OverlayItem[] {
  const views = viewMap(spec)
  const balloons = balloonNumbers(items)
  // Layout always comes from the original drawing annotation (what's printed on paper).
  const byId = new Map(spec.dimensions.map((d) => [d.id, d]))
  const out: OverlayItem[] = []
  for (const d of items.dimensions) {
    const src = byId.get(d.id) ?? d
    out.push({ id: d.id, kind: 'dimension', bbox: padBox(dimensionLayout(src, views).bbox, 1.5), confidence: d.confidence, status: d.status, balloon: balloons[d.id], label: src.label })
  }
  const gById = new Map(spec.gdt.map((g) => [g.id, g]))
  for (const g of items.gdt) {
    const src = gById.get(g.id) ?? g
    out.push({ id: g.id, kind: 'gdt', bbox: padBox(fcfLayout(src, views).bbox, 1), confidence: g.confidence, status: g.status, balloon: balloons[g.id], label: g.feature })
  }
  const dtById = new Map(spec.datums.map((d) => [d.id, d]))
  for (const d of items.datums) {
    const src = dtById.get(d.id) ?? d
    out.push({ id: d.id, kind: 'datum', bbox: padBox(datumLayout(src, views).box, 2), confidence: d.confidence, status: d.status, label: `Datum ${d.letter}` })
  }
  const nById = new Map(spec.notes.map((n) => [n.id, n]))
  items.notes.forEach((n, i) => {
    const src = nById.get(n.id) ?? n
    out.push({ id: n.id, kind: 'note', bbox: noteBox(i, src.text), confidence: n.confidence, status: n.status, label: `Note ${n.n}` })
  })
  out.push({ id: `${spec.id}-title`, kind: 'title', bbox: padBox(TITLE_BLOCK, 2), confidence: items.titleConfidence, status: 'Accepted', label: 'Title block' })
  return out
}
