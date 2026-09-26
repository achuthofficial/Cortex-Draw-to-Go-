// Detailed drawing 3: motor mount bracket for Orbitra EV Motors (Al 6061-T6).
import type { DrawingSpec, Primitive } from '../types'
import { makeDatum, makeDim, makeGdt, makeNotes, polar } from './helpers'

const P = 'bracket'
const D = makeDim(P)
const G = makeGdt(P)
const DT = makeDatum(P)

function slot(cx: number, y0: number, y1: number, r: number): [number, number][] {
  const pts: [number, number][] = []
  for (let a = 0; a <= 180; a += 15) pts.push([cx + r * Math.cos((a * Math.PI) / 180), y1 + r * Math.sin((a * Math.PI) / 180)])
  for (let a = 180; a <= 360; a += 15) pts.push([cx + r * Math.cos((a * Math.PI) / 180), y0 + r * Math.sin((a * Math.PI) / 180)])
  return pts
}

function roundedRect(x0: number, y0: number, x1: number, y1: number, r: number): [number, number][] {
  const pts: [number, number][] = []
  const corner = (cx: number, cy: number, a0: number) => {
    for (let a = a0; a <= a0 + 90; a += 30) pts.push([cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)])
  }
  corner(x1 - r, y1 - r, 0)
  corner(x0 + r, y1 - r, 90)
  corner(x0 + r, y0 + r, 180)
  corner(x1 - r, y0 + r, 270)
  return pts
}

const tapped = [45, 135, 225, 315].map((a) => {
  const [dx, dy] = polar(25, a)
  return [60 + dx, 75 + dy] as [number, number]
})
const baseHoles: [number, number][] = [[30, 30], [90, 30], [30, 68], [90, 68]]

const geometry: Primitive[] = [
  // Front view
  { t: 'poly', view: 'F', pts: [[0, 0], [120, 0], [120, 110], [110, 120], [10, 120], [0, 110]], closed: true },
  { t: 'line', view: 'F', a: [0, 12], b: [120, 12] },
  { t: 'line', view: 'F', a: [2, 12], b: [2, 70] },
  { t: 'line', view: 'F', a: [12, 12], b: [12, 70] },
  { t: 'line', view: 'F', a: [2, 70], b: [12, 70] },
  { t: 'line', view: 'F', a: [108, 12], b: [108, 70] },
  { t: 'line', view: 'F', a: [118, 12], b: [118, 70] },
  { t: 'line', view: 'F', a: [108, 70], b: [118, 70] },
  { t: 'circle', view: 'F', cx: 60, cy: 75, r: 16 },
  { t: 'circle', view: 'F', cx: 60, cy: 75, r: 16.5, style: 'thin' },
  { t: 'circle', view: 'F', cx: 60, cy: 75, r: 25, style: 'center' },
  ...tapped.flatMap(([cx, cy]) => [
    { t: 'circle', view: 'F', cx, cy, r: 2.5 } as Primitive,
    { t: 'arc', view: 'F', cx, cy, r: 3, a0: 100, a1: 370, style: 'thin' } as Primitive,
  ]),
  { t: 'poly', view: 'F', pts: slot(25, 46, 64, 6), closed: true },
  { t: 'poly', view: 'F', pts: slot(95, 46, 64, 6), closed: true },
  { t: 'line', view: 'F', a: [60, 44], b: [60, 106], style: 'center' },
  { t: 'line', view: 'F', a: [29, 75], b: [91, 75], style: 'center' },
  { t: 'line', view: 'F', a: [25, 36], b: [25, 74], style: 'center' },
  { t: 'line', view: 'F', a: [95, 36], b: [95, 74], style: 'center' },

  // Side view (from right)
  { t: 'poly', view: 'S', pts: [[0, 0], [80, 0], [80, 11], [79, 12], [60, 12], [14, 70], [14, 120], [0, 120]], closed: true },
  { t: 'line', view: 'S', a: [0, 110], b: [14, 110] },
  { t: 'line', view: 'S', a: [14, 12], b: [60, 12], style: 'thin' },
  { t: 'line', view: 'S', a: [14, 12], b: [14, 70], style: 'thin' },
  { t: 'line', view: 'S', a: [0, 59], b: [14, 59], style: 'hidden' },
  { t: 'line', view: 'S', a: [0, 91], b: [14, 91], style: 'hidden' },
  { t: 'line', view: 'S', a: [0, 40], b: [14, 40], style: 'hidden' },
  { t: 'line', view: 'S', a: [0, 70], b: [14, 70], style: 'hidden' },
  ...baseHoles.slice(0, 2).flatMap(([, z]) => [
    { t: 'line', view: 'S', a: [z - 4.5, 0], b: [z - 4.5, 12], style: 'hidden' } as Primitive,
    { t: 'line', view: 'S', a: [z + 4.5, 0], b: [z + 4.5, 12], style: 'hidden' } as Primitive,
  ]),
  ...[68].flatMap((z) => [
    { t: 'line', view: 'S', a: [z - 4.5, 0], b: [z - 4.5, 12], style: 'hidden' } as Primitive,
    { t: 'line', view: 'S', a: [z + 4.5, 0], b: [z + 4.5, 12], style: 'hidden' } as Primitive,
  ]),
  { t: 'line', view: 'S', a: [-6, 75], b: [20, 75], style: 'center' },

  // Bottom view (underside of base)
  { t: 'poly', view: 'B', pts: [[0, 0], [120, 0], [120, 80], [0, 80]], closed: true },
  { t: 'poly', view: 'B', pts: roundedRect(40, 30, 80, 60, 4), closed: true },
  ...baseHoles.map(([cx, cy]) => ({ t: 'circle', view: 'B', cx, cy, r: 4.5 }) as Primitive),
  ...baseHoles.flatMap(([cx, cy]) => [
    { t: 'line', view: 'B', a: [cx - 8, cy], b: [cx + 8, cy], style: 'center' } as Primitive,
    { t: 'line', view: 'B', a: [cx, cy - 8], b: [cx, cy + 8], style: 'center' } as Primitive,
  ]),
]

const dimensions = [
  D(1, 'Front', 'Overall width', 'linear', '120 ±0.2', 120, 0.2, -0.2, 99, { kind: 'hdim', view: 'F', x1: 0, y1: 0, x2: 120, y2: 0, at: -22 }),
  D(2, 'Front', 'Overall height', 'linear', '120 ±0.2', 120, 0.2, -0.2, 97, { kind: 'vdim', view: 'F', x1: 0, y1: 0, x2: 10, y2: 120, at: -12 }),
  D(3, 'Front', 'Base thickness', 'linear', '12', 12, 0.1, -0.1, 93, { kind: 'vdim', view: 'F', x1: 120, y1: 0, x2: 120, y2: 12, at: 128 }),
  D(4, 'Front', 'Main bore', 'diameter', 'Ø32 H8', 32, 0.039, 0, 96, { kind: 'leader', view: 'F', x: 71.3, y: 86.3, lx: 100, ly: 92 }, 'H8'),
  D(5, 'Front', 'Bore horizontal position', 'linear', '60', 60, 0.05, -0.05, 94, { kind: 'hdim', view: 'F', x1: 0, y1: 110, x2: 60, y2: 91, at: 132 }),
  D(6, 'Front', 'Bore height from base', 'linear', '75 ±0.05', 75, 0.05, -0.05, 95, { kind: 'vdim', view: 'F', x1: 120, y1: 0, x2: 76, y2: 75, at: 138 }),
  D(7, 'Front', 'Tapped hole pitch circle', 'diameter', 'Ø50 PCD', 50, 0.1, -0.1, 90, { kind: 'leader', view: 'F', x: 36.5, y: 66.4, lx: 40, ly: 96 }),
  D(8, 'Front', 'Tapped holes, 4×', 'thread', '4× M6-6H ↧12', 6, 0.15, 0, 92, { kind: 'leader', view: 'F', x: 79.8, y: 94.8, lx: 100, ly: 102 }, '6H'),
  D(9, 'Front', 'Tapped hole angle', 'angle', '45°', 45, 0.5, -0.5, 65, { kind: 'leader', view: 'F', x: 66, y: 81, lx: 82, ly: 64 }),
  D(10, 'Front', 'Slot width', 'linear', '12 H9', 12, 0.043, 0, 88, { kind: 'hdim', view: 'F', x1: 19, y1: 64, x2: 31, y2: 64, at: 76 }, 'H9'),
  D(11, 'Front', 'Slot length', 'linear', '30', 30, 0.2, 0, 86, { kind: 'vdim', view: 'F', x1: 31, y1: 40, x2: 31, y2: 70, at: 38 }),
  D(12, 'Front', 'Slot horizontal position', 'linear', '25', 25, 0.1, -0.1, 83, { kind: 'hdim', view: 'F', x1: 0, y1: 12, x2: 25, y2: 40, at: 30 }),
  D(13, 'Front', 'Slot centre height', 'linear', '55', 55, 0.1, -0.1, 80, { kind: 'vdim', view: 'F', x1: 0, y1: 0, x2: 25, y2: 55, at: -22 }),
  D(14, 'Front', 'Slot end radius', 'radius', '2× R6', 6, 0.02, 0, 77, { kind: 'leader', view: 'F', x: 20.8, y: 68.2, lx: 6, ly: 84 }),
  D(15, 'Front', 'Top corner chamfers', 'chamfer', '2× 10×45°', 10, 0.2, -0.2, 91, { kind: 'leader', view: 'F', x: 115, y: 115, lx: 130, ly: 128 }),
  D(16, 'Front', 'Gusset thickness', 'linear', '10', 10, 0.1, -0.1, 74, { kind: 'hdim', view: 'F', x1: 2, y1: 70, x2: 12, y2: 70, at: 100 }),
  D(17, 'Front', 'Gusset height', 'linear', '70', 70, 0.2, -0.2, 78, { kind: 'vdim', view: 'F', x1: 118, y1: 70, x2: 120, y2: 0, at: 148 }),
  D(18, 'Side', 'Base depth', 'linear', '80 ±0.1', 80, 0.1, -0.1, 96, { kind: 'hdim', view: 'S', x1: 0, y1: 0, x2: 80, y2: 0, at: -12 }),
  D(19, 'Side', 'Leg thickness', 'linear', '14 ±0.05', 14, 0.05, -0.05, 93, { kind: 'hdim', view: 'S', x1: 0, y1: 120, x2: 14, y2: 120, at: 128 }),
  D(20, 'Side', 'Overall height (side view)', 'linear', '121.5', 121.5, 0.2, -0.2, 73, { kind: 'vdim', view: 'S', x1: 0, y1: 0, x2: 0, y2: 120, at: -10 }),
  D(21, 'Side', 'Gusset length', 'linear', '46', 46, 0.2, -0.2, 85, { kind: 'hdim', view: 'S', x1: 14, y1: 12, x2: 60, y2: 12, at: -22 }),
  D(22, 'Side', 'Gusset height', 'linear', '58', 58, 0.2, -0.2, 82, { kind: 'vdim', view: 'S', x1: 60, y1: 12, x2: 14, y2: 70, at: 92 }),
  D(23, 'Side', 'Gusset top fillet', 'radius', 'R5', 5, 0.5, -0.5, 59, { kind: 'leader', view: 'S', x: 15, y: 69, lx: 32, ly: 92 }),
  D(24, 'Side', 'Base front edge chamfer', 'chamfer', '1×45°', 1, 0.2, -0.2, 87, { kind: 'leader', view: 'S', x: 79.6, y: 11.6, lx: 90, ly: 28 }),
  D(25, 'Bottom', 'Base holes, 4×', 'diameter', '4× Ø9 THRU', 9, 0.2, 0, 95, { kind: 'leader', view: 'B', x: 26.8, y: 71.2, lx: 10, ly: 98 }),
  D(26, 'Bottom', 'Hole pitch (X)', 'linear', '60 ±0.1', 60, 0.1, -0.1, 94, { kind: 'hdim', view: 'B', x1: 30, y1: 25.5, x2: 90, y2: 25.5, at: -10 }),
  D(27, 'Bottom', 'Hole pitch (Y)', 'linear', '38 ±0.1', 38, 0.1, -0.1, 92, { kind: 'vdim', view: 'B', x1: 94.5, y1: 30, x2: 94.5, y2: 68, at: 132 }),
  D(28, 'Bottom', 'Hole edge distance (X)', 'linear', '30', 30, 0.1, -0.1, 90, { kind: 'hdim', view: 'B', x1: 0, y1: 0, x2: 30, y2: 25.5, at: -20 }),
  D(29, 'Bottom', 'Hole edge distance (Y)', 'linear', '30', 30, 0.1, -0.1, 89, { kind: 'vdim', view: 'B', x1: 120, y1: 0, x2: 94.5, y2: 30, at: 142 }),
  D(30, 'Bottom', 'Relief pocket length', 'linear', '40', 40, 0.1, 0, 86, { kind: 'hdim', view: 'B', x1: 40, y1: 60, x2: 80, y2: 60, at: 90 }),
  D(31, 'Bottom', 'Relief pocket width', 'linear', '30', 30, 0.1, 0, 85, { kind: 'vdim', view: 'B', x1: 80, y1: 30, x2: 80, y2: 60, at: 108 }),
  D(32, 'Bottom', 'Relief pocket depth', 'linear', 'POCKET ↧3', 3, 0.1, -0.1, 69, { kind: 'leader', view: 'B', x: 44, y: 45, lx: -12, ly: 50 }),
  D(33, 'Bottom', 'Pocket corner radius', 'radius', '4× R4', 4, 0.2, -0.2, 72, { kind: 'leader', view: 'B', x: 41.2, y: 58.8, lx: -12, ly: 66 }),
  D(34, 'Front', 'Bore chamfer', 'chamfer', '0.5×45°', 0.5, 0.1, -0.1, 81, { kind: 'leader', view: 'F', x: 48.3, y: 63.3, lx: 72, ly: 50 }),
  D(35, 'Bottom', 'Hole edge distance (left)', 'linear', '30', 30, 0.1, -0.1, 84, { kind: 'vdim', view: 'B', x1: 0, y1: 0, x2: 25.5, y2: 30, at: -10 }),
]

const gdt = [
  G(1, 'flatness', 0.05, {}, 'Base underside (datum A)', 'Side', 95, { x: 392, y: 548, view: 'S', px: 40, py: 0 }),
  G(2, 'perpendicularity', 0.05, { datums: ['A'] }, 'Leg back face (datum B)', 'Side', 92, { x: 380, y: 150, view: 'S', px: 0, py: 104 }),
  G(3, 'position', 0.05, { dia: true, datums: ['A', 'B', 'C'] }, 'Ø32 H8 bore', 'Front', 94, { x: 176, y: 150, view: 'F', px: 60, py: 91 }),
  G(4, 'position', 0.2, { dia: true, mod: 'MMC', datums: ['A', 'B', 'C'] }, '4× M6 tapped holes', 'Front', 90, { x: 176, y: 176, view: 'F', px: 78, py: 93 }),
  G(5, 'angularity', 0.1, { datums: ['A'] }, 'Top corner chamfer faces', 'Front', 76, { x: 336, y: 244, view: 'F', px: 113, py: 117 }),
  G(6, 'lineProfile', 0.2, { datums: ['A', 'B'] }, 'Top edge profile', 'Front', 68, { x: 60, y: 176, view: 'F', px: 40, py: 120 }),
  G(7, 'surfaceProfile', 0.1, { datums: ['A', 'B', 'C'] }, 'Relief pocket', 'Bottom', 71, { x: 770, y: 236, view: 'B', px: 62, py: 60 }),
  G(8, 'parallelism', 0.05, { datums: ['A'] }, 'Base top face', 'Side', 88, { x: 612, y: 478, view: 'S', px: 70, py: 12 }),
  G(9, 'straightness', 0.05, {}, 'Leg back edge', 'Side', 83, { x: 326, y: 548, view: 'S', px: 0, py: 40 }),
  G(10, 'perpendicularity', 0.03, { dia: true, datums: ['B'] }, 'Ø32 H8 bore axis', 'Front', 87, { x: 60, y: 150, view: 'F', px: 44, py: 75 }),
]

const datums = [
  DT('A', 'Base underside', 'Front', 96, { view: 'F', x: 100, y: 0, lx: 100, ly: -10 }),
  DT('B', 'Leg back face', 'Side', 93, { view: 'S', x: 0, y: 90, lx: -20, ly: 90 }),
  DT('C', 'Left side face', 'Front', 85, { view: 'F', x: 0, y: 100, lx: -30, ly: 100 }),
]

const notes = makeNotes(P, [
  ['Material: Al 6061-T6 plate to ASTM B209; machine from solid.', 97],
  ['Clear anodise 10–15 µm after machining; mask Ø32 H8 bore and M6 threads.', 81],
  ['General tolerances to ISO 2768-mH.', 98],
  ['Break all sharp edges 0.3 max.', 94],
  ['M6-6H threads checked with Go/No-go gauges; helicoils not permitted.', 76],
  ['Laser-etch part no. and date code on base underside.', 66],
])

export const bracketDrawing: DrawingSpec = {
  id: 'drw-bracket',
  template: 'bracket',
  sheet: { w: 1000, h: 700 },
  pages: 1,
  views: [
    { id: 'F', label: 'FRONT VIEW', ox: 90, oy: 470, scale: 2, caption: { x: 210, y: 545 } },
    { id: 'S', label: 'SIDE VIEW (FROM RIGHT)', ox: 440, oy: 470, scale: 2, caption: { x: 565, y: 556 } },
    { id: 'B', label: 'BOTTOM VIEW', ox: 700, oy: 430, scale: 1.6, caption: { x: 796, y: 500 } },
  ],
  geometry,
  titleBlock: {
    partNo: 'OEV-MB-220',
    revision: 'A',
    description: 'Motor mount bracket',
    material: 'Al 6061-T6',
    materialSpec: 'Al 6061-T6, ASTM B209',
    finish: 'Clear anodise 10–15 µm',
    heatTreatment: 'None (T6 as supplied)',
    generalTolerance: 'ISO 2768-mH',
    scale: '1:2 (A3)',
    units: 'mm',
    sheet: '1 of 1',
    drawnBy: 'R. Deshpande',
    date: '2026-09-02',
    customer: 'Orbitra EV Motors',
    confidence: 94,
  },
  dimensions,
  gdt,
  datums,
  notes,
  checks: [
    { id: 'bracket-c1', severity: 'Critical', title: 'Front and side views disagree on overall height (120 vs 121.5)', detail: 'Front view calls 120 ±0.2 while the side view is dimensioned 121.5. Stock height and all vertical positions depend on the answer.', impact: 'Blocks quote release; raise technical query to Orbitra design', refs: ['bracket-d2', 'bracket-d20'] },
    { id: 'bracket-c2', severity: 'Warning', title: 'Machining from solid removes 78% of the block', detail: 'Buy-to-fly ratio 4.6. A 125 × 125 × 90 block becomes a 0.84 kg part.', impact: 'Material is 38% of cost; consider an extruded L-angle blank (saves ~₹410/part)', refs: [] },
    { id: 'bracket-c3', severity: 'Warning', title: 'Anodise masking of bore and threads is manual', detail: 'Note 2 requires masking Ø32 H8 and 4× M6. Adds bung-and-tape operation at the anodiser.', impact: '+₹35/part outside processing', refs: ['bracket-n2', 'bracket-d4'] },
    { id: 'bracket-c4', severity: 'Info', title: 'No tolerance on 45° M6 hole angle: general tolerance applied', detail: 'ISO 2768-m gives ±0°20′. Position Ø0.2 Ⓜ already controls hole location.', impact: 'No cost impact', refs: ['bracket-d9'] },
    { id: 'bracket-c5', severity: 'Info', title: 'Gusset fillet R5 below confidence threshold', detail: 'Leader text partly overlaps the hatch; extracted as R5 with 59% confidence.', impact: 'Verify on drawing', refs: ['bracket-d23'] },
  ],
  stackup: {
    name: 'Bore centre to top edge',
    requirement: { min: 44.7, max: 45.3 },
    links: [
      { label: 'Overall height', refId: 'bracket-d2', nominal: 120, tol: 0.2, direction: 1 },
      { label: 'Bore height from base', refId: 'bracket-d6', nominal: 75, tol: 0.05, direction: -1 },
    ],
  },
  operations: [
    { id: 'op10', opNo: 10, name: 'Saw cut', workCenter: 'm-saw', setupMin: 10, cycleMin: 4, tooling: 'Carbide-tipped blade for aluminium', rationale: '125 × 125 × 90 block from 90 mm plate.' },
    { id: 'op20', opNo: 20, name: 'VMC milling, setup 1', workCenter: 'm-vmc2', setupMin: 45, cycleMin: 22, tooling: 'Ø20 3-flute Al end mill, Ø10 ball nose, face mill Ø63', rationale: 'Hog L-profile and gussets; datum A and B faces finished.' },
    { id: 'op30', opNo: 30, name: 'VMC milling, setup 2', workCenter: 'm-vmc2', setupMin: 35, cycleMin: 14, tooling: 'Ø32 H8 boring head, Ø12 slot mill, M6 thread mill', rationale: 'Bore, slots and tapped holes in one clamping on A-B-C for position Ø0.05.' },
    { id: 'op40', opNo: 40, name: '5-axis chamfers and pocket', workCenter: 'm-5ax', setupMin: 30, cycleMin: 6, tooling: 'Chamfer mill 45°, Ø8 end mill', rationale: '10×45° chamfers with angularity 0.1 and underside pocket without re-fixturing.' },
    { id: 'op50', opNo: 50, name: 'Deburr', workCenter: 'wc-bench', setupMin: 5, cycleMin: 5, tooling: 'Deburr tools', rationale: 'Note 4: 0.3 max edge break.' },
    { id: 'op60', opNo: 60, name: 'Clear anodise (outside)', workCenter: 'wc-outside', setupMin: 0, cycleMin: 0, tooling: 'Type II clear anodise, masked', rationale: 'Note 2.', outside: { supplierId: 's-chamak', costPerPart: 85, leadDays: 4 } },
    { id: 'op70', opNo: 70, name: 'Final inspection (CMM)', workCenter: 'm-cmm', setupMin: 15, cycleMin: 9, tooling: 'CMM program OEV-MB-220-A, M6 Go/No-go', rationale: 'Position and profile callouts need CMM.' },
  ],
  costing: {
    stockShape: 'Plate',
    stockSize: '125 × 125 × 90',
    stockDia: 0,
    stockLength: 125,
    stockWidth: 125,
    stockThk: 90,
    material: 'Al 6061-T6',
    ratePerKg: 312,
    scrapPct: 3,
    inspectionPerPart: 45,
    packagingPerPart: 40,
    overheadPct: 15,
    marginPct: 20,
    quantities: [1, 10, 50, 100, 500],
    primaryQty: 100,
  },
  lastQuoted: { quoteNo: 'Q-2026-0351', date: '2026-06-19', unitPrice: 3150, qty: 100, partNo: 'OEV-MB-210 rev C', note: 'Similar bracket, Ø28 bore, no gussets.' },
}
