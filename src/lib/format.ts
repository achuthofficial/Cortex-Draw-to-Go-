// Locale helpers: India (INR with lakh/crore grouping, metric units, DD-MMM-YYYY).

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('en-IN')

export function formatINR(value: number, opts: { decimals?: boolean } = {}): string {
  return (opts.decimals === false ? inr0 : inr).format(value)
}

/** Compact INR: ₹4.2 L, ₹1.3 Cr. */
export function formatINRCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(1)} L`
  if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)} K`
  return formatINR(value, { decimals: false })
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

export function formatInt(value: number): string {
  return num.format(value)
}

export function formatMM(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} mm`
}

export function formatKg(value: number): string {
  return `${value.toFixed(2)} kg`
}

export function formatPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`
}

export function formatDateTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatShortDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}`
}

export function formatTolerance(upper: number, lower: number): string {
  if (upper === -lower && upper !== 0) return `±${fmtTol(upper)}`
  return `${signed(upper)} / ${signed(lower)}`
}

function fmtTol(v: number) {
  return v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function signed(v: number) {
  if (v === 0) return '0'
  return `${v > 0 ? '+' : '−'}${fmtTol(Math.abs(v))}`
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`
  return `${h.toFixed(1)} h`
}
