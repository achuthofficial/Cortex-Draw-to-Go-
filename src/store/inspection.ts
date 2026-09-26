// Inspection plans are generated from the drawing's extracted characteristics.
import type { Characteristic, Dimension, DrawingSpec, GdtCallout, InspectionPlan } from '@/data/types'
import { balloonNumbers } from '@/components/common/drawing-overlays'
import { GDT_LABEL } from '@/components/common/GdtGlyph'
import { formatTolerance } from '@/lib/format'
import { tolText } from '@/lib/drawing'

function methodFor(d: Dimension): Characteristic['method'] {
  const band = d.upper - d.lower
  if (d.type === 'thread') return 'Thread gauge'
  if (d.type === 'radius' || d.type === 'chamfer') return 'Visual'
  if (d.type === 'angle') return 'CMM'
  if (d.type === 'diameter' && /H\d|N\d/.test(d.fit ?? '')) return 'Bore gauge'
  if (d.type === 'diameter' && band <= 0.05) return 'Micrometer'
  if (d.type === 'linear' && d.nominal > 50) return 'Height gauge'
  return 'Vernier'
}

function isCritical(d: Dimension) {
  return d.upper - d.lower <= 0.04
}

export function characteristicsFrom(dimensions: Dimension[], gdt: GdtCallout[]): Characteristic[] {
  const balloons = balloonNumbers({ dimensions, gdt })
  const dims: Characteristic[] = dimensions.map((d) => ({
    balloon: balloons[d.id],
    refId: d.id,
    kind: 'dimension',
    characteristic: d.feature,
    nominal: d.label,
    tolerance: formatTolerance(d.upper, d.lower),
    lsl: d.type === 'thread' || d.type === 'chamfer' ? undefined : +(d.nominal + d.lower).toFixed(4),
    usl: d.type === 'thread' || d.type === 'chamfer' ? undefined : +(d.nominal + d.upper).toFixed(4),
    method: methodFor(d),
    frequency: isCritical(d) ? '100% first 5, then 1 in 10' : '1 in 20',
    critical: isCritical(d),
  }))
  const g: Characteristic[] = gdt.map((c) => ({
    balloon: balloons[c.id],
    refId: c.id,
    kind: 'gdt',
    characteristic: `${GDT_LABEL[c.symbol]} · ${c.feature}`,
    nominal: tolText(c) + (c.datums.length ? ` | ${c.datums.join(' | ')}` : ''),
    tolerance: `0 / ${c.tolerance}`,
    lsl: 0,
    usl: c.tolerance,
    method: 'CMM',
    frequency: '100% first 5, then 1 in 10',
    critical: true,
  }))
  return [...dims, ...g]
}

// Deterministic pseudo-random so measurements look plausible but stable.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export function simulatedMeasurements(chars: Characteristic[], samples: number, filled: number, seed: number, outOfTol: number[] = []): InspectionPlan['measurements'] {
  const out: InspectionPlan['measurements'] = {}
  for (const c of chars) {
    out[c.balloon] = Array.from({ length: samples }, (_, i) => {
      if (i >= filled || c.lsl === undefined || c.usl === undefined) return null
      const r = rand(seed + c.balloon * 31 + i * 7)
      const span = c.usl - c.lsl
      if (outOfTol.includes(c.balloon) && i === 1) return +(c.usl + span * 0.35).toFixed(4)
      const v = c.kind === 'gdt' ? c.usl * (0.25 + r * 0.6) : c.lsl + span * (0.2 + r * 0.6)
      return +v.toFixed(c.kind === 'gdt' ? 4 : 3)
    })
  }
  return out
}

export function buildPlan(opts: {
  id: string
  spec: DrawingSpec
  partNo: string
  revision: string
  woId?: string
  createdAt: string
  status: InspectionPlan['status']
  filled?: number
  seed?: number
  outOfTol?: number[]
  dimensions?: Dimension[]
  gdt?: GdtCallout[]
}): InspectionPlan {
  const characteristics = characteristicsFrom(opts.dimensions ?? opts.spec.dimensions, opts.gdt ?? opts.spec.gdt)
  const sampleSize = 5
  return {
    id: opts.id,
    partNo: opts.partNo,
    revision: opts.revision,
    drawingId: opts.spec.id,
    createdAt: opts.createdAt,
    status: opts.status,
    characteristics,
    woId: opts.woId,
    sampleSize,
    measurements: simulatedMeasurements(characteristics, sampleSize, opts.filled ?? 0, opts.seed ?? 1, opts.outOfTol),
  }
}
