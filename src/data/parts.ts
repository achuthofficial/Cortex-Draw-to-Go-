import { daysFromToday } from '@/lib/dates'
import type { BomLine, Eco, MaterialCode, Part, PartStatus, Revision } from './types'

type Family = Part['family']
type Row = [partNo: string, description: string, customerId: string, material: MaterialCode, rev: string, status: PartStatus, updated: number, family: Family, weightKg: number]

const rows: Row[] = [
  ['KA-7731-SH', 'Drive shaft, flanged', 'c-kestrel', 'EN19', 'C', 'Released', -44, 'Shafts', 1.12],
  ['KA-7725-PN', 'Hinge pin', 'c-kestrel', 'EN24', 'D', 'Released', -90, 'Pins', 0.18],
  ['KA-7740-FL', 'Actuator end flange', 'c-kestrel', 'Al 6061-T6', 'A', 'Released', -30, 'Flanges', 0.42],
  ['KA-7742-BR', 'Sensor bracket', 'c-kestrel', 'Al 6061-T6', 'B', 'In change', -6, 'Brackets', 0.21],
  ['KA-7711-HS', 'Bearing housing', 'c-kestrel', 'Al 6061-T6', 'B', 'Released', -120, 'Housings', 0.66],
  ['KA-7712-BS', 'Bearing bush', 'c-kestrel', 'C45', 'A', 'Released', -210, 'Bushes', 0.09],
  ['KA-7713-CL', 'Retaining cap', 'c-kestrel', 'Al 6061-T6', 'A', 'Released', -210, 'Plates', 0.07],
  ['KA-7710-SUB', 'Bearing cartridge sub-assembly', 'c-kestrel', 'Al 6061-T6', 'B', 'Released', -118, 'Assemblies', 1.05],
  ['KA-7700-ASM', 'Actuator drive assembly', 'c-kestrel', 'EN19', 'C', 'In change', -12, 'Assemblies', 2.64],
  ['OEV-MB-220', 'Motor mount bracket', 'c-orbitra', 'Al 6061-T6', 'A', 'Released', -22, 'Brackets', 0.84],
  ['OEV-MB-210', 'Motor mount bracket (previous gen)', 'c-orbitra', 'Al 6061-T6', 'C', 'Obsolete', -40, 'Brackets', 0.71],
  ['OEV-SH-118', 'Rotor shaft stub', 'c-orbitra', 'EN24', 'B', 'Released', -65, 'Shafts', 0.58],
  ['OEV-SH-104', 'Output shaft', 'c-orbitra', 'EN19', 'A', 'Released', -160, 'Shafts', 1.35],
  ['TPV-FL-150', 'Pump discharge flange', 'c-tarangi', 'SS316', 'B', 'Released', -84, 'Flanges', 2.05],
  ['TPV-IM-210', 'Impeller hub', 'c-tarangi', 'SS316', 'C', 'Released', -52, 'Housings', 1.4],
  ['TPV-SH-075', 'Pump shaft', 'c-tarangi', 'SS316', 'D', 'Released', -100, 'Shafts', 1.8],
  ['TPV-AS-300', 'Pump bearing bracket assembly', 'c-tarangi', 'SS316', 'B', 'Released', -70, 'Assemblies', 7.9],
  ['TPV-AS-310', 'Bearing carrier sub-assembly', 'c-tarangi', 'SS316', 'A', 'Released', -70, 'Assemblies', 2.2],
  ['TPV-BC-311', 'Carrier body', 'c-tarangi', 'SS304', 'A', 'Released', -140, 'Housings', 1.9],
  ['TPV-BS-312', 'Carrier bush', 'c-tarangi', 'C45', 'A', 'Released', -140, 'Bushes', 0.3],
  ['TPV-BR-320', 'Mounting bracket', 'c-tarangi', 'IS 2062', 'B', 'Released', -95, 'Brackets', 1.6],
  ['NH-CY-808', 'Cylinder end cap', 'c-nilgiri', 'EN8', 'C', 'Released', -35, 'Flanges', 1.1],
  ['NH-RD-112', 'Piston rod', 'c-nilgiri', 'EN19', 'B', 'Released', -61, 'Shafts', 2.4],
  ['NH-GL-040', 'Gland nut', 'c-nilgiri', 'C45', 'A', 'Released', -61, 'Bushes', 0.35],
  ['NH-MN-220', 'Manifold block', 'c-nilgiri', 'Al 6061-T6', 'B', 'Released', -28, 'Housings', 1.7],
  ['NH-CY-801', 'Cylinder base', 'c-nilgiri', 'EN8', 'A', 'Released', -200, 'Flanges', 1.9],
  ['NH-PL-330', 'Valve plate', 'c-nilgiri', 'EN8', 'B', 'In change', -3, 'Plates', 0.8],
  ['VRS-BR-771', 'Bogie sensor bracket', 'c-vayu', 'IS 2062', 'A', 'Released', -18, 'Brackets', 0.95],
  ['VRS-FL-340', 'Axle cover flange', 'c-vayu', 'C45', 'B', 'Released', -48, 'Flanges', 3.2],
  ['VRS-BR-760', 'Cable cleat bracket', 'c-vayu', 'SS304', 'A', 'Released', -130, 'Brackets', 0.26],
  ['VRS-PN-150', 'Brake lever pin', 'c-vayu', 'EN8', 'C', 'Obsolete', -300, 'Pins', 0.12],
  ['DMD-HS-021', 'Handpiece housing', 'c-deccan', 'SS304', 'E', 'Released', -14, 'Housings', 0.11],
  ['DMD-SP-008', 'Spindle, miniature', 'c-deccan', 'SS304', 'B', 'Released', -75, 'Shafts', 0.04],
  ['SAT-PN-044', 'Pivot pin, hardened', 'c-sahyadri', 'EN8', 'B', 'Released', -9, 'Pins', 0.22],
  ['SAT-BS-017', 'Bush, flanged', 'c-sahyadri', 'C45', 'A', 'Released', -9, 'Bushes', 0.15],
  ['SAT-BR-090', 'Tine bracket', 'c-sahyadri', 'IS 2062', 'C', 'Released', -56, 'Brackets', 0.62],
  ['SAT-SH-201', 'Gearbox input shaft', 'c-sahyadri', 'EN19', 'B', 'Released', -88, 'Shafts', 1.25],
  ['KPG-SH-310', 'Governor shaft', 'c-konark', 'EN24', 'D', 'Released', -5, 'Shafts', 3.1],
  ['KPG-CP-118', 'Coupling half', 'c-konark', 'EN19', 'C', 'Released', -110, 'Flanges', 4.4],
  ['KPG-FL-090', 'Turbine seal flange', 'c-konark', 'SS316', 'B', 'Released', -150, 'Flanges', 1.3],
]

const CUSTOM_REVS: Record<string, Revision[]> = {
  'KA-7731-SH': [
    { rev: 'A', date: daysFromToday(-420), by: 'V. Joshi', change: 'Initial release.' },
    { rev: 'B', date: daysFromToday(-190), by: 'V. Joshi', change: 'Flange holes changed 4× Ø6.4 → Ø6.6; added M8 tapped hole on left end.' },
    { rev: 'C', date: daysFromToday(-44), by: 'V. Joshi', change: 'Ø30 journal tightened h7 → h6 with cylindricity 0.005; added Ø6 × 54 deep hole; keyway corner R0.25.', ecoId: 'ECO-26-014' },
  ],
  'TPV-FL-150': [
    { rev: 'A', date: daysFromToday(-360), by: 'K. Subramanian', change: 'Initial release.' },
    { rev: 'B', date: daysFromToday(-84), by: 'K. Subramanian', change: 'Added O-ring groove Ø76/Ø68 × 3 on raised face; RF finish Ra 1.6 → 0.8.' },
  ],
  'OEV-MB-220': [{ rev: 'A', date: daysFromToday(-22), by: 'R. Deshpande', change: 'Initial release; supersedes OEV-MB-210 with gussets and Ø32 bore.', ecoId: 'ECO-26-018' }],
}

const GENERIC_CHANGES = [
  'Initial release.',
  'Tolerance on main diameter tightened; chamfer sizes updated.',
  'Material specification clarified; surface finish note added.',
  'Hole pattern moved 2 mm for assembly clearance.',
  'Added part marking requirement; updated title block to new template.',
]

function revisionsFor(partNo: string, rev: string, updated: number): Revision[] {
  if (CUSTOM_REVS[partNo]) return CUSTOM_REVS[partNo]
  const count = rev.charCodeAt(0) - 64
  return Array.from({ length: count }, (_, i) => ({
    rev: String.fromCharCode(65 + i),
    date: daysFromToday(updated - (count - 1 - i) * 95),
    by: ['Design team', 'Customer ECN', 'Customer design'][i % 3],
    change: GENERIC_CHANGES[i % GENERIC_CHANGES.length],
  }))
}

const BOMS: Record<string, BomLine[]> = {
  'KA-7700-ASM': [
    { partNo: 'KA-7731-SH', qty: 1, unit: 'pcs', children: [{ partNo: 'EN19 Ø65 round bar', qty: 3.39, unit: 'kg' }] },
    {
      partNo: 'KA-7710-SUB',
      qty: 1,
      unit: 'pcs',
      children: [
        { partNo: 'KA-7711-HS', qty: 1, unit: 'pcs', children: [{ partNo: 'Al 6061-T6 plate 25 mm', qty: 1.4, unit: 'kg' }] },
        { partNo: 'KA-7712-BS', qty: 2, unit: 'pcs', children: [{ partNo: 'C45 Ø40 round bar', qty: 0.3, unit: 'kg' }] },
        { partNo: 'KA-7713-CL', qty: 1, unit: 'pcs', children: [{ partNo: 'Al 6061-T6 plate 12 mm', qty: 0.2, unit: 'kg' }] },
        { partNo: 'Deep-groove ball bearing 6006-2RS (bought out)', qty: 2, unit: 'pcs' },
      ],
    },
    { partNo: 'KA-7740-FL', qty: 1, unit: 'pcs', children: [{ partNo: 'Al 6061-T6 Ø110 round bar', qty: 1.1, unit: 'kg' }] },
    { partNo: 'Socket head cap screw M6×20 (bought out)', qty: 4, unit: 'pcs' },
  ],
  'KA-7710-SUB': [
    { partNo: 'KA-7711-HS', qty: 1, unit: 'pcs' },
    { partNo: 'KA-7712-BS', qty: 2, unit: 'pcs' },
    { partNo: 'KA-7713-CL', qty: 1, unit: 'pcs' },
    { partNo: 'Deep-groove ball bearing 6006-2RS (bought out)', qty: 2, unit: 'pcs' },
  ],
  'TPV-AS-300': [
    {
      partNo: 'TPV-AS-310',
      qty: 1,
      unit: 'pcs',
      children: [
        { partNo: 'TPV-BC-311', qty: 1, unit: 'pcs', children: [{ partNo: 'SS304 Ø120 round bar', qty: 2.6, unit: 'kg' }] },
        { partNo: 'TPV-BS-312', qty: 2, unit: 'pcs', children: [{ partNo: 'C45 Ø50 round bar', qty: 0.45, unit: 'kg' }] },
        { partNo: 'Mechanical seal 35 mm (bought out)', qty: 1, unit: 'set' },
      ],
    },
    { partNo: 'TPV-SH-075', qty: 1, unit: 'pcs', children: [{ partNo: 'SS316 Ø50 round bar', qty: 2.3, unit: 'kg' }] },
    { partNo: 'TPV-FL-150', qty: 1, unit: 'pcs', children: [{ partNo: 'SS316 Ø160 round bar', qty: 4.17, unit: 'kg' }] },
    { partNo: 'TPV-BR-320', qty: 1, unit: 'pcs', children: [{ partNo: 'IS 2062 plate 12 mm', qty: 2.1, unit: 'kg' }] },
    { partNo: 'Hex bolt M12×40 SS (bought out)', qty: 6, unit: 'pcs' },
  ],
  'TPV-AS-310': [
    { partNo: 'TPV-BC-311', qty: 1, unit: 'pcs' },
    { partNo: 'TPV-BS-312', qty: 2, unit: 'pcs' },
    { partNo: 'Mechanical seal 35 mm (bought out)', qty: 1, unit: 'set' },
  ],
}

function drawingFor(family: Family): string | undefined {
  if (family === 'Shafts' || family === 'Pins') return 'drw-shaft'
  if (family === 'Flanges' || family === 'Housings' || family === 'Bushes') return 'drw-flange'
  if (family === 'Brackets' || family === 'Plates') return 'drw-bracket'
  return undefined
}

export const parts: Part[] = rows.map(([partNo, description, customerId, material, revision, status, updated, family, weightKg]) => ({
  partNo,
  description,
  customerId,
  material,
  revision,
  status,
  updatedAt: daysFromToday(updated),
  family,
  weightKg,
  drawingId: drawingFor(family),
  revisions: revisionsFor(partNo, revision, updated),
  bom: BOMS[partNo],
  isAssembly: family === 'Assemblies',
}))

export const ecos: Eco[] = [
  {
    id: 'ECO-26-014', type: 'ECO', title: 'KA-7731-SH rev B → C: ground journal and deep hole', reason: 'Customer design change (bearing upgrade)', status: 'Implemented',
    requestedBy: 'u-anita', createdAt: daysFromToday(-60), affectedParts: ['KA-7731-SH', 'KA-7700-ASM'],
    description: 'Ø30 journal tightened to h6 with cylindricity 0.005 and Ra 0.4. Adds Ø6 × 54 deep hole for lubrication and R0.25 keyway corners. Routing gains Op 60 cylindrical grinding.',
    approvals: [
      { role: 'Estimator', userId: 'u-anita', decision: 'Approved', at: daysFromToday(-58) },
      { role: 'Planner', userId: 'u-farhan', decision: 'Approved', at: daysFromToday(-57) },
      { role: 'Quality', userId: 'u-lakshmi', decision: 'Approved', at: daysFromToday(-55) },
      { role: 'Owner', userId: 'u-ravi', decision: 'Approved', at: daysFromToday(-54) },
    ],
  },
  {
    id: 'ECR-26-021', type: 'ECR', title: 'TPV-FL-150: change O-ring groove for 70 × 3 O-ring', reason: 'Manufacturability (AI check flagged O-ring stretch)', status: 'Review',
    requestedBy: 'u-kiran', createdAt: daysFromToday(-2), affectedParts: ['TPV-FL-150', 'TPV-AS-300'],
    description: 'Groove ID Ø68 0/−0.1 gives marginal stretch at LMC. Proposal: Ø67.5 ±0.05. Awaiting Tarangi design confirmation.',
    approvals: [
      { role: 'Estimator', userId: 'u-kiran', decision: 'Approved', at: daysFromToday(-2) },
      { role: 'Quality', userId: 'u-lakshmi', decision: 'Pending' },
      { role: 'Owner', userId: 'u-ravi', decision: 'Pending' },
    ],
  },
  {
    id: 'ECO-26-018', type: 'ECO', title: 'OEV-MB-210 superseded by OEV-MB-220', reason: 'New motor frame (customer)', status: 'Approved',
    requestedBy: 'u-kiran', createdAt: daysFromToday(-25), affectedParts: ['OEV-MB-210', 'OEV-MB-220'],
    description: 'MB-220 adds side gussets and a Ø32 H8 bore. MB-210 to be made obsolete once open order SO-26-0182 is shipped.',
    approvals: [
      { role: 'Estimator', userId: 'u-kiran', decision: 'Approved', at: daysFromToday(-24) },
      { role: 'Planner', userId: 'u-farhan', decision: 'Approved', at: daysFromToday(-23) },
      { role: 'Owner', userId: 'u-ravi', decision: 'Approved', at: daysFromToday(-22) },
    ],
  },
  {
    id: 'ECR-26-023', type: 'ECR', title: 'NH-PL-330: material EN8 → EN19 for wear life', reason: 'Field failure (customer return NCR-26-047)', status: 'Draft',
    requestedBy: 'u-lakshmi', createdAt: daysFromToday(-1), affectedParts: ['NH-PL-330'],
    description: 'Valve plate wear after 1,800 h. Propose EN19 hardened to 28–32 HRC. Cost impact +₹140/part.',
    approvals: [
      { role: 'Quality', userId: 'u-lakshmi', decision: 'Pending' },
      { role: 'Estimator', userId: 'u-anita', decision: 'Pending' },
      { role: 'Owner', userId: 'u-ravi', decision: 'Pending' },
    ],
  },
  {
    id: 'ECO-26-011', type: 'ECO', title: 'VRS-PN-150 made obsolete', reason: 'Customer discontinued brake lever variant', status: 'Implemented',
    requestedBy: 'u-anita', createdAt: daysFromToday(-120), affectedParts: ['VRS-PN-150'],
    description: 'No open orders. Remaining 40 pcs stock scrapped after customer approval.',
    approvals: [
      { role: 'Planner', userId: 'u-farhan', decision: 'Approved', at: daysFromToday(-119) },
      { role: 'Owner', userId: 'u-ravi', decision: 'Approved', at: daysFromToday(-118) },
    ],
  },
]
