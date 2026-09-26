// Detailed drawing 1: flanged drive shaft for Kestrel Aerodyne (EN19).
import type { DrawingSpec, Primitive } from '../types'
import { makeDatum, makeDim, makeGdt, makeNotes, mirrorY, polar } from './helpers'

const P = 'shaft'
const D = makeDim(P)
const G = makeGdt(P)
const DT = makeDatum(P)

// Top half of the turned profile (x along axis, y = radius), left to right.
const top: [number, number][] = [
  [0, 0], [0, 11], [1, 12], [15, 12], [15, 10.5], [18, 10.5], [18, 14.5], [18.5, 15], [48, 15], [48, 29.5], [48.5, 30],
  [59.5, 30], [60, 29.5], [60, 20], [72.5, 20], [72.5, 18], [75.5, 18], [75.5, 20], [94.5, 20], [95, 19.5], [95, 12.5],
  [98, 12.5], [98, 8.5], [118, 8.5], [118, 12.5], [119, 12.5], [120, 11.5], [120, 0],
]
const bottom: [number, number][] = mirrorY(top.map(([x, y]) => (x >= 98 && x <= 118 && y === 8.5 ? [x, 12.5] : [x, y]) as [number, number]))

const edges: Primitive[] = [
  [1, 11], [15, 12], [18, 14.5], [48, 29.5], [60, 29.5], [72.5, 18], [75.5, 18], [95, 19.5], [119, 11.5],
].map(([x, r]) => ({ t: 'line', view: 'F', a: [x, -r], b: [x, r] }) as Primitive)

const sectionOutline: [number, number][] = (() => {
  const pts: [number, number][] = []
  const a0 = 90 + 18.66
  const a1 = 90 - 18.66 + 360
  for (let a = a0; a <= a1; a += 6) pts.push(polar(12.5, a))
  pts.push(polar(12.5, a1))
  pts.push([4, 8.5], [-4, 8.5])
  return pts
})()

const holeAngles = [45, 135, 225, 315]

const geometry: Primitive[] = [
  // Front view
  { t: 'poly', view: 'F', pts: [...top, ...bottom], closed: true, style: 'outline' },
  ...edges,
  { t: 'line', view: 'F', a: [-6, 0], b: [126, 0], style: 'center' },
  // M8 tapped hole, left end (hidden)
  { t: 'line', view: 'F', a: [0, 4], b: [16, 4], style: 'hidden' },
  { t: 'line', view: 'F', a: [0, -4], b: [16, -4], style: 'hidden' },
  { t: 'poly', view: 'F', pts: [[0, 3.4], [20, 3.4], [22, 0], [20, -3.4], [0, -3.4]], style: 'hidden' },
  // Deep drilled hole Ø6 × 54, right end (hidden)
  { t: 'poly', view: 'F', pts: [[120, 3], [66, 3], [64.3, 0], [66, -3], [120, -3]], style: 'hidden' },
  // Keyway floor seen from the front
  { t: 'line', view: 'F', a: [98, 12.5], b: [118, 12.5], style: 'thin' },
  // Cutting plane A-A
  { t: 'line', view: 'F', a: [113, 20], b: [113, -20], style: 'phantom' },
  { t: 'label', view: 'F', x: 113, y: 23, text: 'A', size: 11 },
  { t: 'label', view: 'F', x: 113, y: -26.5, text: 'A', size: 11 },

  // Side view (from right end)
  { t: 'circle', view: 'S', cx: 0, cy: 0, r: 30, style: 'outline' },
  { t: 'circle', view: 'S', cx: 0, cy: 0, r: 29.5, style: 'thin' },
  { t: 'circle', view: 'S', cx: 0, cy: 0, r: 20, style: 'outline' },
  { t: 'arc', view: 'S', cx: 0, cy: 0, r: 12.5, a0: 108.66, a1: 431.34, style: 'outline' },
  { t: 'poly', view: 'S', pts: [[-4, 11.84], [-4, 8.5], [4, 8.5], [4, 11.84]], style: 'outline' },
  { t: 'circle', view: 'S', cx: 0, cy: 0, r: 3, style: 'outline' },
  { t: 'circle', view: 'S', cx: 0, cy: 0, r: 23, style: 'center' },
  ...holeAngles.map((a) => {
    const [cx, cy] = polar(23, a)
    return { t: 'circle', view: 'S', cx, cy, r: 3.3, style: 'outline' } as Primitive
  }),
  { t: 'line', view: 'S', a: [-35, 0], b: [35, 0], style: 'center' },
  { t: 'line', view: 'S', a: [0, -35], b: [0, 35], style: 'center' },

  // Section A-A
  { t: 'hatch', view: 'A', pts: sectionOutline },
  { t: 'poly', view: 'A', pts: sectionOutline, closed: true, style: 'outline' },
  { t: 'circle', view: 'A', cx: 0, cy: 0, r: 3, style: 'outline' },
  { t: 'line', view: 'A', a: [-16, 0], b: [16, 0], style: 'center' },
  { t: 'line', view: 'A', a: [0, -16], b: [0, 16], style: 'center' },
]

const dimensions = [
  D(1, 'Front', 'Thread, left end', 'thread', 'M24×1.5-6g', 24, 0, -0.038, 96, { kind: 'vdim', view: 'F', x1: 7, y1: -12, x2: 7, y2: 12, at: 7 }, '6g'),
  D(2, 'Front', 'Bearing journal', 'diameter', 'Ø30 h6', 30, 0, -0.013, 98, { kind: 'vdim', view: 'F', x1: 33, y1: -15, x2: 33, y2: 15, at: 33 }, 'h6'),
  D(3, 'Front', 'Flange OD', 'diameter', 'Ø60 ±0.1', 60, 0.1, -0.1, 97, { kind: 'vdim', view: 'F', x1: 54, y1: -30, x2: 54, y2: 30, at: 54 }),
  D(4, 'Front', 'Shoulder diameter', 'diameter', 'Ø40 ±0.05', 40, 0.05, -0.05, 95, { kind: 'vdim', view: 'F', x1: 85, y1: -20, x2: 85, y2: 20, at: 85 }),
  D(5, 'Front', 'Output journal', 'diameter', 'Ø25 k6', 25, 0.015, 0.002, 88, { kind: 'vdim', view: 'F', x1: 96.5, y1: -12.5, x2: 96.5, y2: 12.5, at: 96.5 }, 'k6'),
  D(6, 'Front', 'Overall length', 'linear', '120 ±0.2', 120, 0.2, -0.2, 99, { kind: 'hdim', view: 'F', x1: 0, y1: -11, x2: 120, y2: -11.5, at: -56 }),
  D(7, 'Front', 'Thread length', 'linear', '18', 18, 0.1, -0.1, 94, { kind: 'hdim', view: 'F', x1: 0, y1: -11, x2: 18, y2: -14.5, at: -38 }),
  D(8, 'Front', 'Journal length', 'linear', '30', 30, 0.1, -0.1, 93, { kind: 'hdim', view: 'F', x1: 18, y1: -14.5, x2: 48, y2: -29.5, at: -38 }),
  D(9, 'Front', 'Flange thickness', 'linear', '12 ±0.05', 12, 0.05, -0.05, 91, { kind: 'hdim', view: 'F', x1: 48, y1: -29.5, x2: 60, y2: -29.5, at: -38 }),
  D(10, 'Front', 'Shoulder length', 'linear', '35', 35, 0.1, -0.1, 92, { kind: 'hdim', view: 'F', x1: 60, y1: -29.5, x2: 95, y2: -19.5, at: -38 }),
  D(11, 'Front', 'Output journal length', 'linear', '25', 25, 0.1, -0.1, 90, { kind: 'hdim', view: 'F', x1: 95, y1: -19.5, x2: 120, y2: -11.5, at: -38 }),
  D(12, 'Front', 'Groove position from flange', 'linear', '12.5', 12.5, 0.2, -0.2, 66, { kind: 'hdim', view: 'F', x1: 60, y1: 30, x2: 72.5, y2: 20, at: 34 }),
  D(13, 'Front', 'Relief groove width', 'linear', '3 +0.1/0', 3, 0.1, 0, 84, { kind: 'hdim', view: 'F', x1: 72.5, y1: 18, x2: 75.5, y2: 18, at: 26, tx: 30 }),
  D(14, 'Front', 'Relief groove diameter', 'diameter', 'Ø36', 36, 0.2, -0.2, 81, { kind: 'vdim', view: 'F', x1: 74, y1: -18, x2: 74, y2: 18, at: 74 }),
  D(15, 'Front', 'Thread end chamfer', 'chamfer', '1×45°', 1, 0.2, -0.2, 93, { kind: 'leader', view: 'F', x: 0.5, y: 11.5, lx: -12, ly: 18 }),
  D(16, 'Front', 'Flange edge chamfer (left)', 'chamfer', '0.5×45°', 0.5, 0.1, -0.1, 86, { kind: 'leader', view: 'F', x: 48.2, y: 29.8, lx: 42, ly: 46 }),
  D(17, 'Front', 'Journal to flange fillet', 'radius', 'R1', 1, 0.2, -0.2, 72, { kind: 'leader', view: 'F', x: 48, y: 15, lx: 42, ly: 22 }),
  D(18, 'Front', 'Shoulder to journal fillet', 'radius', 'R0.8', 0.8, 0.1, -0.1, 68, { kind: 'leader', view: 'F', x: 95, y: -12.5, lx: 100, ly: -25 }),
  D(19, 'Front', 'Flange edge radius (right)', 'radius', 'R0.5', 0.5, 0.1, -0.1, 83, { kind: 'leader', view: 'F', x: 59.8, y: 29.8, lx: 66, ly: 40 }),
  D(20, 'Front', 'Thread undercut width', 'linear', '3', 3, 0.1, -0.1, 79, { kind: 'hdim', view: 'F', x1: 15, y1: 12, x2: 18, y2: 15, at: 22 }),
  D(21, 'Front', 'Keyway length', 'linear', '20', 20, 0.2, 0, 91, { kind: 'hdim', view: 'F', x1: 98, y1: 12.5, x2: 118, y2: 12.5, at: 18 }),
  D(22, 'Front', 'Keyway end distance', 'linear', '2', 2, 0.2, -0.2, 62, { kind: 'hdim', view: 'F', x1: 118, y1: 12.5, x2: 120, y2: 11.5, at: 18, tx: 14 }),
  D(23, 'Side', 'Hole pitch circle', 'diameter', 'Ø46 PCD', 46, 0.05, -0.05, 94, { kind: 'leader', view: 'S', x: 23, y: 0, lx: 36, ly: 10 }),
  D(24, 'Side', 'Flange holes, 4×', 'diameter', '4× Ø6.6 THRU', 6.6, 0.1, 0, 97, { kind: 'leader', view: 'S', x: 18.6, y: 18.6, lx: 26, ly: 34 }),
  D(25, 'Side', 'Hole angular position', 'angle', '45°', 45, 0.5, -0.5, 87, { kind: 'leader', view: 'S', x: 8, y: 8, lx: -30, ly: 36 }),
  D(26, 'Side', 'Flange OD (side view)', 'diameter', 'Ø60.5', 60.5, 0.1, -0.1, 71, { kind: 'leader', view: 'S', x: -21.2, y: -21.2, lx: -34, ly: -36 }),
  D(27, 'Section A-A', 'Keyway width', 'linear', '8 N9', 8, 0, -0.036, 95, { kind: 'hdim', view: 'A', x1: -4, y1: 12, x2: 4, y2: 12, at: 19 }, 'N9'),
  D(28, 'Section A-A', 'Keyway depth (shaft)', 'linear', '21 0/−0.2', 21, 0, -0.2, 89, { kind: 'vdim', view: 'A', x1: 0, y1: -12.5, x2: 4, y2: 8.5, at: 18 }),
  D(29, 'Section A-A', 'Deep drilled hole', 'diameter', 'Ø6 × 54 DEEP', 6, 0.1, 0, 90, { kind: 'leader', view: 'A', x: -2.1, y: -2.1, lx: -12, ly: -19 }),
  D(30, 'Front', 'Deep hole depth', 'linear', '54', 54, 0.5, 0, 85, { kind: 'hdim', view: 'F', x1: 66, y1: -3, x2: 120, y2: -3, at: -47 }),
  D(31, 'Front', 'Tapped hole, left end', 'thread', 'M8×1.25-6H', 8, 0.2, 0, 92, { kind: 'leader', view: 'F', x: 5, y: 4, lx: -12, ly: 30 }, '6H'),
  D(32, 'Front', 'Thread depth', 'linear', '16', 16, 1, 0, 88, { kind: 'hdim', view: 'F', x1: 0, y1: 4, x2: 16, y2: 4, at: 27 }),
  D(33, 'Front', 'Tap drill depth', 'linear', '20', 20, 1, 0, 86, { kind: 'hdim', view: 'F', x1: 0, y1: 3.4, x2: 20, y2: 3.4, at: 35 }),
  D(34, 'Front', 'Right end chamfer', 'chamfer', '1×45°', 1, 0.2, -0.2, 94, { kind: 'leader', view: 'F', x: 119.6, y: 12, lx: 128, ly: 24 }),
  D(35, 'Front', 'Shoulder edge chamfer', 'chamfer', '0.5×45°', 0.5, 0.1, -0.1, 77, { kind: 'leader', view: 'F', x: 94.8, y: 19.8, lx: 101, ly: 31 }),
  D(36, 'Front', 'Groove root radius', 'radius', 'R0.4 max', 0.4, 0, -0.2, 58, { kind: 'leader', view: 'F', x: 74, y: -18, lx: 80, ly: -28 }),
  D(37, 'Front', 'Thread undercut diameter', 'diameter', 'Ø21', 21, 0, -0.2, 82, { kind: 'vdim', view: 'F', x1: 16.5, y1: -10.5, x2: 16.5, y2: 10.5, at: 16.5 }),
  D(38, 'Front', 'Journal lead-in chamfer', 'chamfer', '0.5×45°', 0.5, 0.1, -0.1, 80, { kind: 'leader', view: 'F', x: 18.3, y: 14.8, lx: 24, ly: 40 }),
  D(39, 'Section A-A', 'Keyway corner radius', 'radius', 'R0.25', 0.25, 0.05, -0.05, 64, { kind: 'leader', view: 'A', x: 4, y: 8.5, lx: 13, ly: 7 }),
]

const gdt = [
  G(1, 'cylindricity', 0.005, {}, 'Ø30 h6 bearing journal', 'Front', 94, { x: 138, y: 96, view: 'F', px: 26, py: 15 }),
  G(2, 'totalRunout', 0.01, { datums: ['A'] }, 'Ø40 shoulder', 'Front', 91, { x: 470, y: 118, view: 'F', px: 92, py: 20 }),
  G(3, 'circularRunout', 0.015, { datums: ['A'] }, 'Ø25 k6 output journal', 'Front', 89, { x: 392, y: 494, view: 'F', px: 108, py: -12.5 }),
  G(4, 'perpendicularity', 0.01, { datums: ['A'] }, 'Flange right face', 'Front', 86, { x: 250, y: 108, view: 'F', px: 60, py: 24 }),
  G(5, 'position', 0.1, { dia: true, mod: 'MMC', datums: ['A', 'B', 'C'] }, '4× Ø6.6 flange holes', 'Side', 92, { x: 560, y: 150, view: 'S', px: -18.6, py: 18.6 }),
  G(6, 'flatness', 0.01, {}, 'Flange left face (datum B)', 'Front', 95, { x: 150, y: 494, view: 'F', px: 48, py: -27 }),
  G(7, 'symmetry', 0.02, { datums: ['A'] }, 'Keyway 8 N9', 'Section A-A', 78, { x: 800, y: 146, view: 'A', px: -2, py: 12.5 }),
  G(8, 'concentricity', 0.02, { dia: true, datums: ['A'] }, 'Ø60 flange OD', 'Front', 73, { x: 244, y: 494, view: 'F', px: 54, py: -30 }),
  G(9, 'circularity', 0.004, {}, 'Ø25 k6 output journal', 'Front', 67, { x: 392, y: 520, view: 'F', px: 116, py: -12.5 }),
  G(10, 'parallelism', 0.02, { datums: ['B'] }, 'Flange right face', 'Front', 88, { x: 244, y: 520, view: 'F', px: 60, py: -26 }),
]

const datums = [
  DT('A', 'Ø30 h6 journal axis', 'Front', 96, { view: 'F', x: 30, y: -15, lx: 30, ly: -27 }),
  DT('B', 'Flange left face', 'Front', 93, { view: 'F', x: 48, y: -23, lx: 40, ly: -23 }),
  DT('C', 'Keyway centre plane', 'Section A-A', 84, { view: 'A', x: 4, y: 11, lx: 14, ly: 22 }),
]

const notes = makeNotes(P, [
  ['Material: EN19 (42CrMo4) to IS 1570; hardened and tempered 28–32 HRC.', 97],
  ['Remove all burrs and sharp edges 0.2×45° max unless specified.', 95],
  ['General tolerances to ISO 2768-mK.', 98],
  ['Surface finish Ra 0.4 on Ø30 h6 journal; Ra 1.6 elsewhere unless specified.', 82],
  ['Thread M24×1.5-6g to IS 4218; protect threads during heat treatment.', 74],
  ['Magnetic particle inspection 100%; no linear indications permitted.', 69],
])

export const shaftDrawing: DrawingSpec = {
  id: 'drw-shaft',
  template: 'shaft',
  sheet: { w: 1000, h: 700 },
  pages: 2,
  views: [
    { id: 'F', label: 'FRONT VIEW', ox: 130, oy: 290, scale: 3, caption: { x: 310, y: 480 } },
    { id: 'S', label: 'SIDE VIEW (FROM RIGHT)', ox: 665, oy: 290, scale: 3, caption: { x: 665, y: 432 } },
    { id: 'A', label: 'SECTION A-A (2:1)', ox: 880, oy: 290, scale: 4, caption: { x: 880, y: 432 } },
  ],
  geometry,
  titleBlock: {
    partNo: 'KA-7731-SH',
    revision: 'C',
    description: 'Drive shaft, flanged',
    material: 'EN19',
    materialSpec: 'EN19 (42CrMo4), IS 1570',
    finish: 'Black oxide',
    heatTreatment: 'Hardened and tempered 28–32 HRC',
    generalTolerance: 'ISO 2768-mK',
    scale: '1:1 (A3)',
    units: 'mm',
    sheet: '1 of 2',
    drawnBy: 'V. Joshi',
    date: '2026-08-11',
    customer: 'Kestrel Aerodyne',
    confidence: 97,
  },
  dimensions,
  gdt,
  datums,
  notes,
  checks: [
    { id: 'shaft-c1', severity: 'Warning', title: 'Ø30 h6 journal needs cylindrical grinding', detail: 'h6 (13 µm band) with cylindricity 0.005 and Ra 0.4 cannot be held reliably by turning after heat treatment.', impact: 'Adds Op 60 cylindrical grinding: +0.25 h setup, +6 min per part', refs: ['shaft-d2', 'shaft-g1'] },
    { id: 'shaft-c2', severity: 'Warning', title: 'Hole depth 9× diameter: deep drilling required', detail: 'Ø6 × 54 deep is L/D = 9. Standard twist drills wander beyond 5×D; use a pilot + long-series carbide drill with peck cycle.', impact: 'Longer cycle on Op 40 (+2.5 min); tooling ₹3,800 amortised', refs: ['shaft-d29', 'shaft-d30'] },
    { id: 'shaft-c3', severity: 'Info', title: 'No tolerance on 12.5 mm step: general tolerance applied', detail: 'Groove position 12.5 has no explicit tolerance. ISO 2768-m gives ±0.2 for 6–30 mm.', impact: 'No cost impact; confirm with customer if groove locates a circlip', refs: ['shaft-d12'] },
    { id: 'shaft-c4', severity: 'Critical', title: 'Front and side views disagree on flange diameter (Ø60 vs Ø60.5)', detail: 'Front view calls Ø60 ±0.1 but the side view is annotated Ø60.5. Stock size and turning allowance depend on which is correct.', impact: 'Blocks quote release until clarified; raise a technical query', refs: ['shaft-d3', 'shaft-d26'] },
    { id: 'shaft-c5', severity: 'Warning', title: 'Keyway corner R0.25 needs a special cutter', detail: 'Standard 8 mm keyseat cutters have R0.2 or sharp corners. R0.25 ±0.05 needs a custom-ground cutter or wire EDM.', impact: 'Tooling lead time 5 days, or +₹120/part via EDM', refs: ['shaft-d39', 'shaft-d27'] },
    { id: 'shaft-c6', severity: 'Info', title: 'Thread protection during heat treatment', detail: 'Note 5 requires threads protected during hardening. Heat treater must use anti-scaling paste on M24 thread.', impact: 'Add to heat-treatment PO instructions', refs: ['shaft-n5', 'shaft-d1'] },
  ],
  stackup: {
    name: 'Flange right face to groove far edge',
    requirement: { min: 15.1, max: 15.9 },
    links: [
      { label: 'Groove position', refId: 'shaft-d12', nominal: 12.5, tol: 0.2, direction: 1 },
      { label: 'Groove width', refId: 'shaft-d13', nominal: 3.05, tol: 0.05, direction: 1 },
    ],
  },
  operations: [
    { id: 'op10', opNo: 10, name: 'Saw cut', workCenter: 'm-saw', setupMin: 10, cycleMin: 3, tooling: 'Bi-metal blade 27 × 0.9, 4/6 TPI', rationale: 'Ø65 bar stock cut to 130 mm leaves 5 mm facing allowance per end.' },
    { id: 'op20', opNo: 20, name: 'CNC turning', workCenter: 'm-tc1', setupMin: 45, cycleMin: 14, tooling: 'CNMG 120408 roughing, VNMG 160404 finishing, 60° threading insert 1.5 p', rationale: 'All diameters, grooves, M24 thread and M8 tap drill in two setups; leaves 0.3 mm grind stock on Ø30.' },
    { id: 'op30', opNo: 30, name: 'VMC milling (keyway)', workCenter: 'm-vmc1', setupMin: 40, cycleMin: 6, tooling: 'Ø8 keyseat end mill, V-block fixture', rationale: '8 N9 keyway with symmetry 0.02 to A; V-block locates on Ø30 journal (datum A).' },
    { id: 'op40', opNo: 40, name: 'Drilling and tapping', workCenter: 'm-vmc1', setupMin: 30, cycleMin: 9, tooling: 'Ø6 carbide long-series drill, M8 spiral tap, Ø6.6 drill', rationale: '4× Ø6.6 flange holes, Ø6 × 54 deep hole with peck cycle, M8 tap. Combined with Op 30 fixture family.' },
    { id: 'op50', opNo: 50, name: 'Heat treatment (outside)', workCenter: 'wc-outside', setupMin: 0, cycleMin: 0, tooling: 'Hardening + tempering to 28–32 HRC', rationale: 'Required by note 1. Agnikund batch-processes EN19 twice a week.', outside: { supplierId: 's-agnikund', costPerPart: 95, leadDays: 4 } },
    { id: 'op60', opNo: 60, name: 'Cylindrical grinding', workCenter: 'm-grind', setupMin: 35, cycleMin: 6, tooling: 'A60 K5 V wheel, between centres', rationale: 'Ø30 h6 with 0.005 cylindricity and Ra 0.4 after HT; also grinds Ø25 k6 in the same setup.' },
    { id: 'op70', opNo: 70, name: 'Deburr', workCenter: 'wc-bench', setupMin: 5, cycleMin: 4, tooling: 'Hand deburr tools, Scotch-Brite', rationale: 'Note 2: 0.2 max edge break.' },
    { id: 'op80', opNo: 80, name: 'Final inspection (CMM)', workCenter: 'm-cmm', setupMin: 20, cycleMin: 8, tooling: 'CMM program KA-7731-C, thread gauges, surface tester', rationale: '10 GD&T callouts incl. runout and position need CMM; 100% on first 5, then 1 in 10.' },
  ],
  costing: {
    stockShape: 'Round bar',
    stockSize: 'Ø65 × 130',
    stockDia: 65,
    stockLength: 130,
    material: 'EN19',
    ratePerKg: 92,
    scrapPct: 5,
    inspectionPerPart: 40,
    packagingPerPart: 25,
    overheadPct: 15,
    marginPct: 18,
    quantities: [1, 10, 50, 100, 500],
    primaryQty: 50,
  },
  lastQuoted: { quoteNo: 'Q-2026-0388', date: '2026-05-14', unitPrice: 1870, qty: 50, partNo: 'KA-7731-SH rev B', note: 'Rev B had no grinding (Ø30 h7) and no deep hole.' },
}
