import type { GdtSymbol } from '@/data/types'

export const GDT_LABEL: Record<GdtSymbol, string> = {
  straightness: 'Straightness',
  flatness: 'Flatness',
  circularity: 'Circularity',
  cylindricity: 'Cylindricity',
  lineProfile: 'Profile of a line',
  surfaceProfile: 'Profile of a surface',
  angularity: 'Angularity',
  perpendicularity: 'Perpendicularity',
  parallelism: 'Parallelism',
  position: 'Position',
  concentricity: 'Concentricity',
  symmetry: 'Symmetry',
  circularRunout: 'Circular runout',
  totalRunout: 'Total runout',
}

/**
 * GD&T characteristic symbol drawn in a 10×10 unit box, as SVG primitives.
 * Rendered inside <svg> (tables) or a <g> (drawing) via the transform.
 */
export function GdtGlyphPaths({ symbol, x = 0, y = 0, size = 10, stroke = 'currentColor', width = 1 }: {
  symbol: GdtSymbol
  x?: number
  y?: number
  size?: number
  stroke?: string
  width?: number
}) {
  const s = size / 10
  const common = { fill: 'none', stroke, strokeWidth: width / s, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let body: React.ReactNode
  switch (symbol) {
    case 'straightness':
      body = <path d="M1 5 H9" {...common} />
      break
    case 'flatness':
      body = <path d="M1 7.5 L6.5 7.5 L9 2.5 L3.5 2.5 Z" {...common} />
      break
    case 'circularity':
      body = <circle cx={5} cy={5} r={3.6} {...common} />
      break
    case 'cylindricity':
      body = (
        <>
          <circle cx={5} cy={5} r={3} {...common} />
          <path d="M1 9 L4.2 1 M5.8 9 L9 1" {...common} />
        </>
      )
      break
    case 'lineProfile':
      body = <path d="M1 7 A4 4 0 0 1 9 7" {...common} />
      break
    case 'surfaceProfile':
      body = <path d="M1 7 A4 4 0 0 1 9 7 Z" {...common} />
      break
    case 'angularity':
      body = <path d="M1 8.5 H9 M1 8.5 L8 2" {...common} />
      break
    case 'perpendicularity':
      body = <path d="M1 8.5 H9 M5 8.5 V1.2" {...common} />
      break
    case 'parallelism':
      body = <path d="M1.5 8.5 L4.5 1.5 M5.5 8.5 L8.5 1.5" {...common} />
      break
    case 'position':
      body = (
        <>
          <circle cx={5} cy={5} r={3} {...common} />
          <path d="M5 0.6 V9.4 M0.6 5 H9.4" {...common} />
        </>
      )
      break
    case 'concentricity':
      body = (
        <>
          <circle cx={5} cy={5} r={1.8} {...common} />
          <circle cx={5} cy={5} r={4} {...common} />
        </>
      )
      break
    case 'symmetry':
      body = <path d="M3 2.5 H7 M1 5 H9 M3 7.5 H7" {...common} />
      break
    case 'circularRunout':
      body = (
        <>
          <path d="M2.2 8.8 L7.2 2.8" {...common} />
          <path d="M7.8 2 L4.9 3.3 L6.9 4.9 Z" fill={stroke} stroke="none" />
        </>
      )
      break
    case 'totalRunout':
      body = (
        <>
          <path d="M0.8 8.8 L4.2 3.6 M4.8 8.8 L8.2 3.6 M0.8 8.8 H4.8" {...common} />
          <path d="M4.8 2.6 L2.4 3.8 L4.1 5.1 Z M8.8 2.6 L6.4 3.8 L8.1 5.1 Z" fill={stroke} stroke="none" />
        </>
      )
      break
  }
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{body}</g>
}

export function GdtIcon({ symbol, className, size = 14 }: { symbol: GdtSymbol; className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className={className} role="img" aria-label={GDT_LABEL[symbol]}>
      <GdtGlyphPaths symbol={symbol} size={10} width={1} />
    </svg>
  )
}
