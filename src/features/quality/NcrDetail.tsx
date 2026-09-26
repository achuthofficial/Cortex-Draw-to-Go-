import { useNavigate, useParams } from 'react-router-dom'
import { Camera, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Field } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceTab } from '@/app/useTab'
import { supplierName, userName } from '@/data/core'
import type { NcrDisposition, NcrStatus } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'

const DISPOSITIONS: NcrDisposition[] = ['Rework', 'Scrap', 'Use as is', 'Return to supplier']
const STATUSES: NcrStatus[] = ['Open', 'Under review', 'Dispositioned', 'Closed']

export function NcrDetail() {
  const { id = '' } = useParams()
  const ncr = useData((s) => s.ncrs.find((n) => n.id === id))
  const update = useData((s) => s.updateNcr)
  const capas = useData((s) => s.capas)
  const navigate = useNavigate()
  useWorkspaceTab('ncr', ncr?.id, ncr?.id ?? '', ncr?.partNo)
  if (!ncr) return <EmptyState title="NCR not found" />
  const capa = capas.find((c) => c.id === ncr.capaId)
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="num text-lg font-semibold">{ncr.id}</h1>
        <StatusBadge status={ncr.status} />
        <span className="text-sm text-muted-foreground">{ncr.defect}</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nonconformance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <Field label="Part / material" mono>
              {ncr.partNo}
            </Field>
            <Field label="Quantity" mono>
              {ncr.qty}
            </Field>
            <Field label="Source">{ncr.source}</Field>
            <Field label="Work order" mono>
              {ncr.woId ? (
                <button className="text-primary hover:underline" onClick={() => navigate(`/production/wo/${ncr.woId}`)}>
                  {ncr.woId}
                </button>
              ) : (
                '—'
              )}
            </Field>
            <Field label="Supplier">{ncr.supplierId ? supplierName(ncr.supplierId) : '—'}</Field>
            <Field label="Raised">
              {userName(ncr.raisedBy)} · <span className="num">{formatDateTime(ncr.raisedAt)}</span>
            </Field>
            <div className="col-span-3">
              <div className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Description</div>
              <p className="text-[13px]">{ncr.description}</p>
            </div>
            <div className="col-span-3">
              <div className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">Photos</div>
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-md border bg-muted text-2xs text-muted-foreground">
                    <Camera className="h-5 w-5" /> Photo {i}
                  </div>
                ))}
                <button className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-2xs text-muted-foreground hover:bg-accent" onClick={() => toast('Camera capture is available in the desktop and tablet builds')}>
                  <ImagePlus className="h-5 w-5" /> Add photo
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Disposition">
                {DISPOSITIONS.map((d) => (
                  <button
                    key={d}
                    role="radio"
                    aria-checked={ncr.disposition === d}
                    onClick={() => {
                      update(ncr.id, { disposition: d, status: ncr.status === 'Open' || ncr.status === 'Under review' ? 'Dispositioned' : ncr.status })
                      toast.success(`${ncr.id}: ${d}`)
                    }}
                    className={cn('rounded-md border px-3 py-2 text-left text-[13px] hover:bg-accent', ncr.disposition === d && 'border-primary bg-primary/5 font-medium')}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div>
                <div className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">Status</div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <Button key={s} size="xs" variant={ncr.status === s ? 'default' : 'outline'} onClick={() => update(ncr.id, { status: s })}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Corrective action</CardTitle>
            </CardHeader>
            <CardContent className="text-[13px]">
              {capa ? (
                <button className="text-left hover:underline" onClick={() => navigate('/quality?tab=capa')}>
                  <span className="num font-medium text-primary">{capa.id}</span> · {capa.title} · <StatusBadge status={capa.stage} />
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">No CAPA linked.</span>
                  <Button size="xs" variant="outline" onClick={() => toast('CAPA creation is simulated: open the CAPA board to track actions')}>
                    Raise CAPA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
