import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CircleDot, Eye, EyeOff, Layers, Maximize, Minus, Plus, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Tooltip } from '@/components/ui/tooltip'
import type { DrawingSpec } from '@/data/types'
import { clamp, cn } from '@/lib/utils'
import { DrawingSheet, INK, PAPER, type DrawingLayers } from './DrawingSheet'
import { computeOverlays, OVERLAY_COLOR, OVERLAY_NAME, type ExtractionItems, type OverlayItem, type OverlayKind } from './drawing-overlays'

export interface DrawingViewerProps {
  spec: DrawingSpec
  items?: ExtractionItems
  selectedId?: string | null
  hoveredId?: string | null
  onSelect?: (id: string, kind: OverlayKind) => void
  onHover?: (id: string | null) => void
  balloons?: boolean
  onBalloonsChange?: (v: boolean) => void
  overlaysDefault?: boolean
  showThumbnails?: boolean
  className?: string
  toolbarExtra?: React.ReactNode
  /** Only show balloons for these ids (inspection plans). */
  balloonFilter?: (o: OverlayItem) => boolean
}

const LAYER_LABELS: [keyof DrawingLayers, string][] = [
  ['dimensions', 'Dimensions'],
  ['gdt', 'GD&T'],
  ['datums', 'Datums'],
  ['notes', 'Notes'],
  ['titleBlock', 'Title block'],
]

const KIND_LAYER: Record<OverlayKind, keyof DrawingLayers> = { dimension: 'dimensions', gdt: 'gdt', datum: 'datums', note: 'notes', title: 'titleBlock' }

export function DrawingViewer({
  spec,
  items,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  balloons: balloonsProp,
  onBalloonsChange,
  overlaysDefault = true,
  showThumbnails = true,
  className,
  toolbarExtra,
  balloonFilter,
}: DrawingViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [layers, setLayers] = useState<DrawingLayers>({ dimensions: true, gdt: true, datums: true, notes: true, titleBlock: true })
  const [overlays, setOverlays] = useState(overlaysDefault)
  const [balloonsLocal, setBalloonsLocal] = useState(false)
  const balloons = balloonsProp ?? balloonsLocal
  const setBalloons = onBalloonsChange ?? setBalloonsLocal
  const [page, setPage] = useState(1)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)
  const didFit = useRef(false)

  const overlayItems = useMemo(() => (items ? computeOverlays(spec, items) : []), [spec, items])

  const fit = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (!width || !height) return
    const scale = Math.min(width / spec.sheet.w, height / spec.sheet.h) * 0.97
    setView({ scale, tx: (width - spec.sheet.w * scale) / 2, ty: (height - spec.sheet.h * scale) / 2 })
  }, [spec.sheet.w, spec.sheet.h])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (!didFit.current) {
        fit()
        const r = el.getBoundingClientRect()
        if (r.width > 0) didFit.current = true
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = cx ?? rect.width / 2
    const py = cy ?? rect.height / 2
    setView((v) => {
      const scale = clamp(v.scale * factor, 0.2, 8)
      const k = scale / v.scale
      return { scale, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k }
    })
  }, [])

  // Wheel zoom (native listener so we can preventDefault).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
        zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // Pan the selected overlay into view when selection comes from elsewhere (e.g. the table).
  useEffect(() => {
    if (!selectedId) return
    const o = overlayItems.find((x) => x.id === selectedId)
    const el = containerRef.current
    if (!o || !el) return
    const { width, height } = el.getBoundingClientRect()
    setView((v) => {
      const x0 = o.bbox.x * v.scale + v.tx
      const y0 = o.bbox.y * v.scale + v.ty
      const x1 = x0 + o.bbox.w * v.scale
      const y1 = y0 + o.bbox.h * v.scale
      const margin = 40
      if (x0 >= margin && y0 >= margin && x1 <= width - margin && y1 <= height - margin) return v
      const cx = (o.bbox.x + o.bbox.w / 2) * v.scale
      const cy = (o.bbox.y + o.bbox.h / 2) * v.scale
      return { ...v, tx: width / 2 - cx, ty: height / 2 - cy }
    })
  }, [selectedId, overlayItems])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) > 3) {
      d.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (d.moved) setView((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }))
  }
  const onPointerUp = () => {
    setTimeout(() => (drag.current = null), 0)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') zoomAt(1.2)
    else if (e.key === '-') zoomAt(1 / 1.2)
    else if (e.key === '0') fit()
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault()
      const step = 40
      setView((v) => ({ ...v, tx: v.tx + (e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0), ty: v.ty + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0) }))
    }
  }

  const visibleOverlays = overlayItems.filter((o) => layers[KIND_LAYER[o.kind]])

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-muted/40', className)}>
      <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b bg-background px-2 scrollbar-none">
        <Tooltip content="Zoom out (−)">
          <Button variant="ghost" size="icon-sm" onClick={() => zoomAt(1 / 1.25)} aria-label="Zoom out">
            <Minus />
          </Button>
        </Tooltip>
        <span className="num w-12 text-center text-xs text-muted-foreground" aria-live="polite">
          {Math.round(view.scale * 100)}%
        </span>
        <Tooltip content="Zoom in (+)">
          <Button variant="ghost" size="icon-sm" onClick={() => zoomAt(1.25)} aria-label="Zoom in">
            <Plus />
          </Button>
        </Tooltip>
        <Tooltip content="Fit to screen (0)">
          <Button variant="ghost" size="icon-sm" onClick={fit} aria-label="Fit to screen">
            <Maximize />
          </Button>
        </Tooltip>
        <div className="mx-1 h-5 w-px bg-border" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Layers">
              <Layers /> Layers
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 space-y-2.5">
            <div className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Drawing layers</div>
            {LAYER_LABELS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`layer-${key}`} className="text-[13px] font-normal text-foreground">
                  {label}
                </Label>
                <Switch id={`layer-${key}`} checked={layers[key]} onCheckedChange={(v) => setLayers((l) => ({ ...l, [key]: v }))} />
              </div>
            ))}
          </PopoverContent>
        </Popover>
        {items && (
          <Tooltip content="Show AI extraction boxes">
            <Button variant={overlays ? 'ai-outline' : 'ghost'} size="sm" onClick={() => setOverlays((v) => !v)} aria-pressed={overlays}>
              {overlays ? <Eye /> : <EyeOff />} Overlays
            </Button>
          </Tooltip>
        )}
        {items && (
          <Tooltip content="Number each characteristic (used by Quality)">
            <Button variant={balloons ? 'secondary' : 'ghost'} size="sm" onClick={() => setBalloons(!balloons)} aria-pressed={balloons}>
              <CircleDot /> Balloons
            </Button>
          </Tooltip>
        )}
        <div className="ml-auto flex items-center gap-1">{toolbarExtra}</div>
      </div>
      <div className="flex min-h-0 flex-1">
        {showThumbnails && spec.pages > 1 && (
          <div className="flex w-[76px] shrink-0 flex-col gap-2 overflow-y-auto border-r bg-background p-2" role="tablist" aria-label="Pages">
            {Array.from({ length: spec.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={page === p}
                onClick={() => setPage(p)}
                className={cn('rounded border bg-drawing-bg p-1 text-left transition-colors', page === p ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/40')}
              >
                <div className="aspect-[10/7] overflow-hidden">
                  {p === 1 ? <DrawingSheet spec={spec} layers={layers} className="h-full w-full" /> : <SecondSheet spec={spec} className="h-full w-full" />}
                </div>
                <div className="mt-1 text-center text-2xs text-muted-foreground">Sheet {p}</div>
              </button>
            ))}
          </div>
        )}
        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 cursor-grab overflow-hidden outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => onHover?.(null)}
          onDoubleClick={fit}
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label="Drawing canvas. Use plus and minus to zoom, arrow keys to pan, 0 to fit."
          role="application"
        >
          <div className="absolute left-0 top-0 origin-top-left shadow-lg" style={{ width: spec.sheet.w, height: spec.sheet.h, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` }}>
            {page === 1 ? (
              <DrawingSheet spec={spec} layers={layers} className="h-full w-full">
                {overlays &&
                  visibleOverlays.map((o) => {
                    const active = o.id === selectedId
                    const hover = o.id === hoveredId
                    const color = OVERLAY_COLOR[o.kind]
                    return (
                      <rect
                        key={o.id}
                        x={o.bbox.x}
                        y={o.bbox.y}
                        width={o.bbox.w}
                        height={o.bbox.h}
                        rx={1.5}
                        fill={color}
                        fillOpacity={active ? 0.22 : hover ? 0.16 : 0.07}
                        stroke={color}
                        strokeWidth={active ? 1.8 : hover ? 1.3 : 0.8}
                        strokeDasharray={o.confidence < 70 ? '3 2' : undefined}
                        className={cn('cursor-pointer transition-[fill-opacity]', active && 'animate-pulse')}
                        onPointerEnter={() => onHover?.(o.id)}
                        onPointerLeave={() => onHover?.(null)}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (drag.current?.moved) return
                          onSelect?.(o.id, o.kind)
                        }}
                        role="button"
                        aria-label={`${OVERLAY_NAME[o.kind]} ${o.label}, confidence ${o.confidence}%`}
                      />
                    )
                  })}
                {balloons &&
                  visibleOverlays
                    .filter((o) => o.balloon !== undefined && (!balloonFilter || balloonFilter(o)))
                    .map((o) => {
                      const cx = o.bbox.x + o.bbox.w + 5
                      const cy = o.bbox.y - 4
                      const active = o.id === selectedId || o.id === hoveredId
                      return (
                        <g key={`b-${o.id}`} className="cursor-pointer" onClick={() => onSelect?.(o.id, o.kind)} onPointerEnter={() => onHover?.(o.id)} onPointerLeave={() => onHover?.(null)}>
                          <circle cx={cx} cy={cy} r={6.5} fill={active ? '#dc2626' : PAPER} stroke="#dc2626" strokeWidth={1} />
                          <text x={cx} y={cy + 2.6} textAnchor="middle" fontSize={7} fontWeight={700} fill={active ? '#fff' : '#dc2626'} fontFamily="JetBrains Mono, monospace">
                            {o.balloon}
                          </text>
                        </g>
                      )
                    })}
              </DrawingSheet>
            ) : (
              <SecondSheet spec={spec} className="h-full w-full" />
            )}
          </div>
          {overlays && items && page === 1 && (
            <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap items-center gap-2.5 rounded-md border bg-background/90 px-2.5 py-1.5 text-2xs shadow-sm backdrop-blur">
              <ScanSearch className="h-3.5 w-3.5 text-ai" />
              {(Object.keys(OVERLAY_COLOR) as OverlayKind[]).map((k) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: `${OVERLAY_COLOR[k]}33`, borderColor: OVERLAY_COLOR[k] }} />
                  {OVERLAY_NAME[k]}
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-3.5 rounded-sm border border-dashed border-muted-foreground" />
                Low confidence
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Mock second sheet: revision table and general notes. */
function SecondSheet({ spec, className }: { spec: DrawingSpec; className?: string }) {
  const rows = [
    ['C', 'Ø30 h7 → h6, cylindricity 0.005 added; Ø6 × 54 deep hole added', 'VJ', '11-Aug-2026'],
    ['B', 'Flange holes Ø6.4 → Ø6.6; M8 tapped hole added', 'VJ', '17-Mar-2026'],
    ['A', 'Initial release', 'VJ', '30-Jul-2025'],
  ]
  return (
    <svg viewBox={`0 0 ${spec.sheet.w} ${spec.sheet.h}`} className={className} role="img" aria-label="Sheet 2: revision history">
      <rect width={spec.sheet.w} height={spec.sheet.h} fill={PAPER} />
      <rect x={10} y={10} width={spec.sheet.w - 20} height={spec.sheet.h - 20} fill="none" stroke={INK} strokeWidth={1.6} />
      <text x={40} y={60} fontSize={14} fontWeight={700} fill={INK} fontFamily="Inter, sans-serif">
        SHEET 2 · REVISION HISTORY AND INSPECTION REQUIREMENTS
      </text>
      {['REV', 'DESCRIPTION', 'BY', 'DATE'].map((h, i) => (
        <text key={h} x={[40, 100, 760, 840][i]} y={100} fontSize={10} fontWeight={700} fill={INK} fontFamily="Inter, sans-serif">
          {h}
        </text>
      ))}
      <line x1={36} y1={108} x2={960} y2={108} stroke={INK} />
      {rows.map((r, i) =>
        r.map((c, j) => (
          <text key={`${i}-${j}`} x={[40, 100, 760, 840][j]} y={130 + i * 24} fontSize={10} fill={INK} fontFamily="JetBrains Mono, monospace">
            {c}
          </text>
        )),
      )}
      <text x={40} y={250} fontSize={11} fontWeight={700} fill={INK} fontFamily="Inter, sans-serif">
        INSPECTION REQUIREMENTS
      </text>
      {['First article inspection to AS9102 required on first production lot.', 'CMM report required for all GD&T callouts.', 'Material certificates EN 10204 3.1 to accompany each lot.', 'Hardness test report after heat treatment, 3 samples per lot.'].map(
        (t, i) => (
          <text key={t} x={40} y={275 + i * 20} fontSize={10} fill={INK} fontFamily="JetBrains Mono, monospace">
            {`${i + 1}. ${t}`}
          </text>
        ),
      )}
    </svg>
  )
}
