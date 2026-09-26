import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUi } from '@/store/ui'
import { SHORTCUTS } from './nav'

export function ShortcutsOverlay() {
  const open = useUi((s) => s.shortcutsOpen)
  const setOpen = useUi((s) => s.setShortcuts)
  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Everything in DrawToShip can be driven from the keyboard.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {groups.map((g) => (
            <div key={g}>
              <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</div>
              <ul className="space-y-1">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3 text-[13px]">
                    <span>{s.label}</span>
                    <span className="flex gap-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="min-w-6 rounded border bg-muted px-1.5 py-0.5 text-center font-mono text-2xs">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
