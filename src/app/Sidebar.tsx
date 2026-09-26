import { NavLink, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'
import { NAV } from './nav'

export function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const toggle = useUi((s) => s.toggleSidebar)
  const location = useLocation()
  const openRfqs = useData((s) => s.rfqs.filter((r) => !r.archived && ['New', 'Extracting', 'Needs review', 'Costing'].includes(r.status)).length)
  const openNcrs = useData((s) => s.ncrs.filter((n) => n.status !== 'Closed').length)
  const downMachines = useData((s) => s.machines.filter((m) => m.state === 'Down').length)
  const counts: Record<string, { n: number; tone: string } | undefined> = {
    '/rfqs': { n: openRfqs, tone: 'bg-primary/10 text-primary' },
    '/quality': { n: openNcrs, tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
    '/production': downMachines ? { n: downMachines, tone: 'bg-red-500/15 text-red-700 dark:text-red-400' } : undefined,
  }

  return (
    <nav aria-label="Main" className={cn('flex shrink-0 flex-col border-r bg-sidebar transition-[width] duration-150', collapsed ? 'w-[52px]' : 'w-[216px]')}>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = 'end' in item && item.end ? location.pathname === '/' : ('match' in item ? item.match : [item.to]).some((m) => location.pathname.startsWith(m))
          const count = counts[item.to]
          const link = (
            <NavLink
              to={item.to}
              className={cn(
                'group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                active && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                collapsed && 'justify-center px-0',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && count && count.n > 0 && <span className={cn('num rounded px-1.5 text-2xs font-semibold', count.tone)}>{count.n}</span>}
            </NavLink>
          )
          return <li key={item.to}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>
        })}
      </ul>
      <div className="border-t p-2">
        <button
          onClick={toggle}
          className={cn('flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground', collapsed && 'justify-center px-0')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Collapse</span>
              <kbd className="font-mono text-2xs">Ctrl B</kbd>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}
