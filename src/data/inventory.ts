import { daysFromToday } from '@/lib/dates'
import type { PurchaseOrder, StockItem, StockStatus } from './types'

type Row = [id: string, material: StockItem['material'], form: StockItem['form'], size: string, unit: StockItem['unit'], onHand: number, reserved: number, reorder: number, location: string, received: number]

const rows: Row[] = [
  ['STK-001', 'EN19', 'Round bar', 'Ø65', 'kg', 142, 118, 150, 'Rack A-1', -12],
  ['STK-002', 'EN19', 'Round bar', 'Ø40', 'kg', 310, 96, 120, 'Rack A-2', -20],
  ['STK-003', 'EN19', 'Round bar', 'Ø90', 'kg', 0, 0, 80, 'Rack A-3', -61],
  ['STK-004', 'EN24', 'Round bar', 'Ø32', 'kg', 188, 64, 100, 'Rack A-4', -9],
  ['STK-005', 'EN24', 'Round bar', 'Ø100', 'kg', 96, 70, 90, 'Rack A-5', -33],
  ['STK-006', 'EN8', 'Round bar', 'Ø50', 'kg', 420, 180, 150, 'Rack B-1', -5],
  ['STK-007', 'EN8', 'Hex bar', 'A/F 36', 'kg', 75, 0, 60, 'Rack B-2', -44],
  ['STK-008', 'C45', 'Round bar', 'Ø40', 'kg', 58, 40, 80, 'Rack B-3', -27],
  ['STK-009', 'C45', 'Round bar', 'Ø120', 'kg', 260, 145, 120, 'Rack B-4', -15],
  ['STK-010', 'SS304', 'Round bar', 'Ø20', 'kg', 34, 12, 25, 'Rack C-1', -38],
  ['STK-011', 'SS304', 'Round bar', 'Ø120', 'kg', 140, 117, 100, 'Rack C-2', -18],
  ['STK-012', 'SS316', 'Round bar', 'Ø160', 'kg', 52, 48, 120, 'Rack C-3', -24],
  ['STK-013', 'SS316', 'Round bar', 'Ø50', 'kg', 210, 184, 90, 'Rack C-4', -8],
  ['STK-014', 'SS316', 'Tube', 'Ø76 × 8', 'kg', 0, 0, 30, 'Rack C-5', -90],
  ['STK-015', 'Al 6061-T6', 'Plate', '90 mm', 'kg', 380, 214, 200, 'Plate store P-1', -6],
  ['STK-016', 'Al 6061-T6', 'Plate', '25 mm', 'kg', 64, 60, 80, 'Plate store P-2', -41],
  ['STK-017', 'Al 6061-T6', 'Round bar', 'Ø110', 'kg', 120, 66, 60, 'Rack D-1', -22],
  ['STK-018', 'IS 2062', 'Plate', '12 mm', 'kg', 1450, 610, 600, 'Plate store P-3', -3],
  ['STK-019', 'IS 2062', 'Flat bar', '50 × 10', 'kg', 230, 0, 150, 'Rack E-1', -70],
  ['STK-020', 'EN19', 'Round bar', 'Ø25', 'kg', 44, 30, 60, 'Rack A-6', -52],
]

export const stockItems: StockItem[] = rows.map(([id, material, form, size, unit, onHand, reserved, reorderPoint, location, received]) => ({
  id,
  material,
  form,
  size,
  unit,
  onHand,
  reserved,
  reorderPoint,
  location,
  lastReceived: daysFromToday(received),
}))

export function stockStatus(s: StockItem): StockStatus {
  const available = s.onHand - s.reserved
  if (s.onHand <= 0 || available <= 0) return 'Out'
  if (available < s.reorderPoint) return 'Low'
  return 'OK'
}

export const purchaseOrders: PurchaseOrder[] = [
  { id: 'PO-26-0311', supplierId: 's-ironvale', orderDate: daysFromToday(-9), expectedDate: daysFromToday(2), status: 'Sent', lines: [{ item: 'EN19 Round bar Ø90', qty: 240, unit: 'kg', rate: 94, receivedQty: 0 }, { item: 'EN19 Round bar Ø25', qty: 120, unit: 'kg', rate: 95, receivedQty: 0 }] },
  { id: 'PO-26-0310', supplierId: 's-kavach', orderDate: daysFromToday(-12), expectedDate: daysFromToday(-1), status: 'Partially received', lines: [{ item: 'SS316 Round bar Ø160', qty: 300, unit: 'kg', rate: 338, receivedQty: 120 }, { item: 'SS316 Tube Ø76 × 8', qty: 60, unit: 'kg', rate: 412, receivedQty: 0 }] },
  { id: 'PO-26-0309', supplierId: 's-agnikund', orderDate: daysFromToday(-6), expectedDate: daysFromToday(1), status: 'Sent', lines: [{ item: 'H&T 28–32 HRC · WO-26-0397 (200 pcs)', qty: 200, unit: 'pcs', rate: 92, receivedQty: 0 }] },
  { id: 'PO-26-0308', supplierId: 's-chamak', orderDate: daysFromToday(-5), expectedDate: daysFromToday(0), status: 'Sent', lines: [{ item: 'Clear anodise · WO-26-0406 (250 pcs)', qty: 250, unit: 'pcs', rate: 82, receivedQty: 0 }] },
  { id: 'PO-26-0307', supplierId: 's-mapan', orderDate: daysFromToday(-14), expectedDate: daysFromToday(-7), status: 'Received', lines: [{ item: 'CNMG 120408 inserts (box of 10)', qty: 12, unit: 'box', rate: 4200, receivedQty: 12 }, { item: 'Ø6 carbide drill, long series', qty: 6, unit: 'pcs', rate: 3800, receivedQty: 6 }] },
  { id: 'PO-26-0306', supplierId: 's-ironvale', orderDate: daysFromToday(-20), expectedDate: daysFromToday(-12), status: 'Closed', lines: [{ item: 'EN19 Round bar Ø65', qty: 300, unit: 'kg', rate: 91, receivedQty: 300 }] },
  { id: 'PO-26-0305', supplierId: 's-kavach', orderDate: daysFromToday(-25), expectedDate: daysFromToday(-15), status: 'Received', lines: [{ item: 'Al 6061-T6 Plate 90 mm', qty: 400, unit: 'kg', rate: 305, receivedQty: 400 }] },
  { id: 'PO-26-0312', supplierId: 's-mapan', orderDate: daysFromToday(0), expectedDate: daysFromToday(10), status: 'Draft', lines: [{ item: 'Gauge calibration · 5 instruments', qty: 5, unit: 'pcs', rate: 1400, receivedQty: 0 }] },
]
