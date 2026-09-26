// Domain types shared by every module. IDs link records across modules.

export type Role = 'Owner' | 'Estimator' | 'Planner' | 'Operator' | 'Quality' | 'Viewer'

export interface User {
  id: string
  name: string
  initials: string
  role: Role
  email: string
}

export interface Company {
  name: string
  legalName: string
  city: string
  address: string
  gstin: string
  pan: string
  phone: string
  email: string
  website: string
  bank: string
}

export type CustomerTier = 'Strategic' | 'Key' | 'Standard'

export interface Contact {
  name: string
  title: string
  email: string
  phone: string
}

export interface Customer {
  id: string
  name: string
  short: string
  city: string
  industry: string
  tier: CustomerTier
  gstin: string
  paymentTerms: string
  contacts: Contact[]
  since: string
}

export interface Supplier {
  id: string
  name: string
  city: string
  category: 'Raw material' | 'Heat treatment' | 'Plating' | 'Tooling' | 'Calibration'
  materials: string[]
  onTimePct: number
  rejectionPct: number
  rating: 'A' | 'B' | 'C'
  contact: Contact
}

export type MaterialCode = 'EN8' | 'EN19' | 'EN24' | 'C45' | 'SS304' | 'SS316' | 'Al 6061-T6' | 'IS 2062'

export interface Material {
  code: MaterialCode
  name: string
  density: number // g/cm3
  pricePerKg: number // INR
  family: 'Alloy steel' | 'Carbon steel' | 'Stainless' | 'Aluminium' | 'Mild steel'
}

export type MachineState = 'Running' | 'Idle' | 'Setup' | 'Down' | 'Maintenance'

export interface Machine {
  id: string
  name: string
  type: 'Saw' | 'Turning' | 'VMC' | '5-axis' | 'Grinding' | 'EDM' | 'CMM'
  make: string
  hourlyRate: number
  maxPart: string
  capabilities: string[]
  state: MachineState
  currentWoId?: string
  operatorId?: string
  utilization: number // today, %
  downReason?: string
  shifts: 1 | 2 | 3
}

// ---------- Drawings and extraction ----------

export type Confidence = number // 0-100

export type ItemStatus = 'Pending' | 'Accepted' | 'Edited' | 'Flagged'

export type DimType = 'linear' | 'diameter' | 'radius' | 'angle' | 'thread' | 'chamfer'

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

/** Annotation geometry in view millimetres. The renderer derives SVG + overlay boxes from it. */
export type Annotation =
  | { kind: 'hdim'; view: string; x1: number; y1: number; x2: number; y2: number; at: number; tx?: number }
  | { kind: 'vdim'; view: string; x1: number; y1: number; x2: number; y2: number; at: number; ty?: number }
  | { kind: 'leader'; view: string; x: number; y: number; lx: number; ly: number }
  | { kind: 'text'; view: string; x: number; y: number }

export interface Dimension {
  id: string
  n: number
  view: string
  feature: string
  nominal: number
  upper: number
  lower: number
  type: DimType
  label: string // as printed on the drawing
  fit?: string
  confidence: Confidence
  status: ItemStatus
  anno: Annotation
  aiValue?: { nominal: number; upper: number; lower: number }
}

export type GdtSymbol =
  | 'straightness'
  | 'flatness'
  | 'circularity'
  | 'cylindricity'
  | 'lineProfile'
  | 'surfaceProfile'
  | 'angularity'
  | 'perpendicularity'
  | 'parallelism'
  | 'position'
  | 'concentricity'
  | 'symmetry'
  | 'circularRunout'
  | 'totalRunout'

export type MaterialModifier = 'MMC' | 'LMC' | 'RFS'

export interface GdtCallout {
  id: string
  n: number
  symbol: GdtSymbol
  tolerance: number
  diameterZone: boolean
  modifier: MaterialModifier
  datums: string[]
  feature: string
  view: string
  confidence: Confidence
  status: ItemStatus
  /** Frame top-left in sheet px; leader runs to feature point (px, py) in view mm. */
  frame: { x: number; y: number; view: string; px: number; py: number }
}

export interface Datum {
  id: string
  letter: 'A' | 'B' | 'C'
  feature: string
  view: string
  confidence: Confidence
  status: ItemStatus
  anno: { view: string; x: number; y: number; lx: number; ly: number }
}

export interface DrawingNote {
  id: string
  n: number
  text: string
  confidence: Confidence
  status: ItemStatus
}

export interface TitleBlock {
  partNo: string
  revision: string
  description: string
  material: MaterialCode
  materialSpec: string
  finish: string
  heatTreatment: string
  generalTolerance: string
  scale: string
  units: 'mm'
  sheet: string
  drawnBy: string
  date: string
  customer: string
  confidence: Confidence
}

export interface DrawingView {
  id: string
  label: string
  ox: number // sheet px
  oy: number
  scale: number // px per mm
  caption?: { x: number; y: number }
}

export type Primitive =
  | { t: 'poly'; view: string; pts: [number, number][]; closed?: boolean; style?: LineStyle }
  | { t: 'line'; view: string; a: [number, number]; b: [number, number]; style?: LineStyle }
  | { t: 'circle'; view: string; cx: number; cy: number; r: number; style?: LineStyle }
  | { t: 'arc'; view: string; cx: number; cy: number; r: number; a0: number; a1: number; style?: LineStyle }
  | { t: 'hatch'; view: string; pts: [number, number][] }
  | { t: 'label'; view: string; x: number; y: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end' }

export type LineStyle = 'outline' | 'hidden' | 'center' | 'thin' | 'phantom'

export type DrawingTemplate = 'shaft' | 'flange' | 'bracket'

export type CheckSeverity = 'Critical' | 'Warning' | 'Info'

export interface MfgCheck {
  id: string
  severity: CheckSeverity
  title: string
  detail: string
  impact: string
  refs: string[] // item ids
  resolved?: boolean
}

export interface StackupLink {
  label: string
  refId: string
  nominal: number
  tol: number // symmetric equivalent
  direction: 1 | -1
}

export interface Stackup {
  name: string
  requirement: { min: number; max: number }
  links: StackupLink[]
}

export interface Operation {
  id: string
  opNo: number
  name: string
  workCenter: string // machine id or work center code
  setupMin: number
  cycleMin: number
  tooling: string
  rationale: string
  outside?: { supplierId: string; costPerPart: number; leadDays: number }
}

export interface CostingInputs {
  stockShape: 'Round bar' | 'Plate' | 'Flat bar' | 'Forging'
  stockSize: string
  stockDia: number // mm (round) or width
  stockLength: number
  stockThk?: number
  stockWidth?: number
  material: MaterialCode
  ratePerKg: number
  scrapPct: number
  inspectionPerPart: number
  packagingPerPart: number
  overheadPct: number
  marginPct: number
  quantities: number[]
  primaryQty: number
}

export interface DrawingSpec {
  id: string
  template: DrawingTemplate
  sheet: { w: number; h: number }
  views: DrawingView[]
  geometry: Primitive[]
  titleBlock: TitleBlock
  dimensions: Dimension[]
  gdt: GdtCallout[]
  datums: Datum[]
  notes: DrawingNote[]
  checks: MfgCheck[]
  stackup: Stackup
  operations: Operation[]
  costing: CostingInputs
  lastQuoted: { quoteNo: string; date: string; unitPrice: number; qty: number; partNo: string; note: string }
  pages: number
}

// ---------- RFQs and quotes ----------

export type RfqStatus = 'New' | 'Extracting' | 'Needs review' | 'Costing' | 'Sent' | 'Won' | 'Lost'

export interface RfqPart {
  partNo: string
  description: string
  revision: string
  material: MaterialCode
  quantities: number[]
  drawingId: string
}

export interface Rfq {
  id: string
  customerId: string
  customerRef: string
  parts: RfqPart[]
  receivedAt: string
  dueAt: string
  status: RfqStatus
  estimatorId: string
  quotedValue?: number
  aiConfidence?: number
  notes?: string
  lostReason?: LostReason
  salesOrderId?: string
  archived?: boolean
  quoteMinutes?: number
}

export type LostReason = 'Price' | 'Lead time' | 'Capability' | 'No response'

export type QuoteStep = 'Upload' | 'Extract' | 'Review' | 'Plan' | 'Cost' | 'Send'

export interface QuoteVersion {
  version: number
  at: string
  by: string
  note: string
  total: number
}

export interface QuoteState {
  id: string // Q-...
  rfqId: string
  drawingId: string
  extracted: boolean
  dimensions: Dimension[]
  gdt: GdtCallout[]
  datums: Datum[]
  notes: DrawingNote[]
  titleBlock: TitleBlock
  checks: MfgCheck[]
  operations: Operation[]
  costing: CostingInputs
  versions: QuoteVersion[]
  sentAt?: string
  startedAt: string
}

// ---------- PLM ----------

export type PartStatus = 'Released' | 'In change' | 'Obsolete'

export interface Revision {
  rev: string
  date: string
  by: string
  change: string
  ecoId?: string
}

export interface BomLine {
  partNo: string
  qty: number
  unit: 'pcs' | 'kg' | 'm' | 'set'
  children?: BomLine[]
}

export interface Part {
  partNo: string
  description: string
  customerId: string
  material: MaterialCode
  revision: string
  status: PartStatus
  updatedAt: string
  family: 'Shafts' | 'Flanges' | 'Brackets' | 'Housings' | 'Bushes' | 'Pins' | 'Plates' | 'Assemblies'
  weightKg: number
  drawingId?: string
  revisions: Revision[]
  bom?: BomLine[]
  isAssembly?: boolean
}

export type EcoStatus = 'Draft' | 'Review' | 'Approved' | 'Implemented'

export interface Eco {
  id: string
  type: 'ECR' | 'ECO'
  title: string
  reason: string
  status: EcoStatus
  requestedBy: string
  createdAt: string
  affectedParts: string[]
  approvals: { role: Role; userId: string; decision: 'Pending' | 'Approved' | 'Rejected'; at?: string }[]
  description: string
}

// ---------- ERP ----------

export type SoStatus = 'Confirmed' | 'In production' | 'Ready to ship' | 'Shipped' | 'Invoiced'

export interface SoLine {
  partNo: string
  description: string
  qty: number
  unitPrice: number
  deliveryDate: string
  shippedQty: number
}

export interface SalesOrder {
  id: string
  customerId: string
  customerPo: string
  orderDate: string
  promisedDate: string
  status: SoStatus
  quoteId?: string
  rfqId?: string
  lines: SoLine[]
  invoiceStatus: 'Not invoiced' | 'Partially invoiced' | 'Invoiced' | 'Paid'
  dispatches: { id: string; date: string; qty: number; docType: 'Delivery challan' | 'E-way bill' | 'Tax invoice' | 'Packing list' }[]
}

export type WoStatus = 'Planned' | 'Released' | 'In progress' | 'On hold' | 'Completed'

export interface WoOperation {
  opNo: number
  name: string
  workCenter: string
  plannedMin: number
  actualMin: number
  status: 'Pending' | 'Running' | 'Done'
  good: number
  scrap: number
}

export interface WorkOrder {
  id: string
  soId: string
  partNo: string
  qty: number
  status: WoStatus
  dueDate: string
  startDate: string
  priority: 'Normal' | 'High' | 'Urgent'
  operations: WoOperation[]
  good: number
  scrap: number
  atRisk?: boolean
}

export interface ScheduleBlock {
  id: string
  woId: string
  opNo: number
  machineId: string
  start: number // hours from start of schedule week (Mon 00:00)
  duration: number // hours
  label: string
}

export type StockStatus = 'OK' | 'Low' | 'Out'

export interface StockItem {
  id: string
  material: MaterialCode
  form: 'Round bar' | 'Plate' | 'Flat bar' | 'Hex bar' | 'Tube'
  size: string
  unit: 'kg' | 'pcs'
  onHand: number
  reserved: number
  reorderPoint: number
  location: string
  lastReceived: string
}

export type PoStatus = 'Draft' | 'Sent' | 'Partially received' | 'Received' | 'Closed'

export interface PurchaseOrder {
  id: string
  supplierId: string
  orderDate: string
  expectedDate: string
  status: PoStatus
  lines: { item: string; qty: number; unit: string; rate: number; receivedQty: number }[]
}

// ---------- QMS ----------

export type Gauge = {
  id: string
  name: string
  type: 'Vernier' | 'Micrometer' | 'Height gauge' | 'Bore gauge' | 'Thread gauge' | 'CMM' | 'Surface roughness tester' | 'Dial indicator' | 'Plug gauge'
  range: string
  lastCal: string
  dueCal: string
  location: string
}

export interface Characteristic {
  balloon: number
  refId: string
  kind: 'dimension' | 'gdt' | 'note'
  characteristic: string
  nominal: string
  tolerance: string
  lsl?: number
  usl?: number
  method: 'Vernier' | 'Micrometer' | 'Height gauge' | 'CMM' | 'Bore gauge' | 'Thread gauge' | 'Visual' | 'Surface tester'
  frequency: string
  critical?: boolean
}

export interface InspectionPlan {
  id: string
  partNo: string
  revision: string
  drawingId: string
  createdAt: string
  status: 'Draft' | 'Approved'
  characteristics: Characteristic[]
  woId?: string
  sampleSize: number
  measurements: Record<number, (number | null)[]> // balloon -> per-sample values
}

export type NcrDisposition = 'Rework' | 'Scrap' | 'Use as is' | 'Return to supplier' | 'Pending'
export type NcrStatus = 'Open' | 'Under review' | 'Dispositioned' | 'Closed'

export interface Ncr {
  id: string
  partNo: string
  woId?: string
  supplierId?: string
  defect: string
  description: string
  qty: number
  disposition: NcrDisposition
  status: NcrStatus
  raisedBy: string
  raisedAt: string
  source: 'In-process' | 'Final inspection' | 'Incoming' | 'Customer return'
  capaId?: string
}

export type CapaStage = 'Open' | 'Root cause' | 'Action' | 'Verification' | 'Closed'

export interface Capa {
  id: string
  title: string
  ncrIds: string[]
  stage: CapaStage
  owner: string
  dueDate: string
  method: '5-Why' | '8D'
  whys: string[]
  actions: string[]
}

export interface ControlledDoc {
  id: string
  title: string
  type: 'Procedure' | 'Work instruction' | 'Form' | 'Manual'
  rev: string
  owner: string
  effective: string
  status: 'Effective' | 'In review' | 'Obsolete'
}

export interface Certification {
  name: string
  body: string
  certNo: string
  issued: string
  expires: string
}

// ---------- Misc ----------

export interface Notification {
  id: string
  title: string
  body: string
  at: string
  read: boolean
  kind: 'ai' | 'rfq' | 'machine' | 'quality' | 'order'
  link?: string
}

export interface WeeklyPoint {
  week: string
  rfqs: number
  quotes: number
  won: number
  winRate: number
  manualHours: number
  aiHours: number
  onTimePct: number
  ppm: number
  quotedValue: number
}
