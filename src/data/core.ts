import type { Company, Customer, Machine, Material, MaterialCode, Supplier, User } from './types'

export const company: Company = {
  name: 'Precision Works (demo)',
  legalName: 'Precision Works Engineering Pvt. Ltd. (demo)',
  city: 'Hyderabad',
  address: 'Plot 42, Phase II, IDA Cherlapally, Hyderabad, Telangana 500051',
  gstin: '36AAHCP1234K1Z5',
  pan: 'AAHCP1234K',
  phone: '+91 40 2726 0000',
  email: 'sales@precisionworks.example',
  website: 'precisionworks.example',
  bank: 'Demo Bank, Cherlapally · A/c 000123456789 · IFSC DEMO0001234',
}

export const users: User[] = [
  { id: 'u-ravi', name: 'Ravi Menon', initials: 'RM', role: 'Owner', email: 'ravi@precisionworks.example' },
  { id: 'u-anita', name: 'Anita Rao', initials: 'AR', role: 'Estimator', email: 'anita@precisionworks.example' },
  { id: 'u-kiran', name: 'Kiran Patil', initials: 'KP', role: 'Estimator', email: 'kiran@precisionworks.example' },
  { id: 'u-farhan', name: 'Farhan Siddiqui', initials: 'FS', role: 'Planner', email: 'farhan@precisionworks.example' },
  { id: 'u-suresh', name: 'Suresh Kumar', initials: 'SK', role: 'Operator', email: 'suresh@precisionworks.example' },
  { id: 'u-lakshmi', name: 'Lakshmi Iyer', initials: 'LI', role: 'Quality', email: 'lakshmi@precisionworks.example' },
  { id: 'u-deepak', name: 'Deepak Verma', initials: 'DV', role: 'Operator', email: 'deepak@precisionworks.example' },
  { id: 'u-meera', name: 'Meera Nair', initials: 'MN', role: 'Viewer', email: 'meera@precisionworks.example' },
  { id: 'u-arjun', name: 'Arjun Reddy', initials: 'AJ', role: 'Operator', email: 'arjun@precisionworks.example' },
]

export const CURRENT_USER_ID = 'u-anita'

export const customers: Customer[] = [
  {
    id: 'c-kestrel', name: 'Kestrel Aerodyne', short: 'Kestrel', city: 'Bengaluru', industry: 'Aerospace', tier: 'Strategic',
    gstin: '29AAKCK4411M1Z2', paymentTerms: '45 days', since: '2019-06-01',
    contacts: [
      { name: 'Priya Shenoy', title: 'Sourcing Manager', email: 'priya.s@kestrel.example', phone: '+91 80 4100 2201' },
      { name: 'Vikram Joshi', title: 'Supplier Quality Engineer', email: 'vikram.j@kestrel.example', phone: '+91 80 4100 2234' },
    ],
  },
  {
    id: 'c-orbitra', name: 'Orbitra EV Motors', short: 'Orbitra', city: 'Pune', industry: 'Electric vehicles', tier: 'Strategic',
    gstin: '27AAECO7781Q1Z9', paymentTerms: '60 days', since: '2021-02-15',
    contacts: [
      { name: 'Sneha Kulkarni', title: 'Commodity Buyer', email: 'sneha.k@orbitra.example', phone: '+91 20 6700 1180' },
      { name: 'Rahul Deshpande', title: 'Design Engineer', email: 'rahul.d@orbitra.example', phone: '+91 20 6700 1192' },
    ],
  },
  {
    id: 'c-tarangi', name: 'Tarangi Pumps and Valves', short: 'Tarangi', city: 'Coimbatore', industry: 'Pumps and valves', tier: 'Key',
    gstin: '33AACCT2290H1Z4', paymentTerms: '45 days', since: '2017-09-10',
    contacts: [{ name: 'Karthik Subramanian', title: 'Purchase Head', email: 'karthik@tarangi.example', phone: '+91 422 255 0110' }],
  },
  {
    id: 'c-nilgiri', name: 'Nilgiri Hydraulics', short: 'Nilgiri', city: 'Chennai', industry: 'Hydraulics', tier: 'Key',
    gstin: '33AAFCN5512L1Z1', paymentTerms: '30 days', since: '2018-03-22',
    contacts: [{ name: 'Divya Raman', title: 'Buyer', email: 'divya.r@nilgiri.example', phone: '+91 44 2815 3300' }],
  },
  {
    id: 'c-vayu', name: 'Vayu Rail Systems', short: 'Vayu', city: 'Vadodara', industry: 'Rail', tier: 'Key',
    gstin: '24AADCV8834P1Z7', paymentTerms: '60 days', since: '2020-11-05',
    contacts: [{ name: 'Harsh Mehta', title: 'Procurement Lead', email: 'harsh.m@vayu.example', phone: '+91 265 233 4400' }],
  },
  {
    id: 'c-sahyadri', name: 'Sahyadri Agritech', short: 'Sahyadri', city: 'Nashik', industry: 'Agricultural machinery', tier: 'Standard',
    gstin: '27AAHCS6621D1Z3', paymentTerms: '30 days', since: '2022-07-18',
    contacts: [{ name: 'Nikhil Pawar', title: 'Purchase Executive', email: 'nikhil@sahyadri.example', phone: '+91 253 240 7711' }],
  },
  {
    id: 'c-deccan', name: 'Deccan Medtech Devices', short: 'Deccan Med', city: 'Hyderabad', industry: 'Medical devices', tier: 'Standard',
    gstin: '36AAGCD9901F1Z8', paymentTerms: '30 days', since: '2023-01-09',
    contacts: [{ name: 'Fatima Hussain', title: 'Supply Chain Manager', email: 'fatima.h@deccanmed.example', phone: '+91 40 6644 8800' }],
  },
  {
    id: 'c-konark', name: 'Konark Power Gen', short: 'Konark', city: 'Bhubaneswar', industry: 'Energy', tier: 'Standard',
    gstin: '21AAKCK3345B1Z6', paymentTerms: '45 days', since: '2021-08-30',
    contacts: [{ name: 'Sourav Mohanty', title: 'Buyer, Spares', email: 'sourav.m@konark.example', phone: '+91 674 230 5500' }],
  },
]

export const suppliers: Supplier[] = [
  {
    id: 's-ironvale', name: 'Ironvale Steels', city: 'Hyderabad', category: 'Raw material', materials: ['EN8', 'EN19', 'EN24', 'C45'],
    onTimePct: 94, rejectionPct: 0.6, rating: 'A',
    contact: { name: 'Mahesh Goud', title: 'Sales', email: 'mahesh@ironvale.example', phone: '+91 40 2345 1100' },
  },
  {
    id: 's-kavach', name: 'Kavach Alloys', city: 'Mumbai', category: 'Raw material', materials: ['SS304', 'SS316', 'Al 6061-T6'],
    onTimePct: 88, rejectionPct: 1.2, rating: 'B',
    contact: { name: 'Neha Shah', title: 'Key Accounts', email: 'neha@kavach.example', phone: '+91 22 4012 7788' },
  },
  {
    id: 's-agnikund', name: 'Agnikund Heat Treaters', city: 'Hyderabad', category: 'Heat treatment', materials: ['Hardening', 'Tempering', 'Nitriding'],
    onTimePct: 91, rejectionPct: 0.9, rating: 'A',
    contact: { name: 'Srinivas Rao', title: 'Plant Manager', email: 'srinivas@agnikund.example', phone: '+91 40 2711 5500' },
  },
  {
    id: 's-chamak', name: 'Chamak Surface Finishers', city: 'Secunderabad', category: 'Plating', materials: ['Black oxide', 'Zinc plating', 'Anodising'],
    onTimePct: 82, rejectionPct: 2.4, rating: 'B',
    contact: { name: 'Imran Khan', title: 'Proprietor', email: 'imran@chamak.example', phone: '+91 40 2780 3322' },
  },
  {
    id: 's-mapan', name: 'Mapan Tools and Metrology', city: 'Bengaluru', category: 'Tooling', materials: ['Carbide inserts', 'Drills', 'Gauge calibration'],
    onTimePct: 97, rejectionPct: 0.2, rating: 'A',
    contact: { name: 'Anil Hegde', title: 'Account Manager', email: 'anil@mapan.example', phone: '+91 80 2839 6600' },
  },
]

export const materials: Material[] = [
  { code: 'EN8', name: 'EN8 (080M40) medium carbon steel', density: 7.85, pricePerKg: 74, family: 'Carbon steel' },
  { code: 'EN19', name: 'EN19 (42CrMo4) alloy steel', density: 7.85, pricePerKg: 92, family: 'Alloy steel' },
  { code: 'EN24', name: 'EN24 (817M40) Ni-Cr-Mo alloy steel', density: 7.85, pricePerKg: 118, family: 'Alloy steel' },
  { code: 'C45', name: 'C45 carbon steel', density: 7.85, pricePerKg: 70, family: 'Carbon steel' },
  { code: 'SS304', name: 'Stainless steel 304', density: 7.93, pricePerKg: 245, family: 'Stainless' },
  { code: 'SS316', name: 'Stainless steel 316', density: 7.98, pricePerKg: 338, family: 'Stainless' },
  { code: 'Al 6061-T6', name: 'Aluminium 6061-T6', density: 2.7, pricePerKg: 312, family: 'Aluminium' },
  { code: 'IS 2062', name: 'IS 2062 E250 mild steel', density: 7.85, pricePerKg: 62, family: 'Mild steel' },
]

export function materialByCode(code: MaterialCode): Material {
  return materials.find((m) => m.code === code) ?? materials[0]
}

export const machines: Machine[] = [
  { id: 'm-saw', name: 'Band Saw', type: 'Saw', make: 'Bewo BS-350', hourlyRate: 450, maxPart: 'Ø300 bar', capabilities: ['Bar cut-off', 'Mitre'], state: 'Running', currentWoId: 'WO-26-0412', operatorId: 'u-arjun', utilization: 58, shifts: 2 },
  { id: 'm-tc1', name: 'CNC Turning Center 1', type: 'Turning', make: 'Ace LT-20', hourlyRate: 1100, maxPart: 'Ø320 × 500', capabilities: ['OD/ID turning', 'Threading', 'Grooving'], state: 'Running', currentWoId: 'WO-26-0405', operatorId: 'u-suresh', utilization: 82, shifts: 2 },
  { id: 'm-tc2', name: 'CNC Turning Center 2', type: 'Turning', make: 'Ace LT-25 LM', hourlyRate: 1250, maxPart: 'Ø400 × 650', capabilities: ['OD/ID turning', 'Live tooling', 'Threading'], state: 'Setup', currentWoId: 'WO-26-0409', operatorId: 'u-deepak', utilization: 64, shifts: 2 },
  { id: 'm-vmc1', name: 'VMC 1', type: 'VMC', make: 'BFW Surya 850', hourlyRate: 1200, maxPart: '850 × 500 × 500', capabilities: ['3-axis milling', 'Drilling', 'Tapping'], state: 'Running', currentWoId: 'WO-26-0401', operatorId: 'u-arjun', utilization: 76, shifts: 2 },
  { id: 'm-vmc2', name: 'VMC 2', type: 'VMC', make: 'BFW Surya 1000', hourlyRate: 1300, maxPart: '1000 × 550 × 550', capabilities: ['3-axis milling', 'Drilling', 'Tapping', '4th axis'], state: 'Down', utilization: 12, downReason: 'Spindle drive alarm SP-9031 · service engineer ETA 26-Sep', shifts: 2 },
  { id: 'm-vmc3', name: 'VMC 3', type: 'VMC', make: 'Jyoti RDX 20', hourlyRate: 1150, maxPart: '600 × 400 × 400', capabilities: ['3-axis milling', 'Drilling', 'Tapping'], state: 'Idle', utilization: 41, shifts: 2 },
  { id: 'm-5ax', name: '5-axis VMC', type: '5-axis', make: 'DMG Mori DMU 50', hourlyRate: 2600, maxPart: 'Ø500 × 380', capabilities: ['5-axis simultaneous', 'Complex surfaces'], state: 'Running', currentWoId: 'WO-26-0393', operatorId: 'u-deepak', utilization: 88, shifts: 3 },
  { id: 'm-grind', name: 'Cylindrical Grinder', type: 'Grinding', make: 'HMT K130', hourlyRate: 1400, maxPart: 'Ø280 × 1000', capabilities: ['OD grinding', 'Face grinding', 'IT5 tolerance'], state: 'Running', currentWoId: 'WO-26-0395', operatorId: 'u-suresh', utilization: 71, shifts: 2 },
  { id: 'm-edm', name: 'Wire EDM', type: 'EDM', make: 'Electronica Ecocut', hourlyRate: 1600, maxPart: '400 × 300 × 200', capabilities: ['Wire cutting', 'Keyways', 'Profiles'], state: 'Maintenance', utilization: 0, downReason: 'Planned: wire guide replacement until 14:00', shifts: 1 },
  { id: 'm-cmm', name: 'CMM', type: 'CMM', make: 'Accurate Spectra 7.5.5', hourlyRate: 1800, maxPart: '700 × 500 × 500', capabilities: ['3D inspection', 'GD&T evaluation', 'FAI'], state: 'Idle', operatorId: 'u-lakshmi', utilization: 36, shifts: 1 },
]

/** Non-machine work centres used in routings. */
export const workCenters: { id: string; name: string; hourlyRate: number }[] = [
  ...machines.map((m) => ({ id: m.id, name: m.name, hourlyRate: m.hourlyRate })),
  { id: 'wc-bench', name: 'Deburr bench', hourlyRate: 350 },
  { id: 'wc-outside', name: 'Outside processing', hourlyRate: 0 },
]

export function workCenterName(id: string): string {
  return workCenters.find((w) => w.id === id)?.name ?? id
}

export function workCenterRate(id: string): number {
  return workCenters.find((w) => w.id === id)?.hourlyRate ?? 0
}

export function customerName(id: string): string {
  return customers.find((c) => c.id === id)?.name ?? id
}

export function supplierName(id: string): string {
  return suppliers.find((s) => s.id === id)?.name ?? id
}

export function userName(id: string): string {
  return users.find((u) => u.id === id)?.name ?? id
}

export function userById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export const ALL_MATERIALS: MaterialCode[] = materials.map((m) => m.code)
