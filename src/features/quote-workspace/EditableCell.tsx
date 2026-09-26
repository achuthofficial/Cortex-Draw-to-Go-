import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Click-to-edit cell. Enter commits, Escape cancels. */
export function EditableCell({ value, onCommit, numeric, className, ariaLabel, display }: {
  value: string | number
  onCommit: (v: string) => void
  numeric?: boolean
  className?: string
  ariaLabel: string
  display?: React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing) {
      setDraft(String(value))
      setTimeout(() => ref.current?.select(), 0)
    }
  }, [editing, value])
  const commit = () => {
    setEditing(false)
    if (draft.trim() !== String(value)) onCommit(draft.trim())
  }
  if (editing)
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        inputMode={numeric ? 'decimal' : undefined}
        aria-label={ariaLabel}
        className={cn('h-6 w-full rounded border border-primary bg-background px-1.5 text-[13px] outline-none ring-2 ring-primary/20', numeric && 'num text-right', className)}
      />
    )
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      className={cn('h-6 w-full truncate rounded px-1.5 text-left hover:bg-accent hover:ring-1 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring', numeric && 'num text-right', className)}
      aria-label={`${ariaLabel}: ${value}. Click to edit`}
    >
      {display ?? value}
    </button>
  )
}

export function parseNum(v: string): number | null {
  const n = parseFloat(v.replace(/[−–]/g, '-').replace(/[^0-9.+-]/g, ''))
  return Number.isFinite(n) ? n : null
}
