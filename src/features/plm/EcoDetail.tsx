import { useNavigate, useParams } from 'react-router-dom'
import { Check, CircleDashed, X } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceTab } from '@/app/useTab'
import { userName } from '@/data/core'
import type { EcoStatus } from '@/data/types'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'

const FLOW: EcoStatus[] = ['Draft', 'Review', 'Approved', 'Implemented']

export function EcoDetail() {
  const { id = '' } = useParams()
  const eco = useData((s) => s.ecos.find((e) => e.id === id))
  const parts = useData((s) => s.parts)
  const advance = useData((s) => s.advanceEco)
  const navigate = useNavigate()
  useWorkspaceTab('eco', eco?.id, eco?.id ?? '')
  if (!eco) return <EmptyState title="Change not found" />
  const idx = FLOW.indexOf(eco.status)
  const nextLabel = ['Submit for review', 'Approve', 'Mark implemented', ''][idx]
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="num text-lg font-semibold">{eco.id}</h1>
        <StatusBadge status={eco.status} />
        <span className="text-sm">{eco.title}</span>
        {nextLabel && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              advance(eco.id)
              toast.success(`${eco.id}: ${FLOW[idx + 1]}`)
            }}
          >
            {nextLabel}
          </Button>
        )}
      </div>
      <ol className="mb-5 flex items-center" aria-label="Approval workflow">
        {FLOW.map((s, i) => (
          <li key={s} className="flex flex-1 items-center">
            <div className={cn('flex items-center gap-2 text-[13px] font-medium', i > idx && 'text-muted-foreground')}>
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2', i < idx || (i === idx && s === 'Implemented') ? 'border-primary bg-primary text-primary-foreground' : i === idx ? 'border-primary text-primary' : '')}>
                {i < idx || (i === idx && s === 'Implemented') ? <Check className="h-3.5 w-3.5" /> : <span className="num text-2xs">{i + 1}</span>}
              </span>
              {s}
            </div>
            {i < FLOW.length - 1 && <div className={cn('mx-3 h-0.5 flex-1', i < idx ? 'bg-primary' : 'bg-border')} />}
          </li>
        ))}
      </ol>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {eco.type === 'ECR' ? 'Change request' : 'Change order'} · {eco.reason}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {userName(eco.requestedBy)} · {formatDate(eco.createdAt)}
            </span>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            <p>{eco.description}</p>
            <div>
              <div className="mb-1 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Affected parts</div>
              <div className="flex flex-wrap gap-2">
                {eco.affectedParts.map((pn) => {
                  const p = parts.find((x) => x.partNo === pn)
                  return (
                    <button key={pn} onClick={() => navigate(`/parts/${pn}`)} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 hover:bg-accent">
                      <span className="num font-medium text-primary">{pn}</span>
                      {p && <span className="text-xs text-muted-foreground">rev {p.revision}</span>}
                      {p && <StatusBadge status={p.status} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approvals</CardTitle>
          </CardHeader>
          <ul className="divide-y">
            {eco.approvals.map((a) => (
              <li key={a.role + a.userId} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                {a.decision === 'Approved' ? <Check className="h-4 w-4 text-emerald-600" /> : a.decision === 'Rejected' ? <X className="h-4 w-4 text-red-600" /> : <CircleDashed className="h-4 w-4 text-muted-foreground" />}
                <div className="flex-1">
                  <div className="font-medium">{userName(a.userId)}</div>
                  <div className="text-xs text-muted-foreground">{a.role}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={a.decision} />
                  {a.at && <div className="num text-2xs text-muted-foreground">{formatDateTime(a.at)}</div>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
