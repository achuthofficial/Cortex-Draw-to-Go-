import type { Annotation, Datum, Dimension, DimType, DrawingNote, GdtCallout, GdtSymbol, MaterialModifier } from '../types'

export function makeDim(prefix: string) {
  return (
    n: number,
    view: string,
    feature: string,
    type: DimType,
    label: string,
    nominal: number,
    upper: number,
    lower: number,
    confidence: number,
    anno: Annotation,
    fit?: string,
  ): Dimension => ({
    id: `${prefix}-d${n}`,
    n,
    view,
    feature,
    type,
    label,
    nominal,
    upper,
    lower,
    confidence,
    status: 'Pending',
    anno,
    fit,
  })
}

export function makeGdt(prefix: string) {
  return (
    n: number,
    symbol: GdtSymbol,
    tolerance: number,
    opts: { dia?: boolean; mod?: MaterialModifier; datums?: string[] },
    feature: string,
    view: string,
    confidence: number,
    frame: GdtCallout['frame'],
  ): GdtCallout => ({
    id: `${prefix}-g${n}`,
    n,
    symbol,
    tolerance,
    diameterZone: opts.dia ?? false,
    modifier: opts.mod ?? 'RFS',
    datums: opts.datums ?? [],
    feature,
    view,
    confidence,
    status: 'Pending',
    frame,
  })
}

export function makeDatum(prefix: string) {
  return (letter: Datum['letter'], feature: string, view: string, confidence: number, anno: Datum['anno']): Datum => ({
    id: `${prefix}-dt${letter}`,
    letter,
    feature,
    view,
    confidence,
    status: 'Pending',
    anno,
  })
}

export function makeNotes(prefix: string, notes: [string, number][]): DrawingNote[] {
  return notes.map(([text, confidence], i) => ({ id: `${prefix}-n${i + 1}`, n: i + 1, text, confidence, status: 'Pending' }))
}

/** Points on a circle, degrees CCW from +x. */
export function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [+(r * Math.cos(a)).toFixed(3), +(r * Math.sin(a)).toFixed(3)]
}

export function mirrorY(pts: [number, number][]): [number, number][] {
  return pts.map(([x, y]) => [x, -y] as [number, number]).reverse()
}
