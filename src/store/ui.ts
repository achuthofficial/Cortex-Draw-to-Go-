import { create } from 'zustand'
import { moveItem } from '@/lib/utils'

export type TabKind = 'quote' | 'part' | 'wo' | 'so' | 'ncr' | 'customer' | 'supplier' | 'po' | 'eco' | 'plan' | 'capa'

export interface WorkspaceTab {
  id: string
  title: string
  subtitle?: string
  path: string
  kind: TabKind
}

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

interface UiState {
  theme: Theme
  sidebarCollapsed: boolean
  copilotOpen: boolean
  paletteOpen: boolean
  shortcutsOpen: boolean
  newRfqOpen: boolean
  tabs: WorkspaceTab[]
  copilotSeed: string | null
  simulateErrors: boolean
  role: import('@/data/types').Role
  setRole: (r: import('@/data/types').Role) => void
  setSimulateErrors: (v: boolean) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setCopilot: (open: boolean, seed?: string | null) => void
  setPalette: (open: boolean) => void
  setShortcuts: (open: boolean) => void
  setNewRfq: (open: boolean) => void
  openTab: (tab: WorkspaceTab) => void
  closeTab: (id: string) => WorkspaceTab | undefined
  moveTab: (from: number, to: number) => void
  closeOtherTabs: (id: string) => void
}

export const useUi = create<UiState>()((set, get) => ({
  theme: initialTheme(),
  sidebarCollapsed: false,
  copilotOpen: false,
  paletteOpen: false,
  shortcutsOpen: false,
  newRfqOpen: false,
  tabs: [
    { id: 'quote:RFQ-2026-0147', title: 'Q-2026-0147', subtitle: 'KA-7731-SH', path: '/quotes/RFQ-2026-0147', kind: 'quote' },
    { id: 'wo:WO-26-0407', title: 'WO-26-0407', subtitle: 'OEV-MB-210', path: '/production/wo/WO-26-0407', kind: 'wo' },
  ],
  copilotSeed: null,
  simulateErrors: false,
  role: 'Estimator',
  setRole: (role) => set({ role }),
  setSimulateErrors: (v) => set({ simulateErrors: v }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCopilot: (open, seed = null) => set({ copilotOpen: open, copilotSeed: seed }),
  setPalette: (open) => set({ paletteOpen: open }),
  setShortcuts: (open) => set({ shortcutsOpen: open }),
  setNewRfq: (open) => set({ newRfqOpen: open }),
  openTab: (tab) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === tab.id)
      if (idx >= 0) {
        const tabs = s.tabs.slice()
        tabs[idx] = { ...tabs[idx], ...tab }
        return { tabs }
      }
      return { tabs: [...s.tabs, tab].slice(-12) }
    }),
  closeTab: (id) => {
    const tabs = get().tabs
    const idx = tabs.findIndex((t) => t.id === id)
    const next = tabs.filter((t) => t.id !== id)
    set({ tabs: next })
    return next[Math.min(idx, next.length - 1)]
  },
  moveTab: (from, to) => set((s) => ({ tabs: moveItem(s.tabs, from, to) })),
  closeOtherTabs: (id) => set((s) => ({ tabs: s.tabs.filter((t) => t.id === id) })),
}))
