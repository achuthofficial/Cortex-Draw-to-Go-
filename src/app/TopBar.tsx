import { useNavigate } from 'react-router-dom'
import { Bell, Factory, Inbox, LogOut, Moon, Plus, Search, ShieldCheck, Sparkles, Sun, User, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import { company, CURRENT_USER_ID, userById } from '@/data/core'
import type { Role } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

const KIND_ICON = { ai: Sparkles, rfq: Inbox, machine: Factory, quality: ShieldCheck, order: ClipboardList }

export function TopBar() {
  const navigate = useNavigate()
  const theme = useUi((s) => s.theme)
  const toggleTheme = useUi((s) => s.toggleTheme)
  const setPalette = useUi((s) => s.setPalette)
  const setNewRfq = useUi((s) => s.setNewRfq)
  const copilotOpen = useUi((s) => s.copilotOpen)
  const setCopilot = useUi((s) => s.setCopilot)
  const role = useUi((s) => s.role)
  const setRole = useUi((s) => s.setRole)
  const notifications = useData((s) => s.notifications)
  const markRead = useData((s) => s.markNotificationsRead)
  const unread = notifications.filter((n) => !n.read).length
  const user = userById(CURRENT_USER_ID)!

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-md pr-2 focus-visible:ring-2 focus-visible:ring-ring" aria-label="DrawToShip home">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
            <path d="M4 18 L12 5 L20 18 Z" />
            <path d="M8.5 13.5 H15.5" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">DrawToShip</div>
          <div className="text-2xs text-muted-foreground">{company.name}</div>
        </div>
      </button>

      <button
        onClick={() => setPalette(true)}
        className="ml-4 flex h-8 w-full max-w-md items-center gap-2 rounded-md border bg-muted/50 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search or run a command"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search RFQs, parts, orders, or run a command…</span>
        <kbd className="rounded border bg-background px-1.5 font-mono text-2xs">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip content="New RFQ (Ctrl+N)">
          <Button size="sm" onClick={() => setNewRfq(true)}>
            <Plus /> New RFQ
          </Button>
        </Tooltip>
        <Tooltip content="AI Copilot (Ctrl+J)">
          <Button variant={copilotOpen ? 'ai' : 'ai-outline'} size="sm" onClick={() => setCopilot(!copilotOpen)} aria-pressed={copilotOpen}>
            <Sparkles /> Copilot
          </Button>
        </Tooltip>
        <Popover onOpenChange={(o) => !o && unread && markRead()}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Notifications, ${unread} unread`} className="relative">
              <Bell />
              {unread > 0 && <span className="num absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unread}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-[13px] font-semibold">Notifications</span>
              <Button variant="link" size="xs" onClick={markRead}>
                Mark all read
              </Button>
            </div>
            <ul className="max-h-96 divide-y overflow-y-auto">
              {notifications.map((n) => {
                const Icon = KIND_ICON[n.kind]
                return (
                  <li key={n.id}>
                    <button
                      className={cn('flex w-full gap-2.5 px-3 py-2.5 text-left hover:bg-accent', !n.read && 'bg-primary/5')}
                      onClick={() => n.link && navigate(n.link)}
                    >
                      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', n.kind === 'ai' ? 'text-ai' : n.kind === 'machine' ? 'text-red-500' : 'text-muted-foreground')} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[13px] font-medium">
                          {n.title}
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{n.body}</div>
                        <div className="num mt-0.5 text-2xs text-muted-foreground">{formatDateTime(n.at)}</div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </PopoverContent>
        </Popover>
        <Tooltip content={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" aria-label="User menu">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{user.initials}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <div className="text-[13px] font-semibold text-foreground">{user.name}</div>
              <div className="font-normal">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>View as role (demo)</DropdownMenuLabel>
            {(['Owner', 'Estimator', 'Planner', 'Operator', 'Quality', 'Viewer'] as Role[]).map((r) => (
              <DropdownMenuItem key={r} onSelect={() => setRole(r)}>
                <User />
                {r}
                {r === role && <span className="ml-auto text-2xs text-primary">Current</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem disabled>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
