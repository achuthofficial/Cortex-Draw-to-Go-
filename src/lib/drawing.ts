// Layout engine for the mock engineering drawings. Geometry and annotations are
// stored in view millimetres; this module converts them to sheet pixels and
// computes the bounding boxes used for the extraction overlays, so the
// rendered SVG and the overlays can never drift apart.
import type { Annotation, BBox, Datum, Dimension, DrawingSpec, DrawingView, GdtCallout } from '@/data/types'

export const CHAR_W = 5.5
export const FONT = 9
export const FCF_H = 15

export type Pt = { x: number; y: number }

export function viewMap(spec: DrawingSpec): Record<string, DrawingView> {
  return Object.fromEntries(spec.views.map((v) => [v.id, v]))
}

export function toSheet(view: DrawingView, x: number, y: number): Pt {
  return { x: view.ox + x * view.scale, y: view.oy - y * view.scale }
}

export function textWidth(s: string): number {
  return s.length * CHAR_W
}

export interface DimLayout {
  lines: [Pt, Pt][]
  arrows: { at: Pt; dir: Pt }[]
  text: { x: number; y: number; rotate: number; anchor: 'start' | 'middle' | 'end'; label: string }
  bbox: BBox
}

const EXT_GAP = 2
const EXT_OVER = 3

export function layoutAnnotation(anno: Annotation, label: string, views: Record<string, DrawingView>): DimLayout {
  const v = views[anno.view]
  const w = textWidth(label)
  switch (anno.kind) {
    case 'hdim': {
      const p1 = toSheet(v, anno.x1, anno.y1)
      const p2 = toSheet(v, anno.x2, anno.y2)
      const yl = toSheet(v, 0, anno.at).y
      const up = yl < Math.min(p1.y, p2.y)
      const ext = (p: Pt): [Pt, Pt] => [
        { x: p.x, y: p.y + (up ? -EXT_GAP : EXT_GAP) },
        { x: p.x, y: yl + (up ? -EXT_OVER : EXT_OVER) },
      ]
      const left = Math.min(p1.x, p2.x)
      const right = Math.max(p1.x, p2.x)
      const span = right - left
      const lines: [Pt, Pt][] = [ext(p1), ext(p2)]
      const arrows: DimLayout['arrows'] = []
      if (span >= 16) {
        lines.push([{ x: left, y: yl }, { x: right, y: yl }])
        arrows.push({ at: { x: left, y: yl }, dir: { x: -1, y: 0 } }, { at: { x: right, y: yl }, dir: { x: 1, y: 0 } })
      } else {
        lines.push([{ x: left - 10, y: yl }, { x: right + 10, y: yl }])
        arrows.push({ at: { x: left, y: yl }, dir: { x: 1, y: 0 } }, { at: { x: right, y: yl }, dir: { x: -1, y: 0 } })
      }
      const cx = (left + right) / 2 + (anno.tx ?? 0)
      if (anno.tx) lines.push([{ x: anno.tx > 0 ? right + 10 : left - 10, y: yl }, { x: cx + (anno.tx > 0 ? -w / 2 : w / 2), y: yl }])
      const ty = yl - 3
      return {
        lines,
        arrows,
        text: { x: cx, y: ty, rotate: 0, anchor: 'middle', label },
        bbox: { x: cx - w / 2 - 2, y: ty - FONT - 1, w: w + 4, h: FONT + 4 },
      }
    }
    case 'vdim': {
      const p1 = toSheet(v, anno.x1, anno.y1)
      const p2 = toSheet(v, anno.x2, anno.y2)
      const xl = toSheet(v, anno.at, 0).x
      const leftSide = xl < Math.min(p1.x, p2.x) - 0.5
      const rightSide = xl > Math.max(p1.x, p2.x) + 0.5
      const ext = (p: Pt): [Pt, Pt] | null => {
        if (!leftSide && !rightSide) return null
        return [
          { x: p.x + (leftSide ? -EXT_GAP : EXT_GAP), y: p.y },
          { x: xl + (leftSide ? -EXT_OVER : EXT_OVER), y: p.y },
        ]
      }
      const top = Math.min(p1.y, p2.y)
      const bottom = Math.max(p1.y, p2.y)
      const lines: [Pt, Pt][] = []
      const e1 = ext(p1)
      const e2 = ext(p2)
      if (e1) lines.push(e1)
      if (e2) lines.push(e2)
      const arrows: DimLayout['arrows'] = []
      if (bottom - top >= 16) {
        lines.push([{ x: xl, y: top }, { x: xl, y: bottom }])
        arrows.push({ at: { x: xl, y: top }, dir: { x: 0, y: -1 } }, { at: { x: xl, y: bottom }, dir: { x: 0, y: 1 } })
      } else {
        lines.push([{ x: xl, y: top - 10 }, { x: xl, y: bottom + 10 }])
        arrows.push({ at: { x: xl, y: top }, dir: { x: 0, y: 1 } }, { at: { x: xl, y: bottom }, dir: { x: 0, y: -1 } })
      }
      const cy = (top + bottom) / 2 + (anno.ty ?? 0)
      const tx = xl - 3
      return {
        lines,
        arrows,
        text: { x: tx, y: cy, rotate: -90, anchor: 'middle', label },
        bbox: { x: tx - FONT - 1, y: cy - w / 2 - 2, w: FONT + 4, h: w + 4 },
      }
    }
    case 'leader': {
      const p = toSheet(v, anno.x, anno.y)
      const l = toSheet(v, anno.lx, anno.ly)
      const toRight = l.x >= p.x
      const shoulder = { x: l.x + (toRight ? 6 : -6), y: l.y }
      const tx = shoulder.x + (toRight ? 2 : -2)
      const dx = p.x - l.x
      const dy = p.y - l.y
      const len = Math.hypot(dx, dy) || 1
      return {
        lines: [
          [p, l],
          [l, shoulder],
        ],
        arrows: [{ at: p, dir: { x: dx / len, y: dy / len } }],
        text: { x: tx, y: l.y + 3, rotate: 0, anchor: toRight ? 'start' : 'end', label },
        bbox: { x: toRight ? tx - 2 : tx - w - 2, y: l.y - FONT + 1, w: w + 4, h: FONT + 4 },
      }
    }
    case 'text': {
      const p = toSheet(v, anno.x, anno.y)
      return {
        lines: [],
        arrows: [],
        text: { x: p.x, y: p.y + 3, rotate: 0, anchor: 'middle', label },
        bbox: { x: p.x - w / 2 - 2, y: p.y - FONT + 1, w: w + 4, h: FONT + 4 },
      }
    }
  }
}

export function dimensionLayout(d: Dimension, views: Record<string, DrawingView>): DimLayout {
  return layoutAnnotation(d.anno, d.label, views)
}

// ---------- GD&T feature control frames ----------

export const MODIFIER_GLYPH: Record<string, string> = { MMC: 'Ⓜ', LMC: 'Ⓛ', RFS: '' }

export function tolText(g: Pick<GdtCallout, 'tolerance' | 'diameterZone' | 'modifier'>): string {
  const mod = MODIFIER_GLYPH[g.modifier]
  return `${g.diameterZone ? 'Ø' : ''}${g.tolerance}${mod ? ` ${mod}` : ''}`
}

export interface FcfLayout {
  cells: { x: number; w: number; kind: 'symbol' | 'tol' | 'datum'; text?: string }[]
  x: number
  y: number
  w: number
  h: number
  leader: [Pt, Pt]
  bbox: BBox
}

export function fcfCells(g: GdtCallout) {
  const cells: FcfLayout['cells'] = []
  let x = 0
  cells.push({ x, w: 17, kind: 'symbol' })
  x += 17
  const t = tolText(g)
  const tw = textWidth(t) + 8
  cells.push({ x, w: tw, kind: 'tol', text: t })
  x += tw
  for (const d of g.datums) {
    const dw = Math.max(15, textWidth(d) + 8)
    cells.push({ x, w: dw, kind: 'datum', text: d })
    x += dw
  }
  return { cells, width: x }
}

export function fcfLayout(g: GdtCallout, views: Record<string, DrawingView>): FcfLayout {
  const { cells, width } = fcfCells(g)
  const { x, y } = g.frame
  const target = toSheet(views[g.frame.view], g.frame.px, g.frame.py)
  // Leader leaves from the nearest frame edge midpoint.
  const candidates: Pt[] = [
    { x: x, y: y + FCF_H / 2 },
    { x: x + width, y: y + FCF_H / 2 },
    { x: x + 8, y: y + FCF_H },
    { x: x + 8, y: y },
  ]
  let from = candidates[0]
  let best = Infinity
  for (const c of candidates) {
    const dd = Math.hypot(c.x - target.x, c.y - target.y)
    if (dd < best) {
      best = dd
      from = c
    }
  }
  return { cells, x, y, w: width, h: FCF_H, leader: [from, target], bbox: { x: x - 2, y: y - 2, w: width + 4, h: FCF_H + 4 } }
}

// ---------- Datums ----------

export interface DatumLayout {
  tri: Pt[]
  line: [Pt, Pt]
  box: BBox
  letter: string
}

export function datumLayout(d: Datum, views: Record<string, DrawingView>): DatumLayout {
  const v = views[d.anno.view]
  const p = toSheet(v, d.anno.x, d.anno.y)
  const l = toSheet(v, d.anno.lx, d.anno.ly)
  const dx = l.x - p.x
  const dy = l.y - p.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  // Filled triangle with its base on the feature.
  const nx = -uy
  const ny = ux
  const tri = [
    { x: p.x + nx * 4, y: p.y + ny * 4 },
    { x: p.x - nx * 4, y: p.y - ny * 4 },
    { x: p.x + ux * 6, y: p.y + uy * 6 },
  ]
  const box = { x: l.x - 7.5, y: l.y - 7.5, w: 15, h: 15 }
  const edge = { x: l.x - ux * 7.5, y: l.y - uy * 7.5 }
  return { tri, line: [{ x: p.x + ux * 6, y: p.y + uy * 6 }, edge], box, letter: d.letter }
}

export function padBox(b: BBox, pad: number): BBox {
  return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }
}

// ---------- Sheet furniture ----------

export const TITLE_BLOCK = { x: 610, y: 572, w: 380, h: 118 }
export const NOTES_BLOCK = { x: 20, y: 572, w: 580, lineH: 15 }

export function noteBox(i: number, text: string): BBox {
  const y = NOTES_BLOCK.y + 20 + i * NOTES_BLOCK.lineH
  return { x: NOTES_BLOCK.x + 6, y: y - 10, w: Math.min(textWidth(`${i + 1}. ${text}`) * 0.93 + 8, NOTES_BLOCK.w - 12), h: 14 }
}
