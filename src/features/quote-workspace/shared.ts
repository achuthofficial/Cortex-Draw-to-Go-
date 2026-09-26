import type { ItemStatus, QuoteState } from '@/data/types'

export type WsTab = 'extraction' | 'checks' | 'plan' | 'costing' | 'preview'
export const WS_TABS: WsTab[] = ['extraction', 'checks', 'plan', 'costing', 'preview']

export function reviewStats(q: QuoteState) {
  const all: { status: ItemStatus; confidence: number }[] = [...q.dimensions, ...q.gdt, ...q.datums, ...q.notes]
  const total = all.length
  const reviewed = all.filter((x) => x.status === 'Accepted' || x.status === 'Edited').length
  const flagged = all.filter((x) => x.status === 'Flagged').length
  const pending = all.filter((x) => x.status === 'Pending').length
  const highPending = all.filter((x) => x.status === 'Pending' && x.confidence >= 90).length
  return { total, reviewed, flagged, pending, highPending, done: total > 0 && reviewed === total }
}

export interface SelectionProps {
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
}
