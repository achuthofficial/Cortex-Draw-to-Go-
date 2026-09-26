import type { GdtCallout } from '@/data/types'
import { fcfCells } from '@/lib/drawing'
import { cn } from '@/lib/utils'
import { GDT_LABEL, GdtGlyphPaths } from './GdtGlyph'

/** A bordered feature control frame rendered as inline SVG for tables and cards. */
export function FeatureControlFrame({ callout, className, scale = 1.25 }: { callout: Pick<GdtCallout, 'symbol' | 'tolerance' | 'diameterZone' | 'modifier' | 'datums'>; className?: string; scale?: number }) {
  const { cells, width } = fcfCells(callout as GdtCallout)
  const h = 15
  return (
    <svg
      width={width * scale}
      height={h * scale}
      viewBox={`-0.5 -0.5 ${width + 1} ${h + 1}`}
      className={cn('shrink-0 text-foreground', className)}
      role="img"
      aria-label={`${GDT_LABEL[callout.symbol]} ${callout.tolerance}${callout.datums.length ? ` relative to ${callout.datums.join(', ')}` : ''}`}
    >
      <FcfCells cells={cells} height={h} stroke="currentColor" symbol={callout.symbol} />
    </svg>
  )
}

export function FcfCells({ cells, height, stroke, symbol, x = 0, y = 0, fill }: {
  cells: ReturnType<typeof fcfCells>['cells']
  height: number
  stroke: string
  symbol: GdtCallout['symbol']
  x?: number
  y?: number
  fill?: string
}) {
  const total = cells.reduce((a, c) => a + c.w, 0)
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={total} height={height} fill={fill ?? 'none'} stroke={stroke} strokeWidth={0.8} />
      {cells.map((c, i) => (
        <g key={i}>
          {i > 0 && <line x1={c.x} y1={0} x2={c.x} y2={height} stroke={stroke} strokeWidth={0.8} />}
          {c.kind === 'symbol' ? (
            <GdtGlyphPaths symbol={symbol} x={c.x + 3.5} y={2.5} size={10} stroke={stroke} width={0.9} />
          ) : (
            <text x={c.x + c.w / 2} y={height / 2 + 3.3} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono, monospace" fill={stroke}>
              {c.text}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}
