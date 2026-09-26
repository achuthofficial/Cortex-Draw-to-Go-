export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 90) return 'High'
  if (c >= 70) return 'Medium'
  return 'Low'
}
