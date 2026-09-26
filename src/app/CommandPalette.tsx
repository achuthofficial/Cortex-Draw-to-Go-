import { useNavigate } from 'react-router-dom'
import { Boxes, Cog, FileText, Keyboard, Moon, PanelLeft, Plus, ShieldAlert, Sparkles, Tablet, ClipboardList, Box } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { customerName } from '@/data/core'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'
import { NAV } from './nav'

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen)
  const setOpen = useUi((s) => s.setPalette)
  const navigate = useNavigate()
  const ui = useUi()
  const rfqs = useData((s) => s.rfqs)
  const parts = useData((s) => s.parts)
  const orders = useData((s) => s.salesOrders)
  const wos = useData((s) => s.workOrders)
  const ncrs = useData((s) => s.ncrs)

  const run = (fn: () => void) => {
    setOpen(false)
    setTimeout(fn, 0)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl overflow-hidden p-0" hideClose>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command loop>
          <CommandInput placeholder="Search RFQs, parts, orders, work orders, NCRs… or type a command" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => run(() => ui.setNewRfq(true))}>
                <Plus /> New RFQ <span className="ml-auto font-mono text-2xs text-muted-foreground">Ctrl N</span>
              </CommandItem>
              <CommandItem onSelect={() => run(() => ui.setCopilot(true))}>
                <Sparkles className="!text-ai" /> Ask AI Copilot <span className="ml-auto font-mono text-2xs text-muted-foreground">Ctrl J</span>
              </CommandItem>
              <CommandItem onSelect={() => run(ui.toggleTheme)}>
                <Moon /> Toggle light / dark theme
              </CommandItem>
              <CommandItem onSelect={() => run(ui.toggleSidebar)}>
                <PanelLeft /> Collapse / expand sidebar <span className="ml-auto font-mono text-2xs text-muted-foreground">Ctrl B</span>
              </CommandItem>
              <CommandItem onSelect={() => run(() => navigate('/operator/WO-26-0405'))}>
                <Tablet /> Open Operator mode (CNC Turning Center 1)
              </CommandItem>
              <CommandItem onSelect={() => run(() => ui.setShortcuts(true))}>
                <Keyboard /> Keyboard shortcuts <span className="ml-auto font-mono text-2xs text-muted-foreground">?</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              {NAV.map((n) => (
                <CommandItem key={n.to} value={`go ${n.label}`} onSelect={() => run(() => navigate(n.to))}>
                  <n.icon /> {n.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="RFQs and quotes">
              {rfqs.slice(0, 40).map((r) => (
                <CommandItem key={r.id} value={`${r.id} ${customerName(r.customerId)} ${r.parts.map((p) => p.partNo).join(' ')}`} onSelect={() => run(() => navigate(`/quotes/${r.id}`))}>
                  <FileText /> <span className="num">{r.id}</span>
                  <span className="truncate text-muted-foreground">
                    {customerName(r.customerId)} · {r.parts[0].partNo}
                  </span>
                  <span className="ml-auto text-2xs text-muted-foreground">{r.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Parts">
              {parts.map((p) => (
                <CommandItem key={p.partNo} value={`${p.partNo} ${p.description}`} onSelect={() => run(() => navigate(`/parts/${p.partNo}`))}>
                  <Box /> <span className="num">{p.partNo}</span> <span className="truncate text-muted-foreground">{p.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Sales orders">
              {orders.map((o) => (
                <CommandItem key={o.id} value={`${o.id} ${customerName(o.customerId)} ${o.customerPo}`} onSelect={() => run(() => navigate(`/orders/${o.id}`))}>
                  <ClipboardList /> <span className="num">{o.id}</span> <span className="truncate text-muted-foreground">{customerName(o.customerId)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Work orders">
              {wos.map((w) => (
                <CommandItem key={w.id} value={`${w.id} ${w.partNo}`} onSelect={() => run(() => navigate(`/production/wo/${w.id}`))}>
                  <Cog /> <span className="num">{w.id}</span> <span className="truncate text-muted-foreground">{w.partNo}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="NCRs">
              {ncrs.map((n) => (
                <CommandItem key={n.id} value={`${n.id} ${n.partNo} ${n.defect}`} onSelect={() => run(() => navigate(`/quality/ncr/${n.id}`))}>
                  <ShieldAlert /> <span className="num">{n.id}</span> <span className="truncate text-muted-foreground">{n.defect}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Inventory">
              <CommandItem onSelect={() => run(() => navigate('/inventory'))}>
                <Boxes /> Stock and purchase orders
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
