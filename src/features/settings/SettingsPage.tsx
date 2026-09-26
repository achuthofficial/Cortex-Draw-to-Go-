import { useState } from 'react'
import { Building2, Check, Cog, FlaskConical, IndianRupee, Plug, Scale, Sparkles, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { company, users } from '@/data/core'
import type { CustomerTier, Role } from '@/data/types'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

const SECTIONS = [
  { id: 'company', label: 'Company profile', icon: Building2 },
  { id: 'machines', label: 'Machines and work centres', icon: Cog },
  { id: 'materials', label: 'Material price list', icon: IndianRupee },
  { id: 'rules', label: 'Quoting rules', icon: Scale },
  { id: 'users', label: 'Users and roles', icon: Users },
  { id: 'ai', label: 'AI settings', icon: Sparkles },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'prototype', label: 'Prototype', icon: FlaskConical },
] as const

type Section = (typeof SECTIONS)[number]['id']

const ROLES: Role[] = ['Owner', 'Estimator', 'Planner', 'Operator', 'Quality', 'Viewer']
const PERMS: [string, Role[]][] = [
  ['Create and edit RFQs', ['Owner', 'Estimator']],
  ['Approve and send quotes', ['Owner', 'Estimator']],
  ['Change margin below tier default', ['Owner']],
  ['Edit parts, BOMs and revisions', ['Owner', 'Estimator', 'Planner']],
  ['Approve engineering changes', ['Owner', 'Quality']],
  ['Create sales orders', ['Owner', 'Estimator', 'Planner']],
  ['Schedule production', ['Owner', 'Planner']],
  ['Record production quantities', ['Owner', 'Planner', 'Operator']],
  ['Raise NCRs', ['Owner', 'Planner', 'Operator', 'Quality']],
  ['Disposition NCRs and CAPA', ['Owner', 'Quality']],
  ['Create purchase orders', ['Owner', 'Planner']],
  ['View reports', ['Owner', 'Estimator', 'Planner', 'Quality', 'Viewer']],
  ['Manage settings and users', ['Owner']],
]

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-[220px_1fr] items-center gap-4 py-2">
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        {hint && <div className="text-2xs text-muted-foreground">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const [section, setSection] = useState<Section>('company')
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Settings" description="Company, capacity, pricing, quoting rules, access and AI behaviour. Changes apply immediately to new calculations." />
      <div className="flex min-h-0 flex-1">
        <nav className="w-56 shrink-0 space-y-0.5 border-r p-2" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              aria-current={section === s.id}
              className={cn('flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground', section === s.id && 'bg-accent font-medium text-foreground')}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto p-5">
          {section === 'company' && <CompanySection />}
          {section === 'machines' && <MachinesSection />}
          {section === 'materials' && <MaterialsSection />}
          {section === 'rules' && <RulesSection />}
          {section === 'users' && <UsersSection />}
          {section === 'ai' && <AiSection />}
          {section === 'integrations' && <IntegrationsSection />}
          {section === 'prototype' && <PrototypeSection />}
        </div>
      </div>
    </div>
  )
}

function CompanySection() {
  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company profile and GST</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Trading name"><Input defaultValue={company.name} /></Row>
          <Row label="Legal name"><Input defaultValue={company.legalName} /></Row>
          <Row label="Address"><Input defaultValue={company.address} /></Row>
          <Row label="GSTIN" hint="State code 36 · Telangana"><Input defaultValue={company.gstin} className="num" /></Row>
          <Row label="PAN"><Input defaultValue={company.pan} className="num" /></Row>
          <Row label="Phone / email">
            <div className="flex gap-2">
              <Input defaultValue={company.phone} className="num" />
              <Input defaultValue={company.email} />
            </div>
          </Row>
          <Row label="Bank details"><Input defaultValue={company.bank} /></Row>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Letterhead</CardTitle>
          <CardDescription>Used on quotes, invoices and dispatch documents.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded border-2 border-dashed text-2xs text-muted-foreground">Logo</div>
          <Button variant="outline" size="sm" onClick={() => toast('Logo upload uses the desktop file picker in the packaged app')}>
            Upload logo
          </Button>
          <div className="text-xs text-muted-foreground">PNG or SVG, at least 400 px wide. Accent colour: deep blue.</div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success('Company profile saved')}>Save changes</Button>
    </div>
  )
}

function MachinesSection() {
  const machines = useData((s) => s.machines)
  const setRate = useData((s) => s.setMachineRate)
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Machines and work centres</CardTitle>
        <CardDescription>Hourly rates flow straight into the Costing tab of every quote.</CardDescription>
      </CardHeader>
      <table className="w-full text-[13px]">
        <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="h-8 px-3 text-left font-semibold">Machine</th>
            <th className="px-3 text-left font-semibold">Make</th>
            <th className="px-3 text-left font-semibold">Capabilities</th>
            <th className="px-3 text-left font-semibold">Max part size</th>
            <th className="px-3 text-left font-semibold">Shift calendar</th>
            <th className="w-32 px-3 text-right font-semibold">₹ / hour</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {machines.map((m) => (
            <tr key={m.id}>
              <td className="h-10 px-3 font-medium">{m.name}</td>
              <td className="px-3 text-xs">{m.make}</td>
              <td className="px-3">
                <div className="flex flex-wrap gap-1">
                  {m.capabilities.map((c) => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              </td>
              <td className="num px-3 text-xs">{m.maxPart}</td>
              <td className="px-3 text-xs">{m.shifts} shift{m.shifts > 1 ? 's' : ''} · Mon–Sat</td>
              <td className="px-3">
                <Input type="number" value={m.hourlyRate} onChange={(e) => setRate(m.id, Math.max(0, +e.target.value))} className="num h-7 text-right" aria-label={`Hourly rate for ${m.name}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function MaterialsSection() {
  const materials = useData((s) => s.materials)
  const setPrice = useData((s) => s.setMaterialPrice)
  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader>
        <CardTitle>Material price list</CardTitle>
        <CardDescription>Used when a grade is selected in Costing. Last synced from supplier price lists on 22-Sep-2026.</CardDescription>
      </CardHeader>
      <table className="w-full text-[13px]">
        <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="h-8 px-3 text-left font-semibold">Grade</th>
            <th className="px-3 text-left font-semibold">Description</th>
            <th className="px-3 text-right font-semibold">Density g/cm³</th>
            <th className="w-36 px-3 text-right font-semibold">₹ / kg</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {materials.map((m) => (
            <tr key={m.code}>
              <td className="num h-10 px-3 font-medium">{m.code}</td>
              <td className="px-3 text-xs">{m.name}</td>
              <td className="num px-3 text-right">{m.density.toFixed(2)}</td>
              <td className="px-3">
                <Input type="number" value={m.pricePerKg} onChange={(e) => setPrice(m.code, Math.max(0, +e.target.value))} className="num h-7 text-right" aria-label={`Price per kg for ${m.code}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function RulesSection() {
  const rules = useData((s) => s.rules)
  const setRules = useData((s) => s.setRules)
  const tiers: CustomerTier[] = ['Strategic', 'Key', 'Standard']
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Quoting rules</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <Row label="Default overhead" hint="Applied on direct cost">
          <div className="flex items-center gap-3">
            <Slider value={[rules.defaultOverheadPct]} min={0} max={40} step={0.5} onValueChange={([v]) => setRules({ defaultOverheadPct: v })} className="max-w-xs" aria-label="Default overhead" />
            <span className="num w-12 text-sm">{rules.defaultOverheadPct}%</span>
          </div>
        </Row>
        {tiers.map((t) => (
          <Row key={t} label={`Margin · ${t} customers`}>
            <div className="flex items-center gap-3">
              <Slider value={[rules.marginByTier[t]]} min={0} max={40} step={0.5} onValueChange={([v]) => setRules({ marginByTier: { ...rules.marginByTier, [t]: v } })} className="max-w-xs" aria-label={`Margin for ${t}`} />
              <span className="num w-12 text-sm">{rules.marginByTier[t]}%</span>
            </div>
          </Row>
        ))}
        <Row label="Minimum order value">
          <div className="relative max-w-[200px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
            <Input type="number" value={rules.minOrderValue} onChange={(e) => setRules({ minOrderValue: +e.target.value })} className="num pl-6" />
          </div>
        </Row>
        <Row label="Round unit prices to">
          <div className="flex gap-1.5">
            {([1, 10, 100] as const).map((r) => (
              <Button key={r} size="sm" variant={rules.roundingTo === r ? 'default' : 'outline'} onClick={() => setRules({ roundingTo: r })}>
                ₹{r}
              </Button>
            ))}
          </div>
        </Row>
        <Row label="Quote validity">
          <div className="flex items-center gap-2">
            <Input type="number" value={rules.validityDays} onChange={(e) => setRules({ validityDays: Math.max(1, +e.target.value) })} className="num w-24" />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </Row>
        <Row label="GST on quotes"><span className="num text-[13px]">18% (CGST 9% + SGST 9% within Telangana, IGST 18% inter-state)</span></Row>
      </CardContent>
    </Card>
  )
}

function UsersSection() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <Button size="sm" variant="outline" onClick={() => toast('Invitations are sent by email in the production app')}>
            Invite user
          </Button>
        </CardHeader>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-2xs font-semibold text-primary">{u.initials}</span>
              <span className="w-40 font-medium">{u.name}</span>
              <span className="flex-1 text-xs text-muted-foreground">{u.email}</span>
              <Badge variant="outline">{u.role}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Permissions matrix</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/60 text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="h-8 px-3 text-left font-semibold">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 text-center font-semibold">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERMS.map(([p, roles]) => (
                <tr key={p}>
                  <td className="h-9 px-3">{p}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 text-center">
                      {roles.includes(r) ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" /> : <X className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" aria-label="Not allowed" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function AiSection() {
  const ai = useData((s) => s.ai)
  const setAi = useData((s) => s.setAi)
  const types = [
    ['linear', 'Linear dimensions'],
    ['diameter', 'Diameters'],
    ['radius', 'Radii'],
    ['angle', 'Angles'],
    ['thread', 'Threads'],
    ['chamfer', 'Chamfers'],
    ['gdt', 'GD&T callouts'],
    ['notes', 'General notes'],
  ] as const
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-ai" /> AI extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <Row label="Auto-accept threshold" hint="Items at or above this confidence are accepted without review">
          <div className="flex items-center gap-3">
            <Slider value={[ai.autoAcceptThreshold]} min={70} max={100} step={1} onValueChange={([v]) => setAi({ autoAcceptThreshold: v })} className="max-w-xs" aria-label="Auto-accept threshold" />
            <span className="num w-12 text-sm">{ai.autoAcceptThreshold}%</span>
          </div>
        </Row>
        <Row label="Always needs human review" hint="Never auto-accepted, regardless of confidence">
          <div className="grid grid-cols-2 gap-2">
            {types.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[13px]">
                <Checkbox checked={ai.alwaysReview.includes(key)} onCheckedChange={(v) => setAi({ alwaysReview: v ? [...ai.alwaysReview, key] : ai.alwaysReview.filter((x) => x !== key) })} />
                {label}
              </label>
            ))}
          </div>
        </Row>
        <Row label="Confidence bands">
          <div className="flex gap-2 text-xs">
            <Badge variant="green">High ≥ 90%</Badge>
            <Badge variant="amber">Medium 70–89%</Badge>
            <Badge variant="red">Low &lt; 70%</Badge>
          </div>
        </Row>
      </CardContent>
    </Card>
  )
}

function IntegrationsSection() {
  const items = [
    ['Email (IMAP / Microsoft 365)', 'Import RFQs and drawings from a shared inbox; send quotes from DrawToShip.'],
    ['Tally Prime', 'Push sales invoices and purchase vouchers; sync ledgers and GST returns.'],
    ['SAP Business One', 'Sync items, BOMs, sales orders and stock for group companies.'],
    ['WhatsApp Business', 'Send quote PDFs and dispatch updates to customers on WhatsApp.'],
  ]
  return (
    <div className="grid max-w-4xl gap-3 md:grid-cols-2">
      {items.map(([name, desc]) => (
        <Card key={name}>
          <CardContent className="flex h-full flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">{name}</span>
              <Badge variant="gray">Not connected</Badge>
            </div>
            <p className="flex-1 text-xs text-muted-foreground">{desc}</p>
            <Button size="sm" variant="outline" className="self-start" onClick={() => toast(`${name} connection is a placeholder in this prototype`)}>
              Connect
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PrototypeSection() {
  const simulate = useUi((s) => s.simulateErrors)
  const setSimulate = useUi((s) => s.setSimulateErrors)
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Prototype controls</CardTitle>
        <CardDescription>Demo helpers. All data is in memory and resets on reload.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <Row label="Simulate data errors" hint="Lists show their error state with a Retry button">
          <div className="flex items-center gap-2">
            <Switch id="sim-err" checked={simulate} onCheckedChange={setSimulate} />
            <Label htmlFor="sim-err" className="text-[13px] font-normal text-foreground">
              {simulate ? 'On' : 'Off'}
            </Label>
          </div>
        </Row>
        <Row label="Reset demo data">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </Row>
      </CardContent>
    </Card>
  )
}
