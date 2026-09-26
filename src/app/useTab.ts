import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUi, type TabKind } from '@/store/ui'

/** Registers the current detail screen as a workspace tab. */
export function useWorkspaceTab(kind: TabKind, id: string | undefined, title: string, subtitle?: string) {
  const openTab = useUi((s) => s.openTab)
  const { pathname } = useLocation()
  useEffect(() => {
    if (!id) return
    openTab({ id: `${kind}:${id}`, kind, title, subtitle, path: pathname })
  }, [kind, id, title, subtitle, pathname, openTab])
}
