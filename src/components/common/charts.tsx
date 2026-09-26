import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const AXIS = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const

export const GRID = { stroke: 'hsl(var(--border))', strokeDasharray: '3 3', vertical: false } as const

export const TOOLTIP = {
  contentStyle: {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 6,
    fontSize: 12,
    color: 'hsl(var(--popover-foreground))',
  },
  cursor: { fill: 'hsl(var(--muted))', opacity: 0.5 },
} as const

export const C = {
  primary: 'hsl(var(--primary))',
  ai: 'hsl(var(--ai))',
  muted: 'hsl(var(--muted-foreground))',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  teal: '#14b8a6',
}

export function ChartCard({ title, subtitle, children, className, actions, height = 220 }: { title: string; subtitle?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode; height?: number }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="mt-1 text-2xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="p-3" style={{ height }}>
        {children}
      </CardContent>
    </Card>
  )
}
