import { daysFromToday } from '@/lib/dates'
import type { MaterialCode, Rfq, RfqStatus } from './types'

type Row = [
  id: string,
  customerId: string,
  customerRef: string,
  parts: [partNo: string, description: string, rev: string, material: MaterialCode, qty: number[], drawingId: string][],
  received: number,
  due: number,
  status: RfqStatus,
  estimator: string,
  value?: number,
  confidence?: number,
  extra?: Partial<Rfq>,
]

const rows: Row[] = [
  ['RFQ-2026-0149', 'c-orbitra', 'ORB/RFQ/2026/882', [['OEV-MB-220', 'Motor mount bracket', 'A', 'Al 6061-T6', [10, 100, 500], 'drw-bracket']], 0, 5, 'New', 'u-kiran', undefined, undefined, { notes: 'Prototype batch of 10 needed in 3 weeks; production 500/month from Q1.' }],
  ['RFQ-2026-0148', 'c-sahyadri', 'SAT-PR-1193', [['SAT-PN-044', 'Pivot pin, hardened', 'B', 'EN8', [200, 500], 'drw-shaft'], ['SAT-BS-017', 'Bush, flanged', 'A', 'C45', [200, 500], 'drw-flange']], 0, 6, 'New', 'u-anita'],
  ['RFQ-2026-0147', 'c-kestrel', 'KA-SRC-26-0419', [['KA-7731-SH', 'Drive shaft, flanged', 'C', 'EN19', [1, 10, 50, 100, 500], 'drw-shaft']], -2, 0, 'Needs review', 'u-anita', undefined, 91, { notes: 'Rev C adds ground journal and deep hole. First article (AS9102) required.', quoteMinutes: 14 }],
  ['RFQ-2026-0146', 'c-konark', 'KPG/SP/7721', [['KPG-SH-310', 'Governor shaft', 'D', 'EN24', [4, 12], 'drw-shaft']], -1, 3, 'Extracting', 'u-kiran'],
  ['RFQ-2026-0145', 'c-tarangi', 'TPV/PUR/2026/114', [['TPV-FL-150', 'Pump discharge flange', 'B', 'SS316', [10, 50, 100, 500], 'drw-flange']], -3, 1, 'Costing', 'u-kiran', 238500, 88, { quoteMinutes: 22 }],
  ['RFQ-2026-0144', 'c-nilgiri', 'NH-PO-REQ-5520', [['NH-CY-808', 'Cylinder end cap', 'C', 'EN8', [50, 200], 'drw-flange'], ['NH-RD-112', 'Piston rod', 'B', 'EN19', [50, 200], 'drw-shaft'], ['NH-GL-040', 'Gland nut', 'A', 'C45', [50, 200], 'drw-flange']], -3, 2, 'Needs review', 'u-anita', undefined, 84],
  ['RFQ-2026-0143', 'c-vayu', 'VRS/ENQ/0931', [['VRS-BR-771', 'Bogie sensor bracket', 'A', 'IS 2062', [40, 120], 'drw-bracket']], -4, -1, 'Needs review', 'u-kiran', undefined, 79],
  ['RFQ-2026-0142', 'c-deccan', 'DMD-Q-3310', [['DMD-HS-021', 'Handpiece housing', 'E', 'SS304', [25, 100], 'drw-flange']], -4, 4, 'Extracting', 'u-anita'],
  ['RFQ-2026-0141', 'c-kestrel', 'KA-SRC-26-0402', [['KA-7740-FL', 'Actuator end flange', 'A', 'Al 6061-T6', [20, 60], 'drw-flange'], ['KA-7742-BR', 'Sensor bracket', 'B', 'Al 6061-T6', [20, 60], 'drw-bracket']], -5, 2, 'Costing', 'u-anita', 412000, 93, { quoteMinutes: 31 }],
  ['RFQ-2026-0140', 'c-orbitra', 'ORB/RFQ/2026/861', [['OEV-SH-118', 'Rotor shaft stub', 'B', 'EN24', [100, 1000], 'drw-shaft']], -6, -2, 'Needs review', 'u-kiran', undefined, 86],
  ['RFQ-2026-0139', 'c-tarangi', 'TPV/PUR/2026/109', [['TPV-IM-210', 'Impeller hub', 'C', 'SS316', [30, 90], 'drw-flange']], -7, 3, 'Costing', 'u-kiran', 186400, 90, { quoteMinutes: 26 }],
  ['RFQ-2026-0138', 'c-sahyadri', 'SAT-PR-1180', [['SAT-BR-090', 'Tine bracket', 'C', 'IS 2062', [500, 2000], 'drw-bracket']], -8, -3, 'Sent', 'u-anita', 598000, 92, { quoteMinutes: 18 }],
  ['RFQ-2026-0137', 'c-nilgiri', 'NH-PO-REQ-5501', [['NH-MN-220', 'Manifold block', 'B', 'Al 6061-T6', [20, 80], 'drw-bracket']], -9, -4, 'Sent', 'u-kiran', 344800, 87, { quoteMinutes: 40 }],
  ['RFQ-2026-0136', 'c-kestrel', 'KA-SRC-26-0388', [['KA-7725-PN', 'Hinge pin', 'D', 'EN24', [100, 400], 'drw-shaft']], -10, -5, 'Won', 'u-anita', 286000, 95, { salesOrderId: 'SO-26-0184', quoteMinutes: 12 }],
  ['RFQ-2026-0135', 'c-vayu', 'VRS/ENQ/0917', [['VRS-FL-340', 'Axle cover flange', 'B', 'C45', [60, 240], 'drw-flange']], -11, -6, 'Sent', 'u-kiran', 472500, 89, { quoteMinutes: 21 }],
  ['RFQ-2026-0134', 'c-konark', 'KPG/SP/7702', [['KPG-CP-118', 'Coupling half', 'C', 'EN19', [8, 16], 'drw-flange']], -12, -7, 'Lost', 'u-anita', 158200, 90, { lostReason: 'Price', quoteMinutes: 25 }],
  ['RFQ-2026-0133', 'c-orbitra', 'ORB/RFQ/2026/840', [['OEV-MB-210', 'Motor mount bracket', 'C', 'Al 6061-T6', [100, 500], 'drw-bracket']], -14, -9, 'Won', 'u-kiran', 1575000, 94, { salesOrderId: 'SO-26-0182', quoteMinutes: 16 }],
  ['RFQ-2026-0132', 'c-deccan', 'DMD-Q-3288', [['DMD-SP-008', 'Spindle, miniature', 'B', 'SS304', [50], 'drw-shaft']], -15, -10, 'Sent', 'u-anita', 212300, 83, { quoteMinutes: 35 }],
  ['RFQ-2026-0131', 'c-tarangi', 'TPV/PUR/2026/098', [['TPV-SH-075', 'Pump shaft', 'D', 'SS316', [40, 120], 'drw-shaft']], -16, -11, 'Won', 'u-kiran', 734000, 91, { salesOrderId: 'SO-26-0180', quoteMinutes: 19 }],
  ['RFQ-2026-0130', 'c-nilgiri', 'NH-PO-REQ-5480', [['NH-CY-801', 'Cylinder base', 'A', 'EN8', [100], 'drw-flange']], -18, -13, 'Lost', 'u-anita', 265000, 88, { lostReason: 'Lead time', quoteMinutes: 28 }],
  ['RFQ-2026-0129', 'c-sahyadri', 'SAT-PR-1161', [['SAT-SH-201', 'Gearbox input shaft', 'B', 'EN19', [150], 'drw-shaft']], -19, -14, 'Sent', 'u-kiran', 318700, 90, { quoteMinutes: 17 }],
  ['RFQ-2026-0128', 'c-kestrel', 'KA-SRC-26-0371', [['KA-7711-HS', 'Bearing housing', 'B', 'Al 6061-T6', [30, 90], 'drw-flange']], -21, -16, 'Won', 'u-anita', 498600, 93, { salesOrderId: 'SO-26-0178', quoteMinutes: 23 }],
  ['RFQ-2026-0127', 'c-vayu', 'VRS/ENQ/0899', [['VRS-BR-760', 'Cable cleat bracket', 'A', 'SS304', [300], 'drw-bracket']], -23, -18, 'Lost', 'u-kiran', 402000, 85, { lostReason: 'Capability', quoteMinutes: 33 }],
  ['RFQ-2026-0126', 'c-konark', 'KPG/SP/7690', [['KPG-FL-090', 'Turbine seal flange', 'B', 'SS316', [6], 'drw-flange']], -25, -20, 'Sent', 'u-anita', 96400, 82, { quoteMinutes: 44 }],
  ['RFQ-2026-0125', 'c-orbitra', 'ORB/RFQ/2026/812', [['OEV-SH-104', 'Output shaft', 'A', 'EN19', [200, 800], 'drw-shaft']], -27, -22, 'Won', 'u-kiran', 1284000, 92, { salesOrderId: 'SO-26-0176', quoteMinutes: 20 }],
]

export const rfqs: Rfq[] = rows.map(([id, customerId, customerRef, parts, received, due, status, estimatorId, quotedValue, aiConfidence, extra]) => ({
  id,
  customerId,
  customerRef,
  parts: parts.map(([partNo, description, revision, material, quantities, drawingId]) => ({ partNo, description, revision, material, quantities, drawingId })),
  receivedAt: daysFromToday(received, 9 + (Math.abs(received) % 7)),
  dueAt: daysFromToday(due, 18),
  status,
  estimatorId,
  quotedValue,
  aiConfidence,
  ...extra,
}))

/** RFQs whose drawings have complete, hand-checked extraction data. */
export const DETAILED_RFQS = ['RFQ-2026-0147', 'RFQ-2026-0145', 'RFQ-2026-0149']
