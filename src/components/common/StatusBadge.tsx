import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Tone = NonNullable<BadgeProps['variant']>

const TONES: Record<string, Tone> = {
  // green: accepted / pass / running / done
  Accepted: 'green', Won: 'green', Running: 'green', Released: 'green', Completed: 'green', Done: 'green', Pass: 'green', OK: 'green',
  Shipped: 'green', Invoiced: 'green', Paid: 'green', Received: 'green', Closed: 'gray', Approved: 'green', Implemented: 'green', Effective: 'green',
  // amber: needs review / warning / idle
  'Needs review': 'amber', Idle: 'amber', Setup: 'amber', Low: 'amber', Warning: 'amber', 'On hold': 'amber', 'Under review': 'amber', Review: 'amber',
  'Partially received': 'amber', 'Partially invoiced': 'amber', 'In change': 'amber', 'Ready to ship': 'amber', 'In review': 'amber', Pending: 'amber',
  Medium: 'amber', Rework: 'amber', 'Use as is': 'amber',
  // red: flagged / fail / down
  Flagged: 'red', Lost: 'red', Down: 'red', Out: 'red', Fail: 'red', Critical: 'red', Open: 'red', Overdue: 'red', Scrap: 'red', Urgent: 'red',
  'Return to supplier': 'red',
  // blue: in progress
  Extracting: 'blue', Costing: 'blue', 'In progress': 'blue', 'In production': 'blue', Sent: 'blue', Confirmed: 'blue', Dispositioned: 'blue',
  Maintenance: 'blue', Info: 'blue', 'Root cause': 'blue', Action: 'blue', Verification: 'blue', High: 'amber',
  // gray: draft
  New: 'gray', Draft: 'gray', Planned: 'gray', Obsolete: 'gray', 'Not invoiced': 'gray', Normal: 'gray', Edited: 'violet',
}

const DOT: Record<Tone, string> = {
  green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500', gray: 'bg-slate-400', violet: 'bg-ai',
  default: 'bg-primary', secondary: 'bg-slate-400', outline: 'bg-slate-400',
}

export function statusTone(status: string): Tone {
  return TONES[status] ?? 'gray'
}

export function StatusBadge({ status, className, dot = true }: { status: string; className?: string; dot?: boolean }) {
  const tone = statusTone(status)
  return (
    <Badge variant={tone} className={className}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} aria-hidden />}
      {status}
    </Badge>
  )
}
