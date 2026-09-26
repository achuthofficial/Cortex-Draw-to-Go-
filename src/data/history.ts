import { daysFromToday } from '@/lib/dates'
import type { Notification, WeeklyPoint } from './types'

// 12 weeks ending with the current week. AI quoting went live in week 5.
const raw: [rfqs: number, quotes: number, won: number, manual: number, ai: number, onTime: number, ppm: number, value: number][] = [
  [14, 11, 3, 3.4, 3.4, 86, 2150, 38.2],
  [16, 12, 4, 3.6, 3.6, 84, 2400, 41.5],
  [13, 11, 3, 3.3, 3.3, 88, 1980, 35.9],
  [15, 12, 4, 3.5, 3.5, 87, 2230, 44.1],
  [18, 16, 5, 3.4, 1.6, 89, 1810, 52.6],
  [17, 16, 6, 3.6, 1.1, 90, 1620, 57.8],
  [21, 20, 7, 3.5, 0.8, 88, 1740, 63.4],
  [19, 19, 7, 3.4, 0.6, 91, 1390, 61.2],
  [22, 22, 8, 3.5, 0.5, 92, 1210, 72.5],
  [24, 23, 9, 3.6, 0.45, 90, 1330, 78.9],
  [23, 23, 9, 3.5, 0.4, 93, 980, 76.3],
  [25, 22, 8, 3.5, 0.35, 92, 1050, 69.8],
]

export const weeklyHistory: WeeklyPoint[] = raw.map(([rfqs, quotes, won, manualHours, aiHours, onTimePct, ppm, value], i) => ({
  week: `W${27 + i}`,
  rfqs,
  quotes,
  won,
  winRate: Math.round((won / quotes) * 100),
  manualHours,
  aiHours,
  onTimePct,
  ppm,
  quotedValue: value * 1e5,
}))

export const funnel = [
  { stage: 'RFQs received', value: 247 },
  { stage: 'Quoted', value: 209 },
  { stage: 'Shortlisted', value: 121 },
  { stage: 'Won', value: 73 },
  { stage: 'Orders shipped', value: 64 },
]

export const winLossByCustomer = [
  { customer: 'Kestrel', won: 14, lost: 5 },
  { customer: 'Orbitra', won: 12, lost: 6 },
  { customer: 'Tarangi', won: 11, lost: 4 },
  { customer: 'Nilgiri', won: 9, lost: 8 },
  { customer: 'Vayu', won: 7, lost: 7 },
  { customer: 'Sahyadri', won: 10, lost: 3 },
  { customer: 'Deccan Med', won: 5, lost: 4 },
  { customer: 'Konark', won: 5, lost: 6 },
]

export const lossReasons = [
  { reason: 'Price', value: 21 },
  { reason: 'Lead time', value: 11 },
  { reason: 'Capability', value: 4 },
  { reason: 'No response', value: 7 },
]

export const estimatorProductivity = [
  { name: 'Anita Rao', quotesPerWeek: 11.5, avgMinutes: 21, winRate: 38 },
  { name: 'Kiran Patil', quotesPerWeek: 9.8, avgMinutes: 26, winRate: 33 },
  { name: 'Ravi Menon', quotesPerWeek: 1.2, avgMinutes: 48, winRate: 45 },
]

export const marginByFamily = [
  { family: 'Shafts', margin: 21.4 },
  { family: 'Flanges', margin: 17.8 },
  { family: 'Brackets', margin: 24.1 },
  { family: 'Housings', margin: 19.6 },
  { family: 'Pins', margin: 15.2 },
  { family: 'Bushes', margin: 13.9 },
  { family: 'Assemblies', margin: 18.5 },
]

export const machineUtilization = [
  { machine: 'Band Saw', util: 52 },
  { machine: 'TC 1', util: 84 },
  { machine: 'TC 2', util: 71 },
  { machine: 'VMC 1', util: 79 },
  { machine: 'VMC 2', util: 58 },
  { machine: 'VMC 3', util: 46 },
  { machine: '5-axis', util: 86 },
  { machine: 'Grinder', util: 68 },
  { machine: 'Wire EDM', util: 31 },
  { machine: 'CMM', util: 44 },
]

export const initialNotifications: Notification[] = [
  { id: 'nt-1', kind: 'machine', title: 'VMC 2 is down', body: 'Spindle drive alarm SP-9031. 3 jobs affected this week.', at: daysFromToday(-1, 16), read: false, link: '/production' },
  { id: 'nt-2', kind: 'ai', title: 'Extraction ready for review', body: 'RFQ-2026-0147 · KA-7731-SH rev C: 42 items extracted, 11 need review.', at: daysFromToday(0, 9), read: false, link: '/quotes/RFQ-2026-0147' },
  { id: 'nt-3', kind: 'rfq', title: 'New RFQ from Orbitra EV Motors', body: 'RFQ-2026-0149 · Motor mount bracket, 3 quantity breaks.', at: daysFromToday(0, 10), read: false, link: '/rfqs' },
  { id: 'nt-4', kind: 'quality', title: 'Gauge calibration overdue', body: 'G-BG-007 bore gauge and 2 others are past due.', at: daysFromToday(-1, 8), read: true, link: '/quality?tab=documents' },
  { id: 'nt-5', kind: 'order', title: 'SO-26-0174 ready to ship', body: 'Konark Power Gen · 8 × KPG-CP-118. Dispatch documents prepared.', at: daysFromToday(-1, 15), read: true, link: '/orders/SO-26-0174' },
]

export const aiInsights = [
  { id: 'ins-1', text: '3 open RFQs from Kestrel Aerodyne use EN19/EN24; Ironvale raised alloy steel prices 4% this week. Review material pricing before sending.', link: '/rfqs', tone: 'warning' as const },
  { id: 'ins-2', text: 'Quotes with a cylindrical-grinding operation have won 62% this quarter vs 34% overall. Your grinding rate may be under-priced.', link: '/reports', tone: 'info' as const },
  { id: 'ins-3', text: 'VMC 2 breakdown puts WO-26-0403, WO-26-0407 and WO-26-0410 at risk. A reschedule on VMC 3 keeps 2 of 3 on time.', link: '/production', tone: 'critical' as const },
  { id: 'ins-4', text: 'SS316 Ø160 bar (STK-012) covers only 1 of 2 open flange orders. Kavach PO-26-0310 is 1 day late.', link: '/inventory', tone: 'warning' as const },
  { id: 'ins-5', text: 'Tarangi has accepted 4 of the last 5 quotes within 2 days when lead time was under 21 days.', link: '/customers/c-tarangi', tone: 'info' as const },
]
