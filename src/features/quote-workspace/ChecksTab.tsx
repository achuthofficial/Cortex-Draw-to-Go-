import { AlertOctagon, AlertTriangle, CheckCircle2, Info, MessageSquareWarning, Sparkles } from 'lucide-react'
import { AiLabel } from '@/components/common/AiMark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CheckSeverity, DrawingSpec, QuoteState } from '@/data/types'
import { stackupResult } from '@/lib/costing'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'
import type { SelectionProps } from './shared'

const SEV: Record<CheckSeverity, { icon: React.ComponentType<{ className?: string }>; cls: string; badge: 'red' | 'amber' | 'blue' }> = {
  Critical: { icon: AlertOctagon, cls: 'border-l-red-500', badge: 'red' },
  Warning: { icon: AlertTriangle, cls: 'border-l-amber-500', badge: 'amber' },
  Info: { icon: Info, cls: 'border-l-blue-500', badge: 'blue' },
}

export function ChecksTab({ quote, spec, sel }: { quote: QuoteState; spec: DrawingSpec; sel: SelectionProps }) {
  const resolve = useData((s) => s.resolveCheck)
  const setCopilot = useUi((s) => s.setCopilot)
  const allItems = [...quote.dimensions.map((d) => ({ id: d.id, label: `#${d.n} ${d.label}` })), ...quote.gdt.map((g) => ({ id: g.id, label: `GD&T ${g.n}` })), ...quote.notes.map((n) => ({ id: n.id, label: `Note ${n.n}` }))]
  const order: CheckSeverity[] = ['Critical', 'Warning', 'Info']
  const checks = quote.checks.slice().sort((a, b) => Number(!!a.resolved) - Number(!!b.resolved) || order.indexOf(a.severity) - order.indexOf(b.severity))

  // Stack-up uses the current (possibly edited) dimension values.
  const links = spec.stackup.links.map((l) => {
    const d = quote.dimensions.find((x) => x.id === l.refId)
    if (!d) return { ...l, n: undefined as number | undefined }
    return { ...l, nominal: d.nominal + (d.upper + d.lower) / 2, tol: (d.upper - d.lower) / 2, n: d.n }
  })
  const r = stackupResult(links)
  const req = spec.stackup.requirement
  const wcMin = r.nominal - r.worst
  const wcMax = r.nominal + r.worst
  const rssMin = r.nominal - r.rss
  const rssMax = r.nominal + r.rss
  const wcPass = wcMin >= req.min - 1e-9 && wcMax <= req.max + 1e-9
  const rssPass = rssMin >= req.min - 1e-9 && rssMax <= req.max + 1e-9
  const lo = Math.min(req.min, wcMin) - 0.1
  const hi = Math.max(req.max, wcMax) + 0.1
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`

  return (
    <div className="h-full space-y-3 overflow-y-auto p-3">
      <div className="flex items-center gap-2">
        <AiLabel>Manufacturability review</AiLabel>
        <span className="text-xs text-muted-foreground">
          {checks.filter((c) => !c.resolved).length} open · {checks.filter((c) => c.severity === 'Critical' && !c.resolved).length} critical
        </span>
      </div>
      {checks.map((c) => {
        const S = SEV[c.severity]
        return (
          <Card key={c.id} className={cn('border-l-4 shadow-none', S.cls, c.resolved && 'opacity-60')}>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-start gap-2">
                <S.icon className={cn('mt-0.5 h-4 w-4 shrink-0', c.severity === 'Critical' ? 'text-red-600' : c.severity === 'Warning' ? 'text-amber-600' : 'text-blue-600')} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={S.badge}>{c.severity}</Badge>
                    <span className="text-[13px] font-semibold">{c.title}</span>
                    <Sparkles className="h-3 w-3 text-ai" aria-label="AI finding" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Impact:</span> {c.impact}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pl-6">
                {c.refs.map((ref) => {
                  const item = allItems.find((i) => i.id === ref)
                  if (!item) return null
                  return (
                    <button
                      key={ref}
                      onClick={() => sel.onSelect(ref)}
                      onMouseEnter={() => sel.onHover(ref)}
                      onMouseLeave={() => sel.onHover(null)}
                      className={cn('num rounded border px-1.5 py-px text-2xs hover:border-primary hover:text-primary', sel.selectedId === ref && 'border-primary bg-primary/10 text-primary')}
                    >
                      {item.label}
                    </button>
                  )
                })}
                <div className="ml-auto flex gap-1">
                  {c.severity === 'Critical' && !c.resolved && (
                    <Button size="xs" variant="ai-outline" onClick={() => setCopilot(true, 'Draft a technical query to the customer')}>
                      <MessageSquareWarning /> Draft technical query
                    </Button>
                  )}
                  <Button size="xs" variant={c.resolved ? 'ghost' : 'outline'} onClick={() => resolve(quote.id, c.id, !c.resolved)}>
                    <CheckCircle2 /> {c.resolved ? 'Reopen' : 'Mark resolved'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Tolerance stack-up · {spec.stackup.name}</CardTitle>
          <div className="flex gap-1.5">
            <Badge variant={wcPass ? 'green' : 'red'}>Worst case {wcPass ? 'Pass' : 'Fail'}</Badge>
            <Badge variant={rssPass ? 'green' : 'red'}>RSS {rssPass ? 'Pass' : 'Fail'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-muted-foreground">
                <th className="py-1 text-left font-semibold">Link</th>
                <th className="py-1 text-left font-semibold">Ref</th>
                <th className="py-1 text-right font-semibold">Dir.</th>
                <th className="py-1 text-right font-semibold">Mean</th>
                <th className="py-1 text-right font-semibold">± Tol</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.map((l) => (
                <tr key={l.refId} className="cursor-pointer hover:bg-accent/60" onClick={() => sel.onSelect(l.refId)}>
                  <td className="py-1.5">{l.label}</td>
                  <td className="num py-1.5 text-xs text-primary">#{l.n}</td>
                  <td className="num py-1.5 text-right">{l.direction > 0 ? '+' : '−'}</td>
                  <td className="num py-1.5 text-right">{l.nominal.toFixed(3)}</td>
                  <td className="num py-1.5 text-right">{l.tol.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-muted p-2">
              <div className="text-muted-foreground">Requirement</div>
              <div className="num font-semibold">
                {req.min.toFixed(2)} – {req.max.toFixed(2)}
              </div>
            </div>
            <div className={cn('rounded-md p-2', wcPass ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
              <div className="text-muted-foreground">Worst case</div>
              <div className="num font-semibold">
                {wcMin.toFixed(3)} – {wcMax.toFixed(3)}
              </div>
            </div>
            <div className={cn('rounded-md p-2', rssPass ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
              <div className="text-muted-foreground">RSS (statistical)</div>
              <div className="num font-semibold">
                {rssMin.toFixed(3)} – {rssMax.toFixed(3)}
              </div>
            </div>
          </div>
          <div className="relative h-10" aria-hidden>
            <div className="absolute top-4 h-2 rounded bg-emerald-500/25" style={{ left: pos(req.min), width: `calc(${pos(req.max)} - ${pos(req.min)})` }} />
            <div className={cn('absolute top-1 h-1.5 rounded', wcPass ? 'bg-emerald-600' : 'bg-red-500')} style={{ left: pos(wcMin), width: `calc(${pos(wcMax)} - ${pos(wcMin)})` }} />
            <div className="absolute top-7 h-1.5 rounded bg-ai" style={{ left: pos(rssMin), width: `calc(${pos(rssMax)} - ${pos(rssMin)})` }} />
            <div className="absolute -top-0.5 h-10 w-px bg-foreground/60" style={{ left: pos(r.nominal) }} />
          </div>
          <div className="flex gap-4 text-2xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded bg-emerald-500/25" /> Requirement</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-emerald-600" /> Worst case</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-ai" /> RSS</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
