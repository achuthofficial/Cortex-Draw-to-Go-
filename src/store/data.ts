import { useMemo } from 'react'
import { create } from 'zustand'
import { customers as seedCustomers, machines as seedMachines, materials as seedMaterials, suppliers as seedSuppliers, CURRENT_USER_ID } from '@/data/core'
import { drawings, getDrawing } from '@/data/drawings'
import { initialNotifications } from '@/data/history'
import { purchaseOrders as seedPos, stockItems as seedStock } from '@/data/inventory'
import { machineDowntime, salesOrders as seedSos, scheduleBlocks as seedBlocks, vmc2GrindShift, vmc2Reschedule, workOrders as seedWos, NOW_HOUR } from '@/data/orders'
import { ecos as seedEcos, parts as seedParts } from '@/data/parts'
import { capas as seedCapas, gauges as seedGauges, ncrs as seedNcrs } from '@/data/quality'
import { rfqs as seedRfqs } from '@/data/rfqs'
import type {
  Capa,
  CapaStage,
  CostingInputs,
  CustomerTier,
  Datum,
  Dimension,
  DrawingNote,
  Eco,
  GdtCallout,
  InspectionPlan,
  ItemStatus,
  LostReason,
  Machine,
  MachineState,
  Material,
  Ncr,
  Notification,
  Operation,
  Part,
  PurchaseOrder,
  QuoteState,
  Rfq,
  RfqStatus,
  SalesOrder,
  ScheduleBlock,
  SoStatus,
  StockItem,
  WorkOrder,
} from '@/data/types'
import { costFor, setPriceRounding } from '@/lib/costing'
import { daysFromToday, TODAY } from '@/lib/dates'
import { moveItem, uid } from '@/lib/utils'
import { buildPlan } from './inspection'
import { applyExtraction, createQuoteState, DEFAULT_AI_SETTINGS, drawingForRfq, quoteIdFor, type AiSettings } from './quote-factory'

export type ExtractKind = 'dimension' | 'gdt' | 'datum' | 'note'

export interface QuotingRules {
  defaultOverheadPct: number
  marginByTier: Record<CustomerTier, number>
  minOrderValue: number
  roundingTo: 1 | 10 | 100
  validityDays: number
}

const UNDO_LIMIT = 40

function seedQuotes(): Record<string, QuoteState> {
  const out: Record<string, QuoteState> = {}
  for (const r of seedRfqs) out[quoteIdFor(r.id)] = createQuoteState(r, DEFAULT_AI_SETTINGS)
  return out
}

function seedPlans(): InspectionPlan[] {
  const shaft = drawings['drw-shaft']
  const flange = drawings['drw-flange']
  const bracket = drawings['drw-bracket']
  return [
    buildPlan({ id: 'IP-26-028', spec: shaft, partNo: 'TPV-SH-075', revision: 'D', woId: 'WO-26-0403', createdAt: daysFromToday(-6), status: 'Approved', filled: 3, seed: 3, outOfTol: [5, 44] }),
    buildPlan({ id: 'IP-26-029', spec: flange, partNo: 'NH-CY-808', revision: 'C', woId: 'WO-26-0400', createdAt: daysFromToday(-3), status: 'Approved', filled: 2, seed: 11 }),
    buildPlan({ id: 'IP-26-030', spec: bracket, partNo: 'OEV-MB-210', revision: 'C', woId: 'WO-26-0407', createdAt: daysFromToday(-3), status: 'Draft', filled: 0, seed: 17 }),
  ]
}

function nextId(prefix: string, existing: string[], width = 4): string {
  const nums = existing.map((id) => parseInt(id.replace(/\D+/g, '').slice(-width), 10)).filter((n) => !Number.isNaN(n))
  const n = Math.max(0, ...nums) + 1
  return `${prefix}${String(n).padStart(width, '0')}`
}

export interface DataState {
  rfqs: Rfq[]
  quotes: Record<string, QuoteState>
  quoteUndo: Record<string, QuoteState[]>
  parts: Part[]
  ecos: Eco[]
  salesOrders: SalesOrder[]
  workOrders: WorkOrder[]
  blocks: ScheduleBlock[]
  rescheduleApplied: boolean
  machines: Machine[]
  stock: StockItem[]
  purchaseOrders: PurchaseOrder[]
  ncrs: Ncr[]
  capas: Capa[]
  plans: InspectionPlan[]
  gauges: typeof seedGauges
  materials: Material[]
  customers: typeof seedCustomers
  suppliers: typeof seedSuppliers
  notifications: Notification[]
  ai: AiSettings
  rules: QuotingRules
  aiQueries: number
  lastSavedAt: number

  // RFQs
  createRfq: (input: { customerId: string; files: string[]; quantities: number[]; dueAt: string; notes: string; template: 'shaft' | 'flange' | 'bracket' }) => string
  setRfqStatus: (id: string, status: RfqStatus) => void
  assignRfqs: (ids: string[], estimatorId: string) => void
  archiveRfqs: (ids: string[]) => void
  duplicateRfq: (id: string) => string

  // Quote workspace
  ensureQuote: (rfqId: string) => QuoteState
  completeExtraction: (quoteId: string) => void
  undoQuote: (quoteId: string) => boolean
  setItemStatus: (quoteId: string, kind: ExtractKind, id: string, status: ItemStatus) => void
  updateDimension: (quoteId: string, id: string, patch: Partial<Pick<Dimension, 'nominal' | 'upper' | 'lower' | 'type' | 'feature'>>) => void
  updateGdt: (quoteId: string, id: string, patch: Partial<Pick<GdtCallout, 'tolerance' | 'modifier' | 'datums' | 'feature'>>) => void
  updateDatum: (quoteId: string, id: string, patch: Partial<Pick<Datum, 'feature'>>) => void
  updateNote: (quoteId: string, id: string, patch: Partial<Pick<DrawingNote, 'text'>>) => void
  updateTitleBlock: (quoteId: string, patch: Partial<QuoteState['titleBlock']>) => void
  acceptHighConfidence: (quoteId: string) => number
  resolveCheck: (quoteId: string, checkId: string, resolved: boolean) => void
  reorderOps: (quoteId: string, from: number, to: number) => void
  updateOp: (quoteId: string, opId: string, patch: Partial<Operation>) => void
  addOp: (quoteId: string, afterIndex: number) => void
  deleteOp: (quoteId: string, opId: string) => void
  updateCosting: (quoteId: string, patch: Partial<CostingInputs>) => void
  saveVersion: (quoteId: string, note: string) => void
  restoreVersion: (quoteId: string, version: number) => void
  markSent: (quoteId: string) => void
  markWon: (quoteId: string) => { soId: string; woId: string; planId: string }
  markLost: (quoteId: string, reason: LostReason) => void

  // Orders
  setSoStatus: (id: string, status: SoStatus) => void

  // Production
  moveBlock: (blockId: string, machineId: string, start: number) => void
  applyReschedule: () => void
  setMachineState: (id: string, state: MachineState) => void
  woAction: (woId: string, action: 'start' | 'pause' | 'complete') => void
  recordQty: (woId: string, good: number, scrap: number) => void
  reportIssue: (woId: string, defect: string, description: string, qty: number) => string

  // Quality
  setMeasurement: (planId: string, balloon: number, sample: number, value: number | null) => void
  approvePlan: (planId: string) => void
  updateNcr: (id: string, patch: Partial<Ncr>) => void
  moveCapa: (id: string, stage: CapaStage) => void
  addCapaNote: (id: string, field: 'whys' | 'actions', text: string) => void

  // Inventory
  createPoFromSuggestion: () => string
  receivePo: (id: string) => void

  // PLM
  advanceEco: (id: string) => void

  // Settings
  setMaterialPrice: (code: Material['code'], price: number) => void
  setMachineRate: (id: string, rate: number) => void
  setAi: (patch: Partial<AiSettings>) => void
  setRules: (patch: Partial<QuotingRules>) => void

  // Misc
  markNotificationsRead: () => void
  addNotification: (n: Omit<Notification, 'id' | 'at' | 'read'>) => void
  bumpAi: () => void
}

export const useData = create<DataState>()((set, get) => {
  /** Apply an edit to a quote, recording an undo snapshot. */
  const mutateQuote = (quoteId: string, fn: (q: QuoteState) => QuoteState, record = true) => {
    const q = get().quotes[quoteId]
    if (!q) return
    const next = fn(q)
    if (next === q) return
    set((s) => ({
      quotes: { ...s.quotes, [quoteId]: next },
      quoteUndo: record ? { ...s.quoteUndo, [quoteId]: [...(s.quoteUndo[quoteId] ?? []), q].slice(-UNDO_LIMIT) } : s.quoteUndo,
      lastSavedAt: Date.now(),
    }))
  }

  const setItems = <K extends 'dimensions' | 'gdt' | 'datums' | 'notes'>(key: K, fn: (items: QuoteState[K]) => QuoteState[K]) => (q: QuoteState): QuoteState => ({
    ...q,
    [key]: fn(q[key]),
  })

  const kindKey: Record<ExtractKind, 'dimensions' | 'gdt' | 'datums' | 'notes'> = { dimension: 'dimensions', gdt: 'gdt', datum: 'datums', note: 'notes' }

  const touchRfq = (rfqId: string, patch: Partial<Rfq>) => set((s) => ({ rfqs: s.rfqs.map((r) => (r.id === rfqId ? { ...r, ...patch } : r)) }))

  const quoteTotal = (q: QuoteState) => costFor(q.costing, q.operations, q.costing.primaryQty).total

  return {
    rfqs: seedRfqs,
    quotes: seedQuotes(),
    quoteUndo: {},
    parts: seedParts,
    ecos: seedEcos,
    salesOrders: seedSos,
    workOrders: seedWos,
    blocks: seedBlocks,
    rescheduleApplied: false,
    machines: seedMachines,
    stock: seedStock,
    purchaseOrders: seedPos,
    ncrs: seedNcrs,
    capas: seedCapas,
    plans: seedPlans(),
    gauges: seedGauges,
    materials: seedMaterials,
    customers: seedCustomers,
    suppliers: seedSuppliers,
    notifications: initialNotifications,
    ai: DEFAULT_AI_SETTINGS,
    rules: { defaultOverheadPct: 15, marginByTier: { Strategic: 15, Key: 18, Standard: 22 }, minOrderValue: 15000, roundingTo: 1, validityDays: 30 },
    aiQueries: 1284,
    lastSavedAt: Date.now(),

    // ---------- RFQs ----------
    createRfq: ({ customerId, files, quantities, dueAt, notes, template }) => {
      const s = get()
      const id = nextId('RFQ-2026-', s.rfqs.map((r) => r.id))
      const drawingId = `drw-${template}`
      const spec = getDrawing(drawingId)
      const rfq: Rfq = {
        id,
        customerId,
        customerRef: `${files[0]?.replace(/\.[a-z]+$/i, '') ?? 'Email enquiry'}`,
        parts: [{ partNo: spec.titleBlock.partNo, description: spec.titleBlock.description, revision: spec.titleBlock.revision, material: spec.titleBlock.material, quantities, drawingId }],
        receivedAt: TODAY.toISOString(),
        dueAt,
        status: 'Extracting',
        estimatorId: CURRENT_USER_ID,
        notes,
      }
      const quote = createQuoteState(rfq, s.ai)
      set((st) => ({ rfqs: [rfq, ...st.rfqs], quotes: { ...st.quotes, [quote.id]: { ...quote, startedAt: new Date().toISOString() } }, lastSavedAt: Date.now() }))
      return id
    },
    setRfqStatus: (id, status) => touchRfq(id, { status }),
    assignRfqs: (ids, estimatorId) => set((s) => ({ rfqs: s.rfqs.map((r) => (ids.includes(r.id) ? { ...r, estimatorId } : r)), lastSavedAt: Date.now() })),
    archiveRfqs: (ids) => set((s) => ({ rfqs: s.rfqs.map((r) => (ids.includes(r.id) ? { ...r, archived: true } : r)) })),
    duplicateRfq: (id) => {
      const s = get()
      const src = s.rfqs.find((r) => r.id === id)
      if (!src) return id
      const newId = nextId('RFQ-2026-', s.rfqs.map((r) => r.id))
      const copy: Rfq = { ...src, id: newId, status: 'New', receivedAt: TODAY.toISOString(), quotedValue: undefined, salesOrderId: undefined, lostReason: undefined, archived: false }
      set((st) => ({ rfqs: [copy, ...st.rfqs], quotes: { ...st.quotes, [quoteIdFor(newId)]: createQuoteState(copy, st.ai) } }))
      return newId
    },

    // ---------- Quote workspace ----------
    ensureQuote: (rfqId) => {
      const qid = quoteIdFor(rfqId)
      const existing = get().quotes[qid]
      if (existing) return existing
      const rfq = get().rfqs.find((r) => r.id === rfqId)!
      const q = createQuoteState(rfq, get().ai)
      set((s) => ({ quotes: { ...s.quotes, [qid]: q } }))
      return q
    },
    completeExtraction: (quoteId) => {
      const q = get().quotes[quoteId]
      if (!q) return
      const rfq = get().rfqs.find((r) => r.id === q.rfqId)!
      const spec = drawingForRfq(rfq)
      mutateQuote(quoteId, (cur) => applyExtraction(cur, spec, get().ai), false)
      touchRfq(q.rfqId, { status: 'Needs review', aiConfidence: Math.round(spec.dimensions.reduce((a, d) => a + d.confidence, 0) / spec.dimensions.length) })
      set((s) => ({ aiQueries: s.aiQueries + 1 }))
    },
    undoQuote: (quoteId) => {
      const stack = get().quoteUndo[quoteId] ?? []
      if (!stack.length) return false
      const prev = stack[stack.length - 1]
      set((s) => ({ quotes: { ...s.quotes, [quoteId]: prev }, quoteUndo: { ...s.quoteUndo, [quoteId]: stack.slice(0, -1) }, lastSavedAt: Date.now() }))
      return true
    },
    setItemStatus: (quoteId, kind, id, status) =>
      mutateQuote(quoteId, (q) => {
        const key = kindKey[kind]
        return { ...q, [key]: (q[key] as { id: string; status: ItemStatus }[]).map((x) => (x.id === id ? { ...x, status } : x)) }
      }),
    updateDimension: (quoteId, id, patch) =>
      mutateQuote(
        quoteId,
        setItems('dimensions', (items) =>
          items.map((d) => (d.id === id ? { ...d, ...patch, status: 'Edited', aiValue: d.aiValue ?? { nominal: d.nominal, upper: d.upper, lower: d.lower } } : d)),
        ),
      ),
    updateGdt: (quoteId, id, patch) => mutateQuote(quoteId, setItems('gdt', (items) => items.map((g) => (g.id === id ? { ...g, ...patch, status: 'Edited' } : g)))),
    updateDatum: (quoteId, id, patch) => mutateQuote(quoteId, setItems('datums', (items) => items.map((d) => (d.id === id ? { ...d, ...patch, status: 'Edited' } : d)))),
    updateNote: (quoteId, id, patch) => mutateQuote(quoteId, setItems('notes', (items) => items.map((n) => (n.id === id ? { ...n, ...patch, status: 'Edited' } : n)))),
    updateTitleBlock: (quoteId, patch) => mutateQuote(quoteId, (q) => ({ ...q, titleBlock: { ...q.titleBlock, ...patch } })),
    acceptHighConfidence: (quoteId) => {
      let count = 0
      mutateQuote(quoteId, (q) => {
        const acc = <T extends { status: ItemStatus; confidence: number }>(x: T): T => {
          if (x.status === 'Pending' && x.confidence >= 90) {
            count++
            return { ...x, status: 'Accepted' }
          }
          return x
        }
        return { ...q, dimensions: q.dimensions.map(acc), gdt: q.gdt.map(acc), datums: q.datums.map(acc), notes: q.notes.map(acc) }
      })
      return count
    },
    resolveCheck: (quoteId, checkId, resolved) => mutateQuote(quoteId, (q) => ({ ...q, checks: q.checks.map((c) => (c.id === checkId ? { ...c, resolved } : c)) })),
    reorderOps: (quoteId, from, to) =>
      mutateQuote(quoteId, (q) => {
        const ops = moveItem(q.operations, from, to).map((o, i) => ({ ...o, opNo: (i + 1) * 10 }))
        return { ...q, operations: ops }
      }),
    updateOp: (quoteId, opId, patch) => mutateQuote(quoteId, (q) => ({ ...q, operations: q.operations.map((o) => (o.id === opId ? { ...o, ...patch } : o)) })),
    addOp: (quoteId, afterIndex) =>
      mutateQuote(quoteId, (q) => {
        const ops = q.operations.slice()
        ops.splice(afterIndex + 1, 0, { id: uid('op'), opNo: 0, name: 'New operation', workCenter: 'm-vmc3', setupMin: 20, cycleMin: 5, tooling: '', rationale: 'Added manually by estimator.' })
        return { ...q, operations: ops.map((o, i) => ({ ...o, opNo: (i + 1) * 10 })) }
      }),
    deleteOp: (quoteId, opId) => mutateQuote(quoteId, (q) => ({ ...q, operations: q.operations.filter((o) => o.id !== opId).map((o, i) => ({ ...o, opNo: (i + 1) * 10 })) })),
    updateCosting: (quoteId, patch) => mutateQuote(quoteId, (q) => ({ ...q, costing: { ...q.costing, ...patch } })),
    saveVersion: (quoteId, note) =>
      mutateQuote(
        quoteId,
        (q) => ({ ...q, versions: [...q.versions, { version: q.versions.length + 1, at: new Date().toISOString(), by: CURRENT_USER_ID, note, total: quoteTotal(q) }] }),
        false,
      ),
    restoreVersion: (quoteId, version) => {
      // Versions store totals only in this prototype; restoring re-applies the snapshot margin.
      const q = get().quotes[quoteId]
      const v = q?.versions.find((x) => x.version === version)
      if (!q || !v) return
      const current = quoteTotal(q)
      if (!current) return
      const ratio = v.total / current
      mutateQuote(quoteId, (cur) => ({ ...cur, costing: { ...cur.costing, marginPct: Math.max(0, Math.round(((1 + cur.costing.marginPct / 100) * ratio - 1) * 1000) / 10) } }))
    },
    markSent: (quoteId) => {
      const q = get().quotes[quoteId]
      if (!q) return
      mutateQuote(quoteId, (cur) => ({ ...cur, sentAt: new Date().toISOString() }), false)
      touchRfq(q.rfqId, { status: 'Sent', quotedValue: quoteTotal(q), quoteMinutes: Math.max(1, Math.round((Date.now() - new Date(q.startedAt).getTime()) / 60000)) || 14 })
    },
    markWon: (quoteId) => {
      const s = get()
      const q = s.quotes[quoteId]
      const rfq = s.rfqs.find((r) => r.id === q.rfqId)!
      const part = rfq.parts[0]
      const breakdown = costFor(q.costing, q.operations, q.costing.primaryQty)
      const soId = nextId('SO-26-', s.salesOrders.map((o) => o.id))
      const woId = nextId('WO-26-', s.workOrders.map((w) => w.id))
      const planId = nextId('IP-26-', s.plans.map((p) => p.id), 3)
      const promised = daysFromToday(breakdown.leadDays, 17)
      const so: SalesOrder = {
        id: soId,
        customerId: rfq.customerId,
        customerPo: `${rfq.customerRef}-PO`,
        orderDate: TODAY.toISOString(),
        promisedDate: promised,
        status: 'Confirmed',
        rfqId: rfq.id,
        quoteId,
        lines: [{ partNo: q.titleBlock.partNo, description: q.titleBlock.description, qty: q.costing.primaryQty, unitPrice: breakdown.unitPrice, deliveryDate: promised, shippedQty: 0 }],
        invoiceStatus: 'Not invoiced',
        dispatches: [],
      }
      const qty = q.costing.primaryQty
      const wo: WorkOrder = {
        id: woId,
        soId,
        partNo: q.titleBlock.partNo,
        qty,
        status: 'Released',
        startDate: TODAY.toISOString(),
        dueDate: daysFromToday(breakdown.leadDays - 1, 17),
        priority: 'High',
        good: 0,
        scrap: 0,
        operations: q.operations.map((o) => ({
          opNo: o.opNo,
          name: o.name,
          workCenter: o.workCenter,
          plannedMin: o.outside ? o.outside.leadDays * 8 * 60 : o.setupMin + o.cycleMin * qty,
          actualMin: 0,
          status: 'Pending',
          good: 0,
          scrap: 0,
        })),
      }
      // Place internal machine operations on the schedule, each after the previous op and after the machine's last job.
      const blocks = s.blocks.slice()
      let cursor = Math.ceil(NOW_HOUR + 2)
      for (const o of q.operations) {
        if (o.outside) {
          cursor += o.outside.leadDays * 8
          continue
        }
        if (!s.machines.some((m) => m.id === o.workCenter)) continue
        const duration = Math.max(1, Math.round(((o.setupMin + o.cycleMin * qty) / 60) * 2) / 2)
        // Earliest free slot on this machine at or after the previous operation.
        const busy = [
          ...blocks.filter((b) => b.machineId === o.workCenter).map((b) => [b.start, b.start + b.duration]),
          ...machineDowntime.filter((d) => d.machineId === o.workCenter).map((d) => [d.start, d.end]),
        ].sort((a, b) => a[0] - b[0])
        let start = cursor
        for (const [s0, s1] of busy) {
          if (start + duration <= s0) break
          if (start < s1) start = s1
        }
        blocks.push({ id: `blk-${uid()}`, woId, opNo: o.opNo, machineId: o.workCenter, start, duration, label: `${woId.slice(3)} · Op ${o.opNo} · ${q.titleBlock.partNo}` })
        cursor = start + duration
      }
      const spec = drawingForRfq(rfq)
      const plan = buildPlan({ id: planId, spec, partNo: q.titleBlock.partNo, revision: q.titleBlock.revision, woId, createdAt: TODAY.toISOString(), status: 'Draft', dimensions: q.dimensions, gdt: q.gdt })
      const partExists = s.parts.some((p) => p.partNo === part.partNo)
      const newPart: Part | null = partExists
        ? null
        : {
            partNo: part.partNo,
            description: part.description,
            customerId: rfq.customerId,
            material: part.material,
            revision: part.revision,
            status: 'Released',
            updatedAt: TODAY.toISOString(),
            family: spec.template === 'shaft' ? 'Shafts' : spec.template === 'flange' ? 'Flanges' : 'Brackets',
            weightKg: 1,
            drawingId: spec.id,
            revisions: [{ rev: part.revision, date: TODAY.toISOString(), by: 'Customer', change: 'Created from won quote.' }],
          }
      set((st) => ({
        salesOrders: [so, ...st.salesOrders],
        workOrders: [wo, ...st.workOrders],
        blocks,
        plans: [plan, ...st.plans],
        parts: newPart ? [newPart, ...st.parts] : st.parts,
        rfqs: st.rfqs.map((r) => (r.id === rfq.id ? { ...r, status: 'Won', salesOrderId: soId, quotedValue: breakdown.total } : r)),
        notifications: [
          { id: uid('nt'), kind: 'order', title: `${soId} created`, body: `${rfq.id} won · ${wo.id} released to Production, ${planId} drafted in Quality.`, at: new Date().toISOString(), read: false, link: `/orders/${soId}` },
          ...st.notifications,
        ],
        lastSavedAt: Date.now(),
      }))
      return { soId, woId, planId }
    },
    markLost: (quoteId, reason) => {
      const q = get().quotes[quoteId]
      if (!q) return
      touchRfq(q.rfqId, { status: 'Lost', lostReason: reason, quotedValue: quoteTotal(q) })
    },

    // ---------- Orders ----------
    setSoStatus: (id, status) =>
      set((s) => ({
        salesOrders: s.salesOrders.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                invoiceStatus: status === 'Invoiced' ? 'Invoiced' : o.invoiceStatus,
                lines: status === 'Shipped' || status === 'Invoiced' ? o.lines.map((l) => ({ ...l, shippedQty: l.qty })) : o.lines,
                dispatches:
                  status === 'Shipped' && o.dispatches.length === 0
                    ? [
                        { id: `DC-${id.slice(3)}-1`, date: TODAY.toISOString(), qty: o.lines[0].qty, docType: 'Delivery challan' },
                        { id: `EWB-${id.slice(3)}-1`, date: TODAY.toISOString(), qty: o.lines[0].qty, docType: 'E-way bill' },
                        { id: `PL-${id.slice(3)}-1`, date: TODAY.toISOString(), qty: o.lines[0].qty, docType: 'Packing list' },
                      ]
                    : o.dispatches,
              }
            : o,
        ),
        lastSavedAt: Date.now(),
      })),

    // ---------- Production ----------
    moveBlock: (blockId, machineId, start) =>
      set((s) => ({ blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, machineId, start: Math.max(0, Math.round(start * 2) / 2) } : b)), lastSavedAt: Date.now() })),
    applyReschedule: () =>
      set((s) => ({
        blocks: s.blocks.map((b) => {
          const r = vmc2Reschedule.find((x) => x.blockId === b.id)
          if (r) return { ...b, machineId: r.machineId, start: r.start }
          if (b.id === vmc2GrindShift.blockId) return { ...b, start: vmc2GrindShift.start }
          return b
        }),
        workOrders: s.workOrders.map((w) => (w.id === 'WO-26-0403' || w.id === 'WO-26-0407' ? { ...w, atRisk: false } : w)),
        rescheduleApplied: true,
        lastSavedAt: Date.now(),
      })),
    setMachineState: (id, state) => set((s) => ({ machines: s.machines.map((m) => (m.id === id ? { ...m, state } : m)) })),
    woAction: (woId, action) =>
      set((s) => ({
        workOrders: s.workOrders.map((w) => {
          if (w.id !== woId) return w
          const idx = w.operations.findIndex((o) => o.status !== 'Done')
          if (idx < 0) return w
          const ops = w.operations.map((o, i) => {
            if (i !== idx) return o
            if (action === 'start') return { ...o, status: 'Running' as const }
            if (action === 'pause') return { ...o, status: 'Pending' as const }
            return { ...o, status: 'Done' as const, actualMin: o.actualMin || o.plannedMin, good: o.good || w.qty }
          })
          const allDone = ops.every((o) => o.status === 'Done')
          const status = allDone ? 'Completed' : action === 'pause' ? 'On hold' : 'In progress'
          return { ...w, operations: ops, status }
        }),
        lastSavedAt: Date.now(),
      })),
    recordQty: (woId, good, scrap) =>
      set((s) => ({
        workOrders: s.workOrders.map((w) => {
          if (w.id !== woId) return w
          const idx = Math.max(0, w.operations.findIndex((o) => o.status === 'Running'))
          return {
            ...w,
            good: Math.min(w.qty, w.good + good),
            scrap: w.scrap + scrap,
            operations: w.operations.map((o, i) => (i === idx ? { ...o, good: Math.min(w.qty, o.good + good), scrap: o.scrap + scrap } : o)),
          }
        }),
        lastSavedAt: Date.now(),
      })),
    reportIssue: (woId, defect, description, qty) => {
      const s = get()
      const wo = s.workOrders.find((w) => w.id === woId)
      const id = nextId('NCR-26-', s.ncrs.map((n) => n.id), 3)
      const ncr: Ncr = { id, partNo: wo?.partNo ?? '', woId, defect, description, qty, disposition: 'Pending', status: 'Open', raisedBy: 'u-suresh', raisedAt: new Date().toISOString(), source: 'In-process' }
      set((st) => ({
        ncrs: [ncr, ...st.ncrs],
        notifications: [{ id: uid('nt'), kind: 'quality', title: `${id} raised from shop floor`, body: `${woId} · ${defect}`, at: new Date().toISOString(), read: false, link: `/quality/ncr/${id}` }, ...st.notifications],
      }))
      return id
    },

    // ---------- Quality ----------
    setMeasurement: (planId, balloon, sample, value) =>
      set((s) => ({
        plans: s.plans.map((p) => {
          if (p.id !== planId) return p
          const row = (p.measurements[balloon] ?? Array(p.sampleSize).fill(null)).slice()
          row[sample] = value
          return { ...p, measurements: { ...p.measurements, [balloon]: row } }
        }),
        lastSavedAt: Date.now(),
      })),
    approvePlan: (planId) => set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, status: 'Approved' } : p)) })),
    updateNcr: (id, patch) => set((s) => ({ ncrs: s.ncrs.map((n) => (n.id === id ? { ...n, ...patch } : n)), lastSavedAt: Date.now() })),
    moveCapa: (id, stage) => set((s) => ({ capas: s.capas.map((c) => (c.id === id ? { ...c, stage } : c)), lastSavedAt: Date.now() })),
    addCapaNote: (id, field, text) => set((s) => ({ capas: s.capas.map((c) => (c.id === id ? { ...c, [field]: [...c[field], text] } : c)) })),

    // ---------- Inventory ----------
    createPoFromSuggestion: () => {
      const s = get()
      const id = nextId('PO-26-', s.purchaseOrders.map((p) => p.id))
      const po: PurchaseOrder = {
        id,
        supplierId: 's-ironvale',
        orderDate: TODAY.toISOString(),
        expectedDate: daysFromToday(4),
        status: 'Sent',
        lines: [{ item: 'EN19 Round bar Ø65', qty: 180, unit: 'kg', rate: s.materials.find((m) => m.code === 'EN19')?.pricePerKg ?? 92, receivedQty: 0 }],
      }
      set((st) => ({ purchaseOrders: [po, ...st.purchaseOrders] }))
      return id
    },
    receivePo: (id) =>
      set((s) => {
        const po = s.purchaseOrders.find((p) => p.id === id)
        if (!po) return {}
        const stock = s.stock.map((item) => {
          const line = po.lines.find((l) => l.item.includes(item.material) && l.item.includes(item.size))
          return line ? { ...item, onHand: item.onHand + (line.qty - line.receivedQty), lastReceived: TODAY.toISOString() } : item
        })
        return {
          stock,
          purchaseOrders: s.purchaseOrders.map((p) => (p.id === id ? { ...p, status: 'Received', lines: p.lines.map((l) => ({ ...l, receivedQty: l.qty })) } : p)),
          lastSavedAt: Date.now(),
        }
      }),

    // ---------- PLM ----------
    advanceEco: (id) =>
      set((s) => ({
        ecos: s.ecos.map((e) => {
          if (e.id !== id) return e
          const order: Eco['status'][] = ['Draft', 'Review', 'Approved', 'Implemented']
          const next = order[Math.min(order.length - 1, order.indexOf(e.status) + 1)]
          const approvals = next === 'Approved' || next === 'Implemented' ? e.approvals.map((a) => ({ ...a, decision: 'Approved' as const, at: a.at ?? new Date().toISOString() })) : e.approvals
          return { ...e, status: next, approvals }
        }),
      })),

    // ---------- Settings ----------
    setMaterialPrice: (code, price) => set((s) => ({ materials: s.materials.map((m) => (m.code === code ? { ...m, pricePerKg: price } : m)) })),
    setMachineRate: (id, rate) => set((s) => ({ machines: s.machines.map((m) => (m.id === id ? { ...m, hourlyRate: rate } : m)) })),
    setAi: (patch) => set((s) => ({ ai: { ...s.ai, ...patch } })),
    setRules: (patch) => {
      if (patch.roundingTo) setPriceRounding(patch.roundingTo)
      set((s) => ({ rules: { ...s.rules, ...patch }, lastSavedAt: Date.now() }))
    },

    markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    addNotification: (n) => set((s) => ({ notifications: [{ ...n, id: uid('nt'), at: new Date().toISOString(), read: false }, ...s.notifications] })),
    bumpAi: () => set((s) => ({ aiQueries: s.aiQueries + 1 })),
  }
})

/** Hourly rates keyed by work centre, reflecting Settings edits. */
export function useRates(): Record<string, number> {
  const machines = useData((s) => s.machines)
  return useMemo(() => {
    const out: Record<string, number> = { 'wc-bench': 350, 'wc-outside': 0 }
    for (const m of machines) out[m.id] = m.hourlyRate
    return out
  }, [machines])
}

export { machineDowntime, quoteIdFor }
