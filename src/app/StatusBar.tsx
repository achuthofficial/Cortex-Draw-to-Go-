import { useEffect, useState } from 'react'
import { CheckCircle2, Keyboard, Loader2, Sparkles, UserRound } from 'lucide-react'
import { APP_VERSION, platform } from '@/lib/platform'
import { formatInt } from '@/lib/format'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

export function StatusBar() {
  const lastSavedAt = useData((s) => s.lastSavedAt)
  const aiQueries = useData((s) => s.aiQueries)
  const role = useUi((s) => s.role)
  const setShortcuts = useUi((s) => s.setShortcuts)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSaving(true)
    const t = setTimeout(() => setSaving(false), 500)
    return () => clearTimeout(t)
  }, [lastSavedAt])

  const quota = 2000
  return (
    <footer className="flex h-6 shrink-0 items-center gap-4 border-t bg-muted/50 px-3 text-2xs text-muted-foreground" role="status">
      <span className="inline-flex items-center gap-1" aria-live="polite">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
        {saving ? 'Saving…' : 'All changes saved'}
      </span>
      <span className="inline-flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-ai" />
        AI usage: <span className="num">{formatInt(aiQueries)}</span> / <span className="num">{formatInt(quota)}</span> extractions this month
        <span className="ml-1 inline-block h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <span className="block h-full bg-ai" style={{ width: `${Math.min(100, (aiQueries / quota) * 100)}%` }} />
        </span>
      </span>
      <span className="inline-flex items-center gap-1">
        <UserRound className="h-3 w-3" /> Role: <span className="font-medium text-foreground">{role}</span>
      </span>
      <button className="ml-auto inline-flex items-center gap-1 hover:text-foreground" onClick={() => setShortcuts(true)}>
        <Keyboard className="h-3 w-3" /> Press <kbd className="font-mono">?</kbd> for shortcuts
      </button>
      <span className="num">
        DrawToShip {APP_VERSION} · {platform.name}
      </span>
    </footer>
  )
}
