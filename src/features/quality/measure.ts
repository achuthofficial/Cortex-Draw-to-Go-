import type { Characteristic, InspectionPlan } from '@/data/types'

export type Verdict = 'Pass' | 'Fail' | 'Pending'

export function verdict(c: Characteristic, v: number | null | undefined): Verdict {
  if (v === null || v === undefined || Number.isNaN(v)) return 'Pending'
  if (c.lsl === undefined || c.usl === undefined) return 'Pass'
  return v >= c.lsl - 1e-9 && v <= c.usl + 1e-9 ? 'Pass' : 'Fail'
}

export function planProgress(p: InspectionPlan) {
  let measured = 0
  let fails = 0
  let total = 0
  for (const c of p.characteristics) {
    if (c.lsl === undefined) continue
    const row = p.measurements[c.balloon] ?? []
    for (let i = 0; i < p.sampleSize; i++) {
      total++
      const v = row[i]
      if (v !== null && v !== undefined) {
        measured++
        if (verdict(c, v) === 'Fail') fails++
      }
    }
  }
  return { measured, total, fails, pct: total ? Math.round((measured / total) * 100) : 0 }
}
