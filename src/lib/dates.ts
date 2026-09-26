// The demo runs on a fixed "today" so mock data stays consistent.
export const TODAY = new Date('2026-09-24T10:30:00')

export function daysFromToday(days: number, hour = 10): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function diffDays(iso: string, from: Date = TODAY): number {
  const d = new Date(iso)
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const b = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.round((a - b) / 86400000)
}

export function isOverdue(iso: string): boolean {
  return diffDays(iso) < 0
}

export function startOfWeek(date: Date = TODAY): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}
