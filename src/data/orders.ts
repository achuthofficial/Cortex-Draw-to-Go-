import { daysFromToday } from '@/lib/dates'
import type { SalesOrder, ScheduleBlock, SoStatus, WoOperation, WoStatus, WorkOrder } from './types'

// ---------- Sales orders ----------

type SoRow = [
  id: string,
  customerId: string,
  po: string,
  lines: [partNo: string, description: string, qty: number, unitPrice: number, shipped: number][],
  ordered: number,
  promised: number,
  status: SoStatus,
  rfqId?: string,
  invoice?: SalesOrder['invoiceStatus'],
]

const soRows: SoRow[] = [
  ['SO-26-0171', 'c-nilgiri', 'NH/PO/26/1187', [['NH-RD-112', 'Piston rod', 120, 1840, 120]], -48, -12, 'Invoiced', undefined, 'Paid'],
  ['SO-26-0172', 'c-vayu', 'VRS-PO-44120', [['VRS-FL-340', 'Axle cover flange', 60, 3950, 60]], -45, -8, 'Shipped', undefined, 'Invoiced'],
  ['SO-26-0173', 'c-sahyadri', 'SAT/PO/2026/771', [['SAT-BR-090', 'Tine bracket', 1000, 298, 500]], -40, 6, 'In production', undefined, 'Partially invoiced'],
  ['SO-26-0174', 'c-konark', 'KPG/PO/7722', [['KPG-CP-118', 'Coupling half', 8, 9880, 0]], -36, 1, 'Ready to ship'],
  ['SO-26-0175', 'c-deccan', 'DMD-PO-1102', [['DMD-SP-008', 'Spindle, miniature', 50, 4240, 0]], -30, 5, 'In production'],
  ['SO-26-0176', 'c-orbitra', 'ORB/PO/26/5531', [['OEV-SH-104', 'Output shaft', 800, 1605, 200]], -22, 28, 'In production', 'RFQ-2026-0125', 'Partially invoiced'],
  ['SO-26-0177', 'c-nilgiri', 'NH/PO/26/1240', [['NH-CY-808', 'Cylinder end cap', 200, 1290, 0]], -20, 12, 'In production'],
  ['SO-26-0178', 'c-kestrel', 'KA-PO-26-3318', [['KA-7711-HS', 'Bearing housing', 90, 5540, 0]], -18, 4, 'In production', 'RFQ-2026-0128'],
  ['SO-26-0179', 'c-tarangi', 'TPV/PO/2026/219', [['TPV-IM-210', 'Impeller hub', 90, 2070, 0]], -16, 9, 'In production'],
  ['SO-26-0180', 'c-tarangi', 'TPV/PO/2026/224', [['TPV-SH-075', 'Pump shaft', 120, 6116, 0]], -14, 3, 'In production', 'RFQ-2026-0131'],
  ['SO-26-0181', 'c-kestrel', 'KA-PO-26-3350', [['KA-7740-FL', 'Actuator end flange', 60, 3420, 0]], -12, 10, 'In production'],
  ['SO-26-0182', 'c-orbitra', 'ORB/PO/26/5602', [['OEV-MB-210', 'Motor mount bracket', 500, 3150, 250]], -11, 2, 'In production', 'RFQ-2026-0133', 'Partially invoiced'],
  ['SO-26-0183', 'c-sahyadri', 'SAT/PO/2026/802', [['SAT-SH-201', 'Gearbox input shaft', 150, 2125, 0]], -8, 18, 'Confirmed'],
  ['SO-26-0184', 'c-kestrel', 'KA-PO-26-3391', [['KA-7725-PN', 'Hinge pin', 400, 715, 0]], -6, 2, 'In production', 'RFQ-2026-0136'],
  ['SO-26-0185', 'c-konark', 'KPG/PO/7741', [['KPG-FL-090', 'Turbine seal flange', 6, 16070, 0]], -3, 21, 'Confirmed'],
]

export const salesOrders: SalesOrder[] = soRows.map(([id, customerId, customerPo, lines, ordered, promised, status, rfqId, invoice]) => ({
  id,
  customerId,
  customerPo,
  orderDate: daysFromToday(ordered),
  promisedDate: daysFromToday(promised, 17),
  status,
  rfqId,
  quoteId: rfqId ? rfqId.replace('RFQ', 'Q') : undefined,
  lines: lines.map(([partNo, description, qty, unitPrice, shippedQty]) => ({ partNo, description, qty, unitPrice, shippedQty, deliveryDate: daysFromToday(promised, 17) })),
  invoiceStatus: invoice ?? 'Not invoiced',
  dispatches:
    lines[0][4] > 0
      ? [
          { id: `DC-${id.slice(3)}-1`, date: daysFromToday(promised - 14), qty: lines[0][4], docType: 'Delivery challan' },
          { id: `EWB-${id.slice(3)}-1`, date: daysFromToday(promised - 14), qty: lines[0][4], docType: 'E-way bill' },
          { id: `INV-${id.slice(3)}-1`, date: daysFromToday(promised - 14), qty: lines[0][4], docType: 'Tax invoice' },
        ]
      : [],
}))

// ---------- Routings ----------

export type RoutingTemplate = 'shaft' | 'flange' | 'bracket'

export const ROUTINGS: Record<RoutingTemplate, [opNo: number, name: string, workCenter: string, setupMin: number, cycleMin: number][]> = {
  shaft: [
    [10, 'Saw cut', 'm-saw', 10, 3],
    [20, 'CNC turning', 'm-tc1', 45, 12],
    [30, 'VMC milling', 'm-vmc1', 30, 6],
    [40, 'Cylindrical grinding', 'm-grind', 30, 5],
    [50, 'Deburr', 'wc-bench', 5, 3],
    [60, 'Final inspection', 'm-cmm', 20, 4],
  ],
  flange: [
    [10, 'Saw cut', 'm-saw', 10, 5],
    [20, 'CNC turning', 'm-tc2', 60, 16],
    [30, 'VMC drilling and tapping', 'm-vmc3', 35, 7],
    [40, 'Deburr', 'wc-bench', 5, 4],
    [50, 'Final inspection', 'm-cmm', 15, 5],
  ],
  bracket: [
    [10, 'Saw cut', 'm-saw', 10, 4],
    [20, 'VMC milling, setup 1', 'm-vmc2', 45, 20],
    [30, 'VMC milling, setup 2', 'm-vmc1', 35, 12],
    [40, '5-axis chamfers', 'm-5ax', 30, 6],
    [50, 'Deburr', 'wc-bench', 5, 5],
    [60, 'Final inspection', 'm-cmm', 15, 6],
  ],
}

type WoRow = [
  id: string,
  soId: string,
  partNo: string,
  qty: number,
  status: WoStatus,
  start: number,
  due: number,
  routing: RoutingTemplate,
  doneOps: number, // operations completed
  priority?: WorkOrder['priority'],
  overrides?: Record<number, string>,
  scrap?: number,
  atRisk?: boolean,
]

const woRows: WoRow[] = [
  ['WO-26-0390', 'SO-26-0171', 'NH-RD-112', 120, 'Completed', -30, -14, 'shaft', 6],
  ['WO-26-0391', 'SO-26-0172', 'VRS-FL-340', 60, 'Completed', -26, -10, 'flange', 5],
  ['WO-26-0392', 'SO-26-0173', 'SAT-BR-090', 500, 'Completed', -20, -3, 'bracket', 6, 'Normal', {}, 6],
  ['WO-26-0393', 'SO-26-0173', 'SAT-BR-090', 500, 'In progress', -6, 5, 'bracket', 3, 'Normal', {}, 3],
  ['WO-26-0394', 'SO-26-0174', 'KPG-CP-118', 8, 'Completed', -18, -2, 'flange', 5],
  ['WO-26-0395', 'SO-26-0175', 'DMD-SP-008', 50, 'In progress', -9, 4, 'shaft', 3, 'High', { 30: 'm-edm' }, 2],
  ['WO-26-0396', 'SO-26-0176', 'OEV-SH-104', 200, 'Completed', -16, -4, 'shaft', 6, 'Normal', {}, 3],
  ['WO-26-0397', 'SO-26-0176', 'OEV-SH-104', 200, 'In progress', -4, 6, 'shaft', 2, 'Normal', {}, 1],
  ['WO-26-0398', 'SO-26-0176', 'OEV-SH-104', 200, 'Released', 0, 14, 'shaft', 0],
  ['WO-26-0399', 'SO-26-0176', 'OEV-SH-104', 200, 'Planned', 8, 24, 'shaft', 0],
  ['WO-26-0400', 'SO-26-0177', 'NH-CY-808', 100, 'In progress', -3, 8, 'flange', 2],
  ['WO-26-0401', 'SO-26-0178', 'KA-7711-HS', 45, 'In progress', -5, 3, 'flange', 2, 'High', { 30: 'm-vmc1' }],
  ['WO-26-0402', 'SO-26-0179', 'TPV-IM-210', 45, 'In progress', -4, 6, 'flange', 1],
  ['WO-26-0403', 'SO-26-0180', 'TPV-SH-075', 40, 'In progress', -6, 2, 'shaft', 2, 'Urgent', { 30: 'm-vmc2' }, 0, true],
  ['WO-26-0404', 'SO-26-0180', 'TPV-SH-075', 40, 'Released', -1, 3, 'shaft', 1, 'High'],
  ['WO-26-0405', 'SO-26-0181', 'KA-7740-FL', 30, 'In progress', -2, 7, 'flange', 1, 'Normal', { 20: 'm-tc1' }],
  ['WO-26-0406', 'SO-26-0182', 'OEV-MB-210', 250, 'Completed', -12, -2, 'bracket', 6, 'Normal', {}, 4],
  ['WO-26-0407', 'SO-26-0182', 'OEV-MB-210', 250, 'In progress', -3, 2, 'bracket', 1, 'Urgent', {}, 0, true],
  ['WO-26-0408', 'SO-26-0183', 'SAT-SH-201', 75, 'Released', -3, 12, 'shaft', 1],
  ['WO-26-0409', 'SO-26-0184', 'KA-7725-PN', 150, 'In progress', -2, 2, 'shaft', 1, 'High', { 20: 'm-tc2' }],
  ['WO-26-0410', 'SO-26-0184', 'KA-7725-PN', 150, 'Released', -1, 2, 'shaft', 1, 'High', { 30: 'm-vmc2' }, 0, true],
  ['WO-26-0411', 'SO-26-0185', 'KPG-FL-090', 6, 'Planned', 2, 18, 'flange', 0],
  ['WO-26-0412', 'SO-26-0177', 'NH-CY-808', 60, 'Released', 0, 10, 'flange', 0],
  ['WO-26-0413', 'SO-26-0181', 'KA-7740-FL', 30, 'Planned', 3, 10, 'flange', 0],
  ['WO-26-0414', 'SO-26-0179', 'TPV-IM-210', 45, 'Planned', 2, 9, 'flange', 0],
  ['WO-26-0415', 'SO-26-0184', 'KA-7725-PN', 100, 'Planned', 3, 9, 'shaft', 0],
  ['WO-26-0416', 'SO-26-0178', 'KA-7711-HS', 45, 'Released', -2, 4, 'flange', 1, 'Normal', { 20: 'm-tc1', 30: 'm-vmc1' }],
  ['WO-26-0417', 'SO-26-0177', 'NH-CY-808', 40, 'Planned', 5, 12, 'flange', 0],
  ['WO-26-0418', 'SO-26-0180', 'TPV-SH-075', 40, 'Planned', 2, 3, 'shaft', 0, 'High'],
  ['WO-26-0419', 'SO-26-0183', 'SAT-SH-201', 75, 'Planned', 6, 18, 'shaft', 0],
]

export function buildOperations(routing: RoutingTemplate, qty: number, doneOps: number, overrides: Record<number, string> = {}, scrap = 0): WoOperation[] {
  return ROUTINGS[routing].map(([opNo, name, wc, setup, cycle], i) => {
    const planned = setup + cycle * qty
    const done = i < doneOps
    const running = i === doneOps && doneOps > 0
    const variance = [0.94, 1.08, 1.02, 0.97, 1.12, 0.99][i % 6]
    return {
      opNo,
      name,
      workCenter: overrides[opNo] ?? wc,
      plannedMin: planned,
      actualMin: done ? Math.round(planned * variance) : running ? Math.round(planned * 0.45) : 0,
      status: done ? 'Done' : running ? 'Running' : 'Pending',
      good: done ? qty - (i === 2 ? scrap : 0) : running ? Math.round(qty * 0.45) : 0,
      scrap: done && i === 2 ? scrap : 0,
    }
  })
}

export const workOrders: WorkOrder[] = woRows.map(([id, soId, partNo, qty, status, start, due, routing, doneOps, priority = 'Normal', overrides = {}, scrap = 0, atRisk]) => {
  const operations = buildOperations(routing, qty, doneOps, overrides, scrap)
  const last = operations.filter((o) => o.status === 'Done').at(-1)
  return {
    id,
    soId,
    partNo,
    qty,
    status,
    startDate: daysFromToday(start),
    dueDate: daysFromToday(due, 17),
    priority,
    operations,
    good: status === 'Completed' ? qty - scrap : last?.good ?? 0,
    scrap,
    atRisk,
  }
})

// ---------- Weekly schedule (Mon 21-Sep-2026 00:00 = hour 0) ----------

export const SCHEDULE_WEEK_START = '2026-09-21T00:00:00'
export const NOW_HOUR = 3 * 24 + 10.5
export const VMC2_DOWN_FROM = 64

type BlockRow = [woId: string, opNo: number, machineId: string, start: number, duration: number]

const blockRows: BlockRow[] = [
  ['WO-26-0408', 10, 'm-saw', 6, 4], ['WO-26-0404', 10, 'm-saw', 11, 3], ['WO-26-0416', 10, 'm-saw', 31, 3], ['WO-26-0398', 10, 'm-saw', 56, 4],
  ['WO-26-0412', 10, 'm-saw', 81, 4], ['WO-26-0419', 10, 'm-saw', 104, 3], ['WO-26-0411', 10, 'm-saw', 127, 2],
  ['WO-26-0397', 20, 'm-tc1', 6, 40], ['WO-26-0416', 20, 'm-tc1', 48, 18], ['WO-26-0405', 20, 'm-tc1', 72, 20], ['WO-26-0404', 20, 'm-tc1', 96, 12], ['WO-26-0408', 20, 'm-tc1', 110, 16],
  ['WO-26-0402', 20, 'm-tc2', 6, 30], ['WO-26-0400', 20, 'm-tc2', 40, 28], ['WO-26-0409', 20, 'm-tc2', 80, 26], ['WO-26-0413', 20, 'm-tc2', 110, 20],
  ['WO-26-0393', 30, 'm-vmc1', 6, 30], ['WO-26-0397', 30, 'm-vmc1', 48, 20], ['WO-26-0401', 30, 'm-vmc1', 70, 22], ['WO-26-0404', 30, 'm-vmc1', 110, 14],
  ['WO-26-0406', 20, 'm-vmc2', 6, 20], ['WO-26-0407', 20, 'm-vmc2', 76, 24], ['WO-26-0403', 30, 'm-vmc2', 102, 10], ['WO-26-0410', 30, 'm-vmc2', 114, 12],
  ['WO-26-0400', 30, 'm-vmc3', 70, 10], ['WO-26-0414', 30, 'm-vmc3', 120, 8],
  ['WO-26-0406', 40, 'm-5ax', 6, 24], ['WO-26-0393', 40, 'm-5ax', 62, 30], ['WO-26-0407', 40, 'm-5ax', 110, 10],
  ['WO-26-0395', 40, 'm-grind', 72, 16], ['WO-26-0397', 40, 'm-grind', 90, 16], ['WO-26-0403', 40, 'm-grind', 118, 8],
  ['WO-26-0395', 30, 'm-edm', 30, 12],
  ['WO-26-0396', 60, 'm-cmm', 20, 6], ['WO-26-0392', 60, 'm-cmm', 44, 8], ['WO-26-0394', 50, 'm-cmm', 58, 4], ['WO-26-0395', 60, 'm-cmm', 92, 4], ['WO-26-0401', 50, 'm-cmm', 98, 6], ['WO-26-0393', 60, 'm-cmm', 106, 8],
]

function blockLabel(woId: string, opNo: number) {
  const wo = workOrders.find((w) => w.id === woId)
  return `${woId.slice(3)} · Op ${opNo}${wo ? ` · ${wo.partNo}` : ''}`
}

export const scheduleBlocks: ScheduleBlock[] = blockRows.map(([woId, opNo, machineId, start, duration], i) => ({
  id: `blk-${i + 1}`,
  woId,
  opNo,
  machineId,
  start,
  duration,
  label: blockLabel(woId, opNo),
}))

/** Unavailable windows per machine (breakdowns and planned maintenance). */
export const machineDowntime: { machineId: string; start: number; end: number; reason: string; kind: 'Down' | 'Maintenance' }[] = [
  { machineId: 'm-vmc2', start: VMC2_DOWN_FROM, end: 122, reason: 'Spindle drive alarm SP-9031', kind: 'Down' },
  { machineId: 'm-edm', start: 78, end: 86, reason: 'Wire guide replacement', kind: 'Maintenance' },
]

/** Pre-built AI alternative for the VMC 2 breakdown: two of three jobs stay on time. */
export const vmc2Reschedule: { blockId: string; machineId: string; start: number; onTime: boolean; note: string }[] = [
  { blockId: 'blk-22', machineId: 'm-vmc3', start: 86, onTime: true, note: 'WO-26-0407 Op 20 moves to VMC 3 (idle) from Thu 14:00; 5-axis Op 40 still starts Fri 14:00.' },
  { blockId: 'blk-23', machineId: 'm-vmc3', start: 110, onTime: true, note: 'WO-26-0403 Op 30 moves to VMC 3 Fri 14:00; grinding shifts to Sat 08:00, ships Sat.' },
  { blockId: 'blk-24', machineId: 'm-vmc3', start: 128, onTime: false, note: 'WO-26-0410 Op 30 moves to VMC 3 Sat 08:00; finishes Sat 20:00, 1 day late vs promise.' },
]
export const vmc2GrindShift: { blockId: string; start: number } = { blockId: 'blk-32', start: 128 - 8 }
