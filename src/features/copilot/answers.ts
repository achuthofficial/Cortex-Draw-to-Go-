// Canned, context-aware Copilot answers built from the in-memory store.
import { getDrawing } from '@/data/drawings'
import { machineDowntime } from '@/data/orders'
import { costFor, operationCosts } from '@/lib/costing'
import { formatDate, formatINR, formatPct } from '@/lib/format'
import { diffDays } from '@/lib/dates'
import type { DataState } from '@/store/data'
import { quoteIdFor } from '@/store/quote-factory'

export interface CopilotContext {
  key: string
  label: string
  prompts: string[]
  rfqId?: string
}

export function contextFor(pathname: string): CopilotContext {
  const quote = pathname.match(/^\/quotes\/(.+)$/)
  if (quote)
    return {
      key: 'quote',
      label: `Quote Workspace · ${quote[1].replace('RFQ', 'Q')}`,
      rfqId: quote[1],
      prompts: ['Why is this quote 12% higher than the last one?', 'Which extracted items should I double-check?', 'How can I bring the price down?', 'Draft a technical query to the customer'],
    }
  if (pathname.startsWith('/production')) return { key: 'production', label: 'Production', prompts: ['Which jobs are at risk this week?', 'What if VMC 2 stays down until Monday?', 'Which machine has spare capacity?'] }
  if (pathname.startsWith('/rfqs')) return { key: 'rfqs', label: 'RFQs and Quotes', prompts: ['Which RFQs should I quote first today?', 'Which open RFQs use stainless steel?', 'Which jobs are at risk this week?'] }
  if (pathname.startsWith('/quality')) return { key: 'quality', label: 'Quality', prompts: ['Which gauges are overdue for calibration?', 'Summarise open NCRs', 'Which jobs are at risk this week?'] }
  if (pathname.startsWith('/inventory')) return { key: 'inventory', label: 'Inventory and Purchasing', prompts: ['What should I reorder this week?', 'Which POs are late?'] }
  if (pathname.startsWith('/orders')) return { key: 'orders', label: 'Orders', prompts: ['Which orders will miss their promised date?', 'Which jobs are at risk this week?'] }
  return { key: 'dashboard', label: 'Dashboard', prompts: ['Which jobs are at risk this week?', "Summarise today's priorities", 'Why is win rate up this quarter?'] }
}

export function answer(prompt: string, ctx: CopilotContext, s: DataState): string {
  const p = prompt.toLowerCase()
  if (p.includes('higher than the last') || p.includes('12%')) return quoteDelta(ctx, s)
  if (p.includes('double-check') || p.includes('double check')) return reviewAdvice(ctx, s)
  if (p.includes('price down') || p.includes('cheaper')) return priceDown(ctx, s)
  if (p.includes('technical query')) return techQuery(ctx, s)
  if (p.includes('at risk') || p.includes('miss their promised')) return atRisk(s)
  if (p.includes('vmc 2') || p.includes('monday')) return vmc2(s)
  if (p.includes('spare capacity')) return capacity(s)
  if (p.includes('quote first')) return quoteFirst(s)
  if (p.includes('stainless')) return stainless(s)
  if (p.includes('gauges')) return gauges(s)
  if (p.includes('ncr')) return ncrSummary(s)
  if (p.includes('reorder')) return reorder(s)
  if (p.includes('pos are late') || p.includes('late')) return latePos(s)
  if (p.includes('priorities')) return priorities(s)
  if (p.includes('win rate')) return winRate()
  return `I can only use the demo data in this prototype, so I don't have a specific answer for that. On the **${ctx.label}** screen I can help with:\n\n${ctx.prompts.map((x) => `- ${x}`).join('\n')}`
}

function quoteParts(ctx: CopilotContext, s: DataState) {
  const rfqId = ctx.rfqId ?? 'RFQ-2026-0147'
  const q = s.quotes[quoteIdFor(rfqId)]
  const rfq = s.rfqs.find((r) => r.id === rfqId)
  if (!q || !rfq) return null
  return { q, rfq, spec: getDrawing(q.drawingId) }
}

function quoteDelta(ctx: CopilotContext, s: DataState): string {
  const d = quoteParts(ctx, s)
  if (!d) return 'Open a quote first and I will compare it with the last similar quote.'
  const { q, spec } = d
  const qty = spec.lastQuoted.qty
  const now = costFor(q.costing, q.operations, qty)
  const last = spec.lastQuoted.unitPrice
  const diff = ((now.unitPrice - last) / last) * 100
  const ops = operationCosts(q.operations, qty)
  const grind = ops.find((o) => /grind/i.test(o.op.name))
  const drill = ops.find((o) => /drill/i.test(o.op.name))
  const lines = [
    `At **${qty} pcs** this quote is **${formatINR(now.unitPrice)}/pc** vs **${formatINR(last)}/pc** on ${spec.lastQuoted.quoteNo} (${formatDate(spec.lastQuoted.date)}, ${spec.lastQuoted.partNo}): **${diff >= 0 ? '+' : ''}${formatPct(diff, 1)}**.`,
    '',
    'Main drivers:',
  ]
  if (grind) lines.push(`- **Cylindrical grinding (Op ${grind.op.opNo})** is new: ${formatINR(grind.cost / qty)}/pc. Needed for Ø30 h6 with cylindricity 0.005 after heat treatment.`)
  if (drill) lines.push(`- **Deep drilling** Ø6 × 54 (9×D) adds peck cycles on Op ${drill.op.opNo}: ${formatINR(drill.cost / qty)}/pc in total for that operation.`)
  lines.push(`- **Material**: ${q.costing.material} at ₹${q.costing.ratePerKg}/kg, ${q.costing.scrapPct}% scrap (${formatINR(now.material / qty)}/pc).`)
  lines.push(q.costing.marginPct === 18 ? '- Margin is unchanged at 18%, so the increase is all cost.' : `- Margin is ${q.costing.marginPct}% vs 18% on the last quote.`)
  lines.push('', `Note from last quote: _${spec.lastQuoted.note}_`)
  return lines.join('\n')
}

function reviewAdvice(ctx: CopilotContext, s: DataState): string {
  const d = quoteParts(ctx, s)
  if (!d) return 'Open a quote to review its extraction.'
  const low = [...d.q.dimensions, ...d.q.gdt.map((g) => ({ ...g, label: g.feature }))].filter((x) => x.confidence < 70 && x.status !== 'Accepted')
  const flagged = d.q.dimensions.filter((x) => x.status === 'Flagged')
  const out = [`**${low.length} low-confidence** and **${flagged.length} flagged** items need attention:`, '']
  for (const x of flagged.slice(0, 4)) out.push(`- **#${x.n} ${x.label}** (${x.feature}) is part of a critical check: views disagree.`)
  for (const x of low.slice(0, 6)) out.push(`- **${'label' in x ? x.label : ''}**: ${x.confidence}% confidence. ${x.confidence < 65 ? 'Text overlaps a leader line; zoom in on the overlay.' : 'Check the tolerance sign.'}`)
  out.push('', 'Tip: press **J/K** to step through the review queue and **A** to accept.')
  return out.join('\n')
}

function priceDown(ctx: CopilotContext, s: DataState): string {
  const d = quoteParts(ctx, s)
  if (!d) return 'Open a quote first.'
  const { q } = d
  const qty = q.costing.primaryQty
  const c = costFor(q.costing, q.operations, qty)
  return [
    `Current price at ${qty} pcs: **${formatINR(c.unitPrice)}/pc**. Options, most impactful first:`,
    '',
    '- **Combine Op 30 and Op 40** on one VMC fixture: saves one setup (≈ ₹600 per batch) and 1 day of queue.',
    '- **Buy Ø63 bar instead of Ø65**: turning allowance is still 1.5 mm on Ø60 flange; saves ≈ 6% material.',
    `- **Drop margin to ${Math.max(10, q.costing.marginPct - 3)}%**: Kestrel is a Strategic account (tier margin 15%).`,
    '- **Batch heat treatment** with WO-26-0397 (EN19, same week) to split the furnace minimum charge.',
  ].join('\n')
}

function techQuery(ctx: CopilotContext, s: DataState): string {
  const d = quoteParts(ctx, s)
  if (!d) return 'Open a quote first.'
  const crit = d.q.checks.filter((c) => c.severity === 'Critical')
  return [
    `Here is a draft technical query for **${d.q.titleBlock.partNo} rev ${d.q.titleBlock.revision}**:`,
    '',
    `> Dear customer, while quoting ${d.rfq.customerRef} we noticed the following on drawing ${d.q.titleBlock.partNo} rev ${d.q.titleBlock.revision}:`,
    ...crit.map((c, i) => `> ${i + 1}. ${c.title}. ${c.detail}`),
    '> Could you please confirm the intended values? We will hold the quote validity until we hear from you.',
    '',
    'Copy it into the email from **Quote Preview → Send by email**.',
  ].join('\n')
}

function atRisk(s: DataState): string {
  const risky = s.workOrders.filter((w) => w.atRisk || (w.status !== 'Completed' && diffDays(w.dueDate) <= 2 && w.operations.some((o) => o.status === 'Pending')))
  const lines = [`**${risky.length} jobs** are at risk of late delivery this week:`, '']
  for (const w of risky.slice(0, 6)) {
    const pending = w.operations.filter((o) => o.status !== 'Done').length
    lines.push(`- **${w.id}** · ${w.partNo} × ${w.qty}: due ${formatDate(w.dueDate)}, ${pending} ops left${w.atRisk ? ' · waiting on **VMC 2** (down)' : ''}.`)
  }
  lines.push('', s.rescheduleApplied ? 'The VMC 2 reschedule is applied; WO-26-0410 is still 1 day late.' : 'Open **Production → Schedule** and apply the suggested reschedule to keep 2 of 3 VMC 2 jobs on time.')
  return lines.join('\n')
}

function vmc2(s: DataState): string {
  const down = machineDowntime.find((d) => d.machineId === 'm-vmc2')
  const blocks = s.blocks.filter((b) => b.machineId === 'm-vmc2' && down && b.start >= down.start)
  return [
    `VMC 2 has been down since Wed 16:00 (${down?.reason}). If it stays down until Monday:`,
    '',
    `- **${blocks.length} scheduled operations** on VMC 2 this week cannot run (${blocks.map((b) => b.woId).join(', ') || 'already moved'}).`,
    '- VMC 3 has ~38 h free capacity Thu–Sat; VMC 1 is 91% loaded.',
    '- **SO-26-0182** (Orbitra, 250 brackets) would slip 2 days unless Op 20 moves to VMC 3 today.',
    '- Consider a Saturday overtime shift on the 5-axis to recover Op 40.',
  ].join('\n')
}

function capacity(s: DataState): string {
  const load = s.machines.map((m) => {
    const h = s.blocks.filter((b) => b.machineId === m.id).reduce((a, b) => a + b.duration, 0)
    return { name: m.name, h, pct: Math.round((h / (6 * 16)) * 100) }
  })
  load.sort((a, b) => a.pct - b.pct)
  return ['Scheduled load this week (6 days × 16 h):', '', ...load.slice(0, 5).map((l) => `- **${l.name}**: ${l.h} h (${l.pct}%)`), '', 'VMC 3 and the Wire EDM have the most spare capacity.'].join('\n')
}

function quoteFirst(s: DataState): string {
  const open = s.rfqs.filter((r) => !r.archived && ['New', 'Extracting', 'Needs review', 'Costing'].includes(r.status)).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
  return ['Ranked by due date, customer tier and win probability:', '', ...open.slice(0, 5).map((r, i) => `${i + 1}. **${r.id}** · ${r.parts[0].partNo} · due ${formatDate(r.dueAt)}${diffDays(r.dueAt) < 0 ? ' (**overdue**)' : ''} · ${r.status}`)].join('\n')
}

function stainless(s: DataState): string {
  const list = s.rfqs.filter((r) => !r.archived && r.parts.some((p) => p.material.startsWith('SS')) && !['Won', 'Lost'].includes(r.status))
  return [`**${list.length} open RFQs** use SS304/SS316:`, '', ...list.map((r) => `- **${r.id}** · ${r.parts.map((p) => `${p.partNo} (${p.material})`).join(', ')} · ${r.status}`), '', 'SS316 Ø160 bar is low in stock; Kavach PO-26-0310 is 1 day late.'].join('\n')
}

function gauges(s: DataState): string {
  const overdue = s.gauges.filter((g) => diffDays(g.dueCal) < 0)
  const soon = s.gauges.filter((g) => diffDays(g.dueCal) >= 0 && diffDays(g.dueCal) <= 30)
  return [`**${overdue.length} gauges are overdue** and ${soon.length} are due within 30 days:`, '', ...overdue.map((g) => `- **${g.id}** ${g.name}: due ${formatDate(g.dueCal)} (${g.location})`), ...soon.map((g) => `- ${g.id} ${g.name}: due ${formatDate(g.dueCal)}`), '', 'PO-26-0312 to Mapan (draft) covers 5 calibrations.'].join('\n')
}

function ncrSummary(s: DataState): string {
  const open = s.ncrs.filter((n) => n.status !== 'Closed')
  return [`**${open.length} open NCRs**:`, '', ...open.map((n) => `- **${n.id}** · ${n.partNo}: ${n.defect} (${n.qty} pcs, ${n.source}) · ${n.disposition}`), '', 'Two are supplier-related (Kavach TC, Agnikund hardness history). Consider a supplier review for Kavach Alloys.'].join('\n')
}

function reorder(s: DataState): string {
  const low = s.stock.filter((i) => i.onHand - i.reserved < i.reorderPoint)
  return ['Items below reorder point after reservations:', '', ...low.slice(0, 7).map((i) => `- **${i.material} ${i.form} ${i.size}**: ${Math.max(0, i.onHand - i.reserved)} ${i.unit} available vs ${i.reorderPoint} reorder point`), '', 'Top suggestion: **order 180 kg EN19 Ø65 bar from Ironvale Steels**, which covers 4 open orders.'].join('\n')
}

function latePos(s: DataState): string {
  const late = s.purchaseOrders.filter((p) => !['Received', 'Closed', 'Draft'].includes(p.status) && diffDays(p.expectedDate) < 0)
  return late.length ? ['Late purchase orders:', '', ...late.map((p) => `- **${p.id}**: expected ${formatDate(p.expectedDate)} · ${p.status}`)].join('\n') : 'No purchase orders are late right now.'
}

function priorities(s: DataState): string {
  const dueToday = s.rfqs.filter((r) => diffDays(r.dueAt) === 0 && !['Sent', 'Won', 'Lost'].includes(r.status))
  return [
    "Today's priorities:",
    '',
    `- **Quotes due today**: ${dueToday.map((r) => r.id).join(', ') || 'none'}.`,
    '- **VMC 2 is down**: apply the suggested reschedule (keeps 2 of 3 jobs on time).',
    '- **NCR-26-050**: Kavach SS316 bar without mill certificate; blocks WO for TPV-FL-150.',
    '- **3 gauges overdue** for calibration; AS9100 audit is in 85 days.',
  ].join('\n')
}

function winRate(): string {
  return [
    'Win rate went from **27%** (W27–W30, manual quoting) to **38%** (W35–W38).',
    '',
    '- Quote turnaround fell from 3.5 h to under 30 min, so more quotes reach buyers before competitors.',
    '- Quotes sent within 24 h win 2.1× more often than those sent after 3 days.',
    '- Losses on price are flat; losses on lead time dropped from 9 to 4.',
  ].join('\n')
}
