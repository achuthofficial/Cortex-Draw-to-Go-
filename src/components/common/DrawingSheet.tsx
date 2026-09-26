import { memo, useId } from 'react'
import type { DrawingSpec, LineStyle, Primitive, TitleBlock } from '@/data/types'
import { datumLayout, dimensionLayout, fcfLayout, NOTES_BLOCK, TITLE_BLOCK, toSheet, viewMap, type Pt } from '@/lib/drawing'
import { FcfCells } from './FeatureControlFrame'

export interface DrawingLayers {
  dimensions: boolean
  gdt: boolean
  datums: boolean
  notes: boolean
  titleBlock: boolean
}

export const INK = 'hsl(var(--drawing-ink))'
export const DIM = 'hsl(var(--drawing-dim))'
export const PAPER = 'hsl(var(--drawing-bg))'

const STROKES: Record<LineStyle, { w: number; dash?: string; color?: string }> = {
  outline: { w: 1.3 },
  thin: { w: 0.6 },
  hidden: { w: 0.8, dash: '4 2.5' },
  center: { w: 0.5, dash: '12 3 2 3' },
  phantom: { w: 1.1, dash: '14 3 3 3 3 3' },
}

function Arrow({ at, dir, color }: { at: Pt; dir: Pt; color: string }) {
  // Arrowhead pointing along dir, tip at `at`.
  const len = 6
  const half = 1.8
  const bx = at.x - dir.x * len
  const by = at.y - dir.y * len
  const nx = -dir.y
  const ny = dir.x
  return <path d={`M${at.x} ${at.y} L${bx + nx * half} ${by + ny * half} L${bx - nx * half} ${by - ny * half} Z`} fill={color} />
}

function PrimitiveShape({ p, views, hatchId }: { p: Primitive; views: ReturnType<typeof viewMap>; hatchId: string }) {
  const v = views[p.view]
  const style = 'style' in p && p.style ? STROKES[p.style] : STROKES.outline
  const stroke = { stroke: INK, strokeWidth: style.w, strokeDasharray: style.dash, fill: 'none', strokeLinejoin: 'round' as const }
  switch (p.t) {
    case 'poly': {
      const d = p.pts.map(([x, y], i) => {
        const s = toSheet(v, x, y)
        return `${i ? 'L' : 'M'}${s.x.toFixed(2)} ${s.y.toFixed(2)}`
      })
      return <path d={`${d.join(' ')}${p.closed ? ' Z' : ''}`} {...stroke} />
    }
    case 'line': {
      const a = toSheet(v, ...p.a)
      const b = toSheet(v, ...p.b)
      return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} {...stroke} />
    }
    case 'circle': {
      const c = toSheet(v, p.cx, p.cy)
      return <circle cx={c.x} cy={c.y} r={p.r * v.scale} {...stroke} />
    }
    case 'arc': {
      const c = toSheet(v, p.cx, p.cy)
      const r = p.r * v.scale
      const a0 = (p.a0 * Math.PI) / 180
      const a1 = (p.a1 * Math.PI) / 180
      const s = { x: c.x + r * Math.cos(a0), y: c.y - r * Math.sin(a0) }
      const e = { x: c.x + r * Math.cos(a1), y: c.y - r * Math.sin(a1) }
      const large = p.a1 - p.a0 > 180 ? 1 : 0
      return <path d={`M${s.x} ${s.y} A${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`} {...stroke} />
    }
    case 'hatch': {
      const d = p.pts.map(([x, y], i) => {
        const s = toSheet(v, x, y)
        return `${i ? 'L' : 'M'}${s.x.toFixed(2)} ${s.y.toFixed(2)}`
      })
      return <path d={`${d.join(' ')} Z`} fill={`url(#${hatchId})`} stroke="none" />
    }
    case 'label': {
      const s = toSheet(v, p.x, p.y)
      return (
        <text x={s.x} y={s.y + 4} textAnchor={p.anchor ?? 'middle'} fontSize={p.size ?? 9} fontWeight={600} fontFamily="JetBrains Mono, monospace" fill={INK}>
          {p.text}
        </text>
      )
    }
  }
}

function TitleBlockSvg({ tb, pages }: { tb: TitleBlock; pages: number }) {
  const { x, y, w, h } = TITLE_BLOCK
  const row = h / 5
  const col = [x, x + 130, x + 250, x + w]
  const cell = (cx: number, cy: number, label: string, value: string, bold = false) => (
    <g>
      <text x={cx + 4} y={cy + 8} fontSize={6} fill={INK} opacity={0.65} fontFamily="Inter, sans-serif" letterSpacing={0.4}>
        {label.toUpperCase()}
      </text>
      <text x={cx + 4} y={cy + 19} fontSize={bold ? 10 : value.length > 22 ? 6.2 : value.length > 18 ? 7.6 : 8.5} fontWeight={bold ? 700 : 500} fill={INK} fontFamily="JetBrains Mono, monospace">
        {value}
      </text>
    </g>
  )
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={1.3} />
      {[1, 2, 3, 4].map((i) => (
        <line key={i} x1={x} y1={y + row * i} x2={x + w} y2={y + row * i} stroke={INK} strokeWidth={0.6} />
      ))}
      <line x1={col[1]} y1={y} x2={col[1]} y2={y + row * 4} stroke={INK} strokeWidth={0.6} />
      <line x1={col[2]} y1={y} x2={col[2]} y2={y + row * 4} stroke={INK} strokeWidth={0.6} />
      {cell(col[0], y, 'Customer', tb.customer)}
      {cell(col[1], y, 'Part no.', tb.partNo, true)}
      {cell(col[2], y, 'Rev', tb.revision, true)}
      {cell(col[0], y + row, 'Title', tb.description)}
      {cell(col[1], y + row, 'Material', tb.materialSpec.split(',')[0])}
      {cell(col[2], y + row, 'Scale', tb.scale)}
      {cell(col[0], y + row * 2, 'Finish', tb.finish)}
      {cell(col[1], y + row * 2, 'Heat treatment', tb.heatTreatment.replace('Hardened and tempered', 'H&T'))}
      {cell(col[2], y + row * 2, 'Units', 'mm')}
      {cell(col[0], y + row * 3, 'General tol.', tb.generalTolerance)}
      {cell(col[1], y + row * 3, 'Drawn', `${tb.drawnBy} ${tb.date}`)}
      {cell(col[2], y + row * 3, 'Sheet', `1 of ${pages}`)}
      <text x={x + 6} y={y + row * 4 + 16} fontSize={9} fontWeight={700} fill={INK} fontFamily="Inter, sans-serif" letterSpacing={1}>
        {tb.customer.toUpperCase()} · CONFIDENTIAL
      </text>
      <text x={x + w - 6} y={y + row * 4 + 16} fontSize={7} textAnchor="end" fill={INK} opacity={0.7} fontFamily="Inter, sans-serif">
        THIRD ANGLE PROJECTION ⌖
      </text>
    </g>
  )
}

export interface DrawingSheetProps {
  spec: DrawingSpec
  layers: DrawingLayers
  /** Draw the drawing as it appears on paper (always from the original spec). */
  className?: string
  children?: React.ReactNode
  highlightIds?: Set<string>
}

/** The static paper drawing. Overlays and balloons are drawn by the caller as children. */
export const DrawingSheet = memo(function DrawingSheet({ spec, layers, className, children, highlightIds }: DrawingSheetProps) {
  const views = viewMap(spec)
  const uid = useId().replace(/:/g, '')
  const hatchId = `hatch-${uid}`
  const hl = (id: string) => highlightIds?.has(id)
  return (
    <svg viewBox={`0 0 ${spec.sheet.w} ${spec.sheet.h}`} className={className} role="img" aria-label={`Engineering drawing ${spec.titleBlock.partNo} rev ${spec.titleBlock.revision}`}>
      <defs>
        <pattern id={hatchId} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={5} stroke={INK} strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={spec.sheet.w} height={spec.sheet.h} fill={PAPER} />
      <rect x={10} y={10} width={spec.sheet.w - 20} height={spec.sheet.h - 20} fill="none" stroke={INK} strokeWidth={1.6} />
      {/* Zone markers */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}>
          <text x={10 + ((spec.sheet.w - 20) / 6) * (i - 0.5)} y={8} fontSize={6} textAnchor="middle" fill={INK} opacity={0.5}>
            {i}
          </text>
          <line x1={10 + ((spec.sheet.w - 20) / 6) * i} y1={10} x2={10 + ((spec.sheet.w - 20) / 6) * i} y2={15} stroke={INK} strokeWidth={0.5} />
        </g>
      ))}
      {spec.geometry.map((p, i) => (
        <PrimitiveShape key={i} p={p} views={views} hatchId={hatchId} />
      ))}
      {spec.views.map((v) =>
        v.caption ? (
          <text key={v.id} x={v.caption.x} y={v.caption.y} textAnchor="middle" fontSize={9} fontWeight={700} letterSpacing={0.8} fill={INK} fontFamily="Inter, sans-serif">
            {v.label}
          </text>
        ) : null,
      )}

      {layers.dimensions &&
        spec.dimensions.map((d) => {
          const l = dimensionLayout(d, views)
          const color = hl(d.id) ? '#0284c7' : DIM
          return (
            <g key={d.id} data-item={d.id}>
              {l.lines.map(([a, b], i) => (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={0.55} />
              ))}
              {l.arrows.map((a, i) => (
                <Arrow key={i} at={a.at} dir={a.dir} color={color} />
              ))}
              <rect x={l.bbox.x + 1} y={l.bbox.y + 1} width={l.bbox.w - 2} height={l.bbox.h - 2} fill={PAPER} opacity={0.85} />
              <text
                x={l.text.x}
                y={l.text.y}
                transform={l.text.rotate ? `rotate(${l.text.rotate} ${l.text.x} ${l.text.y})` : undefined}
                textAnchor={l.text.anchor}
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                fill={color}
                dominantBaseline={l.text.rotate ? 'auto' : undefined}
              >
                {l.text.label}
              </text>
            </g>
          )
        })}

      {layers.gdt &&
        spec.gdt.map((g) => {
          const l = fcfLayout(g, views)
          const [a, b] = l.leader
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.hypot(dx, dy) || 1
          return (
            <g key={g.id} data-item={g.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={0.55} />
              <Arrow at={b} dir={{ x: dx / len, y: dy / len }} color={INK} />
              <FcfCells cells={l.cells} height={l.h} stroke={INK} symbol={g.symbol} x={l.x} y={l.y} fill={PAPER} />
            </g>
          )
        })}

      {layers.datums &&
        spec.datums.map((d) => {
          const l = datumLayout(d, views)
          return (
            <g key={d.id} data-item={d.id}>
              <path d={`M${l.tri.map((p) => `${p.x} ${p.y}`).join(' L')} Z`} fill={INK} />
              <line x1={l.line[0].x} y1={l.line[0].y} x2={l.line[1].x} y2={l.line[1].y} stroke={INK} strokeWidth={0.7} />
              <rect x={l.box.x} y={l.box.y} width={l.box.w} height={l.box.h} fill={PAPER} stroke={INK} strokeWidth={0.9} />
              <text x={l.box.x + l.box.w / 2} y={l.box.y + 11} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK} fontFamily="JetBrains Mono, monospace">
                {l.letter}
              </text>
            </g>
          )
        })}

      {layers.notes && (
        <g>
          <text x={NOTES_BLOCK.x + 6} y={NOTES_BLOCK.y + 4} fontSize={9} fontWeight={700} fill={INK} letterSpacing={0.8} fontFamily="Inter, sans-serif">
            NOTES
          </text>
          {spec.notes.map((n, i) => (
            <text key={n.id} x={NOTES_BLOCK.x + 10} y={NOTES_BLOCK.y + 20 + i * NOTES_BLOCK.lineH} fontSize={8.5} fill={INK} fontFamily="JetBrains Mono, monospace">
              {`${i + 1}. ${n.text}`}
            </text>
          ))}
        </g>
      )}

      {layers.titleBlock && <TitleBlockSvg tb={spec.titleBlock} pages={spec.pages} />}
      {children}
    </svg>
  )
})
