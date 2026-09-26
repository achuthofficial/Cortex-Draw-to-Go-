import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CopilotDrawer } from '@/features/copilot/CopilotDrawer'
import { NewRfqDialog } from '@/features/rfq/NewRfqDialog'
import { useUi } from '@/store/ui'
import { CommandPalette } from './CommandPalette'
import { ShortcutsOverlay } from './ShortcutsOverlay'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopBar } from './TopBar'
import { WorkspaceTabs } from './WorkspaceTabs'

export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.getAttribute('role') === 'combobox'
}

function useGlobalShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (mod && k === 'k') {
        e.preventDefault()
        ui.setPalette(!ui.paletteOpen)
      } else if (mod && k === 'n') {
        e.preventDefault()
        ui.setNewRfq(true)
      } else if (mod && k === 'j') {
        e.preventDefault()
        ui.setCopilot(!ui.copilotOpen)
      } else if (mod && k === 'b') {
        e.preventDefault()
        ui.toggleSidebar()
      } else if (e.key === '?' && !isTyping(e)) {
        e.preventDefault()
        ui.setShortcuts(true)
      } else if (e.altKey && (k === 'w' || k === '[' || k === ']')) {
        e.preventDefault()
        const idx = ui.tabs.findIndex((t) => t.path === location.pathname)
        if (k === 'w' && idx >= 0) {
          const next = ui.closeTab(ui.tabs[idx].id)
          navigate(next ? next.path : '/')
        } else if (ui.tabs.length) {
          const n = ui.tabs.length
          const target = ui.tabs[(Math.max(0, idx) + (k === ']' ? 1 : n - 1)) % n]
          navigate(target.path)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, location.pathname])
}

export function Shell() {
  useGlobalShortcuts()
  return (
    <div className="flex h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground">
        Skip to content
      </a>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <WorkspaceTabs />
          <main id="main" className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
        <CopilotDrawer />
      </div>
      <StatusBar />
      <CommandPalette />
      <ShortcutsOverlay />
      <NewRfqDialog />
    </div>
  )
}
