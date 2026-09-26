import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, ClipboardList, Cog, FileText, ShieldAlert, Building2, Truck, ShoppingCart, GitPullRequest, ListChecks, X, Workflow } from 'lucide-react'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import { useUi, type TabKind } from '@/store/ui'

const ICONS: Record<TabKind, React.ComponentType<{ className?: string }>> = {
  quote: FileText,
  part: Box,
  wo: Cog,
  so: ClipboardList,
  ncr: ShieldAlert,
  customer: Building2,
  supplier: Truck,
  po: ShoppingCart,
  eco: GitPullRequest,
  plan: ListChecks,
  capa: Workflow,
}

export function WorkspaceTabs() {
  const tabs = useUi((s) => s.tabs)
  const closeTab = useUi((s) => s.closeTab)
  const closeOthers = useUi((s) => s.closeOtherTabs)
  const moveTab = useUi((s) => s.moveTab)
  const location = useLocation()
  const navigate = useNavigate()
  const dragFrom = useRef<number | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)

  if (!tabs.length) return null

  const close = (id: string, path: string) => {
    const next = closeTab(id)
    if (location.pathname === path) navigate(next ? next.path : '/')
  }

  return (
    <div className="flex h-9 shrink-0 items-end gap-px overflow-x-auto border-b bg-muted/40 px-2 scrollbar-none" role="tablist" aria-label="Open documents">
      {tabs.map((t, i) => {
        const active = location.pathname === t.path
        const Icon = ICONS[t.kind]
        return (
          <ContextMenu key={t.id}>
            <ContextMenuTrigger asChild>
              <div
                role="tab"
                aria-selected={active}
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  dragFrom.current = i
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropAt(i)
                }}
                onDragLeave={() => setDropAt(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragFrom.current !== null && dragFrom.current !== i) moveTab(dragFrom.current, i)
                  dragFrom.current = null
                  setDropAt(null)
                }}
                onClick={() => navigate(t.path)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(t.path)}
                onAuxClick={(e) => e.button === 1 && close(t.id, t.path)}
                className={cn(
                  'group relative flex h-8 min-w-[120px] max-w-[220px] shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-t-md border border-b-0 border-transparent px-2.5 text-xs text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  active && 'border-border bg-background text-foreground shadow-[0_1px_0_0_hsl(var(--background))]',
                  dropAt === i && 'border-l-2 border-l-primary',
                )}
              >
                {active && <span className="absolute inset-x-0 top-0 h-0.5 rounded-t bg-primary" />}
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="num truncate font-medium">{t.title}</span>
                {t.subtitle && <span className="truncate text-2xs text-muted-foreground">{t.subtitle}</span>}
                <button
                  className="ml-auto rounded p-0.5 opacity-60 hover:bg-accent hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Close ${t.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    close(t.id, t.path)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => close(t.id, t.path)}>Close</ContextMenuItem>
              <ContextMenuItem
                onSelect={() => {
                  closeOthers(t.id)
                  navigate(t.path)
                }}
              >
                Close others
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </div>
  )
}
