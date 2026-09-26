// Detailed drawing 2: pump discharge flange for Tarangi Pumps and Valves (SS316).
import type { DrawingSpec, Primitive } from '../types'
import { makeDatum, makeDim, makeGdt, makeNotes, polar } from './helpers'

const P = 'flange'
const D = makeDim(P)
const G = makeGdt(P)
const DT = makeDatum(P)

const holeAngles = [30, 90, 150, 210, 270, 330]

const innerUpper: [number, number][] = [
  [-2, 31], [-2, 34], [1, 34], [1, 38], [-2, 38], [-2, 55], [0, 55], [0, 53], [16, 53], [16, 45], [19.5, 45], [20, 44.5], [20, 30], [-1, 30],
]
const outerUpper: [number, number][] = [[0, 67], [0, 74], [1, 75], [15, 75], [16, 74], [16, 67]]
const flip = (pts: [number, number][]) => pts.map(([x, y]) => [x, -y] as [number, number])

const detailMaterial: [number, number][] = [
  [-2, 42], [-2, 38.2], [-1.8, 38], [0.6, 38], [1, 37.6], [1, 34.4], [0.6, 34], [-1.8, 34], [-2, 33.8], [-2, 30], [4, 30], [4.4, 34], [3.8, 38], [4, 42],
]

const geometry: Primitive[] = [
  // Face view
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 75 },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 74, style: 'thin' },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 55 },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 38 },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 34 },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 31, style: 'thin' },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 30 },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 60, style: 'center' },
  { t: 'circle', view: 'F', cx: 0, cy: 0, r: 66, style: 'center' },
  ...holeAngles.map((a) => {
    const [cx, cy] = polar(60, a)
    return { t: 'circle', view: 'F', cx, cy, r: 7 } as Primitive
  }),
  ...[0, 180].flatMap((a) => {
    const [cx, cy] = polar(66, a)
    return [
      { t: 'circle', view: 'F', cx, cy, r: 4.25 } as Primitive,
      { t: 'arc', view: 'F', cx, cy, r: 5, a0: 100, a1: 370, style: 'thin' } as Primitive,
    ]
  }),
  { t: 'line', view: 'F', a: [-84, 0], b: [84, 0], style: 'center' },
  { t: 'line', view: 'F', a: [0, -84], b: [0, 84], style: 'center' },
  { t: 'line', view: 'F', a: [0, 86], b: [0, 94], style: 'outline' },
  { t: 'line', view: 'F', a: [0, -86], b: [0, -94], style: 'outline' },
  { t: 'label', view: 'F', x: 6, y: 92, text: 'A', size: 11 },
  { t: 'label', view: 'F', x: 6, y: -92, text: 'A', size: 11 },

  // Section A-A
  { t: 'hatch', view: 'S', pts: innerUpper },
  { t: 'hatch', view: 'S', pts: outerUpper },
  { t: 'hatch', view: 'S', pts: flip(innerUpper) },
  { t: 'hatch', view: 'S', pts: flip(outerUpper) },
  { t: 'poly', view: 'S', pts: innerUpper, closed: true },
  { t: 'poly', view: 'S', pts: outerUpper, closed: true },
  { t: 'poly', view: 'S', pts: flip(innerUpper), closed: true },
  { t: 'poly', view: 'S', pts: flip(outerUpper), closed: true },
  { t: 'line', view: 'S', a: [-8, 0], b: [26, 0], style: 'center' },
  { t: 'line', view: 'S', a: [-4, 60], b: [20, 60], style: 'center' },
  { t: 'line', view: 'S', a: [-4, -60], b: [20, -60], style: 'center' },
  { t: 'circle', view: 'S', cx: -0.5, cy: 36, r: 5.5, style: 'thin' },
  { t: 'label', view: 'S', x: -8, y: 44, text: 'B', size: 10 },

  // Detail B (5:1)
  { t: 'hatch', view: 'B', pts: detailMaterial },
  { t: 'poly', view: 'B', pts: detailMaterial.slice(0, 10), style: 'outline' },
  { t: 'poly', view: 'B', pts: detailMaterial.slice(9).concat([detailMaterial[0]]), style: 'thin' },
  { t: 'line', view: 'B', a: [-4, 36], b: [5, 36], style: 'center' },
]

const dimensions = [
  D(1, 'Face', 'Flange OD', 'diameter', 'Ø150 ±0.2', 150, 0.2, -0.2, 98, { kind: 'leader', view: 'F', x: -37.5, y: 65, lx: -60, ly: 88 }),
  D(2, 'Face', 'Bolt hole pitch circle', 'diameter', 'Ø120 PCD', 120, 0.1, -0.1, 95, { kind: 'leader', view: 'F', x: -56.4, y: 20.5, lx: -86, ly: 40 }),
  D(3, 'Face', 'Bolt holes, 6×', 'diameter', '6× Ø14 THRU', 14, 0.2, 0, 97, { kind: 'leader', view: 'F', x: 56.9, y: 34.9, lx: 72, ly: 72 }),
  D(4, 'Face', 'Hole spacing angle', 'angle', '6× 60°', 60, 0.25, -0.25, 91, { kind: 'leader', view: 'F', x: 31, y: 53.7, lx: 22, ly: 92 }),
  D(5, 'Face', 'First hole angle from horizontal', 'angle', '30°', 30, 0.5, -0.5, 64, { kind: 'leader', view: 'F', x: 59.9, y: 16, lx: 88, ly: 22 }),
  D(6, 'Face', 'Bore', 'diameter', 'Ø60 H7', 60, 0.03, 0, 96, { kind: 'leader', view: 'F', x: -21.2, y: -21.2, lx: -70, ly: -58 }, 'H7'),
  D(7, 'Face', 'Raised face diameter', 'diameter', 'Ø110 RF', 110, 0.2, -0.2, 93, { kind: 'leader', view: 'F', x: -18.8, y: -51.7, lx: -50, ly: -90 }),
  D(8, 'Face', 'O-ring groove OD', 'diameter', 'Ø76 +0.1/0', 76, 0.1, 0, 88, { kind: 'leader', view: 'F', x: 19, y: -32.9, lx: 50, ly: -92 }),
  D(9, 'Face', 'O-ring groove ID', 'diameter', 'Ø68 0/−0.1', 68, 0, -0.1, 84, { kind: 'leader', view: 'F', x: 26, y: -21.9, lx: 80, ly: -70 }),
  D(10, 'Face', 'Jacking holes, 2×', 'thread', '2× M10×1.5 THRU', 10, 0.2, 0, 90, { kind: 'leader', view: 'F', x: 69.5, y: 3.5, lx: 92, ly: -20 }, '6H'),
  D(11, 'Face', 'Jacking hole pitch circle', 'diameter', 'Ø132 PCD', 132, 0.2, -0.2, 79, { kind: 'leader', view: 'F', x: -62, y: -22.6, lx: -92, ly: -30 }),
  D(12, 'Face', 'Bore chamfer', 'chamfer', '1×45°', 1, 0.2, -0.2, 86, { kind: 'leader', view: 'F', x: -21.6, y: 21.6, lx: -60, ly: 50 }),
  D(13, 'Face', 'OD chamfer', 'chamfer', '2× 1×45°', 1, 0.2, -0.2, 83, { kind: 'leader', view: 'F', x: 52.7, y: 52.7, lx: 70, ly: 90 }),
  D(14, 'Section A-A', 'Overall thickness', 'linear', '22 ±0.1', 22, 0.1, -0.1, 97, { kind: 'hdim', view: 'S', x1: -2, y1: 55, x2: 20, y2: 45, at: 88 }),
  D(15, 'Section A-A', 'Flange plate thickness', 'linear', '16 ±0.1', 16, 0.1, -0.1, 95, { kind: 'hdim', view: 'S', x1: 0, y1: 75, x2: 16, y2: 75, at: 81 }),
  D(16, 'Section A-A', 'Spigot length', 'linear', '4 +0.1/0', 4, 0.1, 0, 87, { kind: 'hdim', view: 'S', x1: 16, y1: 53, x2: 20, y2: 45, at: 58, tx: 34 }),
  D(17, 'Section A-A', 'Raised face height', 'linear', '2 ±0.05', 2, 0.05, -0.05, 82, { kind: 'hdim', view: 'S', x1: -2, y1: 55, x2: 0, y2: 67, at: 70, tx: -30 }),
  D(18, 'Section A-A', 'Raised face diameter', 'diameter', 'Ø110', 110, 0.2, -0.2, 92, { kind: 'vdim', view: 'S', x1: -2, y1: -55, x2: -2, y2: 55, at: -11 }),
  D(19, 'Section A-A', 'Spigot diameter', 'diameter', 'Ø90 f7', 90, -0.036, -0.071, 94, { kind: 'vdim', view: 'S', x1: 20, y1: -44.5, x2: 20, y2: 44.5, at: 27 }, 'f7'),
  D(20, 'Section A-A', 'Spigot chamfer', 'chamfer', '0.5×45°', 0.5, 0.1, -0.1, 76, { kind: 'leader', view: 'S', x: 19.8, y: 44.8, lx: 36, ly: 70 }),
  D(21, 'Section A-A', 'Spigot root fillet', 'radius', 'R1', 1, 0.2, -0.2, 61, { kind: 'leader', view: 'S', x: 16.3, y: 45.3, lx: 34, ly: 34 }),
  D(22, 'Section A-A', 'Bolt hole (section)', 'diameter', 'Ø14', 14, 0.2, 0, 89, { kind: 'vdim', view: 'S', x1: 8, y1: 53, x2: 8, y2: 67, at: 8 }),
  D(23, 'Section A-A', 'Bore chamfer (section)', 'chamfer', '1×45°', 1, 0.2, -0.2, 85, { kind: 'leader', view: 'S', x: -1.5, y: 30.5, lx: -14, ly: 22 }),
  D(24, 'Section A-A', 'Bore (section)', 'diameter', 'Ø60', 60, 0.03, 0, 72, { kind: 'vdim', view: 'S', x1: 9, y1: -30, x2: 9, y2: 30, at: 9 }),
  D(25, 'Detail B', 'Groove width', 'linear', '4 +0.1/0', 4, 0.1, 0, 90, { kind: 'vdim', view: 'B', x1: -2, y1: 34, x2: -2, y2: 38, at: -5 }),
  D(26, 'Detail B', 'Groove depth', 'linear', '3 ±0.05', 3, 0.05, -0.05, 88, { kind: 'hdim', view: 'B', x1: -2, y1: 42, x2: 1, y2: 38, at: 44 }),
  D(27, 'Detail B', 'Groove bottom radius', 'radius', '2× R0.4', 0.4, 0.1, -0.1, 69, { kind: 'leader', view: 'B', x: 0.9, y: 37.7, lx: 5.5, ly: 46 }),
  D(28, 'Detail B', 'Groove edge chamfer', 'chamfer', '2× 0.2×45°', 0.2, 0.05, -0.05, 63, { kind: 'leader', view: 'B', x: -1.9, y: 33.9, lx: -7, ly: 28.5 }),
  D(29, 'Face', 'Jacking hole centre offset', 'linear', '66', 66, 0.1, -0.1, 74, { kind: 'hdim', view: 'F', x1: 0, y1: -76, x2: 66, y2: -5, at: -84 }),
  D(30, 'Face', 'Bolt hole radial position', 'linear', '60', 60, 0.1, -0.1, 81, { kind: 'vdim', view: 'F', x1: 0, y1: 0, x2: 0, y2: 60, at: -80 }),
  D(31, 'Detail B', 'Groove floor to RF face', 'linear', '38', 38, 0.05, -0.05, 67, { kind: 'vdim', view: 'B', x1: 1, y1: 38, x2: 1, y2: 30, at: 6, ty: 0 }),
  D(32, 'Section A-A', 'Plate front face to hole', 'linear', '16', 16, 0.1, -0.1, 70, { kind: 'hdim', view: 'S', x1: 0, y1: -67, x2: 16, y2: -67, at: -84 }),
]

const gdt = [
  G(1, 'flatness', 0.02, {}, 'Raised face (datum A)', 'Section A-A', 96, { x: 398, y: 136, view: 'S', px: -2, py: 48 }),
  G(2, 'parallelism', 0.03, { datums: ['A'] }, 'Spigot face', 'Section A-A', 90, { x: 590, y: 446, view: 'S', px: 20, py: -38 }),
  G(3, 'perpendicularity', 0.02, { dia: true, datums: ['A'] }, 'Ø60 H7 bore', 'Section A-A', 87, { x: 430, y: 474, view: 'S', px: 8, py: -30 }),
  G(4, 'position', 0.2, { dia: true, mod: 'MMC', datums: ['A', 'B'] }, '6× Ø14 bolt holes', 'Face', 93, { x: 34, y: 120, view: 'F', px: -56.9, py: 34.9 }),
  G(5, 'circularRunout', 0.02, { datums: ['A', 'B'] }, 'Ø90 f7 spigot', 'Section A-A', 89, { x: 590, y: 420, view: 'S', px: 18, py: -44.8 }),
  G(6, 'straightness', 0.01, {}, 'Ø90 f7 spigot surface element', 'Section A-A', 71, { x: 590, y: 472, view: 'S', px: 17, py: -45 }),
  G(7, 'cylindricity', 0.01, {}, 'Ø60 H7 bore', 'Face', 84, { x: 34, y: 480, view: 'F', px: -15, py: -26 }),
  G(8, 'surfaceProfile', 0.05, { datums: ['A', 'B'] }, 'O-ring groove', 'Detail B', 66, { x: 872, y: 330, view: 'B', px: 1, py: 36 }),
  G(9, 'position', 0.3, { dia: true, datums: ['A', 'B', 'C'] }, '2× M10 jacking holes', 'Face', 80, { x: 368, y: 360, view: 'F', px: 68, py: -3 }),
  G(10, 'totalRunout', 0.03, { datums: ['B'] }, 'Raised face', 'Section A-A', 86, { x: 398, y: 164, view: 'S', px: -2, py: 42 }),
]

const datums = [
  DT('A', 'Raised face', 'Section A-A', 95, { view: 'S', x: -2, y: 50, lx: -20, ly: 50 }),
  DT('B', 'Ø60 H7 bore axis', 'Face', 92, { view: 'F', x: 21.2, y: -21.2, lx: 45, ly: -45 }),
  DT('C', 'Ø90 f7 spigot', 'Section A-A', 83, { view: 'S', x: 18, y: 45, lx: 18, ly: 64 }),
]

const notes = makeNotes(P, [
  ['Material: SS316 to ASTM A479, solution annealed; mill TC 3.1 required.', 96],
  ['Sealing surfaces free from scratches; radial tool marks not permitted on RF.', 78],
  ['General tolerances to ISO 2768-mK.', 98],
  ['Surface finish Ra 0.8 on raised face and groove; Ra 3.2 elsewhere.', 86],
  ['Passivate to ASTM A967 after machining.', 91],
  ['Vibro-etch part no. and heat no. on OD; hydro test by customer.', 68],
])

export const flangeDrawing: DrawingSpec = {
  id: 'drw-flange',
  template: 'flange',
  sheet: { w: 1000, h: 700 },
  pages: 1,
  views: [
    { id: 'F', label: 'FACE VIEW', ox: 225, oy: 300, scale: 1.5, caption: { x: 225, y: 530 } },
    { id: 'S', label: 'SECTION A-A', ox: 500, oy: 300, scale: 2.2, caption: { x: 520, y: 530 } },
    { id: 'B', label: 'DETAIL B (5:1)', ox: 800, oy: 660, scale: 10, caption: { x: 790, y: 410 } },
  ],
  geometry,
  titleBlock: {
    partNo: 'TPV-FL-150',
    revision: 'B',
    description: 'Pump discharge flange',
    material: 'SS316',
    materialSpec: 'SS316, ASTM A479',
    finish: 'Passivated',
    heatTreatment: 'Solution annealed (as supplied)',
    generalTolerance: 'ISO 2768-mK',
    scale: '1:2 (A3)',
    units: 'mm',
    sheet: '1 of 1',
    drawnBy: 'K. Subramanian',
    date: '2026-07-02',
    customer: 'Tarangi Pumps and Valves',
    confidence: 95,
  },
  dimensions,
  gdt,
  datums,
  notes,
  checks: [
    { id: 'flange-c1', severity: 'Warning', title: 'Bore, spigot and raised face must be turned in one setup', detail: 'Runout 0.02 of Ø90 f7 to A-B and perpendicularity Ø0.02 of the bore need a single chucking. Plan soft jaws on OD.', impact: 'Longer Op 20 setup (+20 min); soft jaws ₹2,400 one-time', refs: ['flange-g5', 'flange-g3', 'flange-d19'] },
    { id: 'flange-c2', severity: 'Info', title: 'No tolerance on 30° hole angle: general tolerance applied', detail: 'ISO 2768-m angular tolerance for 50–120 mm is ±0°20′. Hole position is anyway controlled by Ø0.2 Ⓜ.', impact: 'No cost impact', refs: ['flange-d5'] },
    { id: 'flange-c3', severity: 'Warning', title: 'SS316 bar price up 8% since last quote', detail: 'Kavach Alloys revised Ø160 SS316 bar to ₹338/kg (was ₹313/kg in June).', impact: '+₹104 per part in material', refs: [] },
    { id: 'flange-c4', severity: 'Critical', title: 'O-ring groove Ø68 lower limit clashes with standard O-ring', detail: 'Groove ID Ø68 0/−0.1 with a 70 × 3 O-ring gives 2.9% stretch; spec sheet recommends 1–5%, but at LMC the stretch drops to 2.8%. Confirm O-ring size with customer.', impact: 'Technical query before release', refs: ['flange-d9', 'flange-d8'] },
    { id: 'flange-c5', severity: 'Info', title: 'Passivation after machining adds 3 days', detail: 'Chamak Surface Finishers batch passivation runs Tue/Fri.', impact: '+3 days lead time', refs: ['flange-n5'] },
  ],
  stackup: {
    name: 'Raised face to spigot face (overall 22)',
    requirement: { min: 21.8, max: 22.2 },
    links: [
      { label: 'Raised face height', refId: 'flange-d17', nominal: 2, tol: 0.05, direction: 1 },
      { label: 'Plate thickness', refId: 'flange-d15', nominal: 16, tol: 0.1, direction: 1 },
      { label: 'Spigot length', refId: 'flange-d16', nominal: 4.05, tol: 0.05, direction: 1 },
    ],
  },
  operations: [
    { id: 'op10', opNo: 10, name: 'Saw cut', workCenter: 'm-saw', setupMin: 10, cycleMin: 6, tooling: 'Bi-metal blade for stainless, coolant on', rationale: 'Ø160 bar cut to 26 mm slices; 2 mm facing allowance per side.' },
    { id: 'op20', opNo: 20, name: 'CNC turning, both sides', workCenter: 'm-tc2', setupMin: 60, cycleMin: 18, tooling: 'CNMG 120408-MM (stainless), grooving insert 4 mm full radius, boring bar Ø40', rationale: 'Bore, spigot, raised face and O-ring groove turned in two chuckings with soft jaws for runout.' },
    { id: 'op30', opNo: 30, name: 'VMC drilling and tapping', workCenter: 'm-vmc3', setupMin: 35, cycleMin: 8, tooling: 'Ø14 carbide drill, M10 spiral tap, spot drill', rationale: '6× Ø14 on Ø120 PCD and 2× M10 jacking holes; locate on bore (B) and face (A).' },
    { id: 'op40', opNo: 40, name: 'Deburr', workCenter: 'wc-bench', setupMin: 5, cycleMin: 5, tooling: 'Deburr tools, no radial marks on RF', rationale: 'Note 2 forbids radial marks on sealing face.' },
    { id: 'op50', opNo: 50, name: 'Passivation (outside)', workCenter: 'wc-outside', setupMin: 0, cycleMin: 0, tooling: 'ASTM A967 nitric passivation', rationale: 'Note 5.', outside: { supplierId: 's-chamak', costPerPart: 60, leadDays: 3 } },
    { id: 'op60', opNo: 60, name: 'Final inspection (CMM)', workCenter: 'm-cmm', setupMin: 15, cycleMin: 7, tooling: 'CMM program TPV-FL-150-B, bore gauge Ø60 H7', rationale: 'Runout, position and profile callouts; 1 in 5 on CMM.' },
  ],
  costing: {
    stockShape: 'Round bar',
    stockSize: 'Ø160 × 26',
    stockDia: 160,
    stockLength: 26,
    material: 'SS316',
    ratePerKg: 338,
    scrapPct: 4,
    inspectionPerPart: 35,
    packagingPerPart: 30,
    overheadPct: 15,
    marginPct: 16,
    quantities: [1, 10, 50, 100, 500],
    primaryQty: 100,
  },
  lastQuoted: { quoteNo: 'Q-2026-0302', date: '2026-04-02', unitPrice: 2890, qty: 100, partNo: 'TPV-FL-150 rev A', note: 'Rev A had no O-ring groove; SS316 was ₹313/kg.' },
}
