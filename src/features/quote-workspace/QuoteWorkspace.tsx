import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Calculator, FileText, ListChecks, Route, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { DrawingViewer } from '@/components/common/DrawingViewer'
import { EmptyState } from '@/components/common/States'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isTyping } from '@/app/Shell'
import { useWorkspaceTab } from '@/app/useTab'
import type { ExtractKind } from '@/store/data'
import { costFor } from '@/lib/costing'
import { useData, useRates } from '@/store/data'
import { drawingForRfq, quoteIdFor } from '@/store/quote-factory'
import { ChecksTab } from './ChecksTab'
import { CostingTab } from './CostingTab'
import { ExtractionPending } from './ExtractionPending'
import { ExtractionTab } from './ExtractionTab'
import { PreviewTab } from './PreviewTab'
import { ProcessPlanTab } from './ProcessPlanTab'
import { reviewStats, WS_TABS, type WsTab } from './shared'
import { WorkspaceHeader } from './WorkspaceHeader'

export function QuoteWorkspace() {
  const { rfqId = '' } = useParams()
  const rfq = useData((s) => s.rfqs.find((r) => r.id === rfqId))
  const quote = useData((s) => s.quotes[quoteIdFor(rfqId)])
  const ensureQuote = useData((s) => s.ensureQuote)
  const undo = useData((s) => s.undoQuote)
  const setStatus = useData((s) => s.setItemStatus)
  const setRfqStatus = useData((s) => s.setRfqStatus)
  const rates = useRates()
  const [tab, setTab] = useState<WsTab>('extraction')
  const [visited, setVisited] = useState<Set<WsTab>>(new Set(['extraction']))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [balloons, setBalloons] = useState(false)

  useWorkspaceTab('quote', rfq ? rfqId : undefined, rfqId.replace('RFQ', 'Q'), rfq?.parts[0].partNo)

  useEffect(() => {
    if (rfq && !quote) ensureQuote(rfq.id)
  }, [rfq, quote, ensureQuote])

  // Reset local view state when switching between quotes.
  useEffect(() => {
    setTab(rfq && ['Sent', 'Won', 'Lost'].includes(rfq.status) ? 'preview' : rfq?.status === 'Costing' ? 'costing' : 'extraction')
    setSelectedId(null)
    setVisited(new Set(['extraction']))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId])

  const spec = useMemo(() => (rfq ? { ...drawingForRfq(rfq), titleBlock: quote?.titleBlock ?? drawingForRfq(rfq).titleBlock } : null), [rfq, quote?.titleBlock])
  const items = useMemo(
    () => (quote?.extracted ? { dimensions: quote.dimensions, gdt: quote.gdt, datums: quote.datums, notes: quote.notes, titleConfidence: quote.titleBlock.confidence } : undefined),
    [quote?.extracted, quote?.dimensions, quote?.gdt, quote?.datums, quote?.notes, quote?.titleBlock.confidence],
  )
  const total = quote ? costFor(quote.costing, quote.operations, quote.costing.primaryQty, rates).total : 0
  const stats = quote ? reviewStats(quote) : null

  // Moving from review to costing once everything is reviewed.
  useEffect(() => {
    if (rfq && stats?.done && rfq.status === 'Needs review') {
      setRfqStatus(rfq.id, 'Costing')
      toast.success('Review complete', { description: `All ${stats.total} items reviewed. RFQ moved to Costing.` })
    }
  }, [stats?.done, rfq, setRfqStatus, stats?.total])

  const goTab = useCallback((t: WsTab) => {
    setTab(t)
    setVisited((v) => new Set(v).add(t))
  }, [])

  // Queue for J/K navigation: pending/flagged first, lowest confidence first.
  const queue = useMemo(() => {
    if (!quote) return []
    const all: { id: string; kind: ExtractKind; status: string; confidence: number }[] = [
      ...quote.dimensions.map((d) => ({ id: d.id, kind: 'dimension' as const, status: d.status, confidence: d.confidence })),
      ...quote.gdt.map((d) => ({ id: d.id, kind: 'gdt' as const, status: d.status, confidence: d.confidence })),
      ...quote.datums.map((d) => ({ id: d.id, kind: 'datum' as const, status: d.status, confidence: d.confidence })),
      ...quote.notes.map((d) => ({ id: d.id, kind: 'note' as const, status: d.status, confidence: d.confidence })),
    ]
    const rank = (s: string) => (s === 'Flagged' ? 0 : s === 'Pending' ? 1 : 2)
    return all.sort((a, b) => rank(a.status) - rank(b.status) || a.confidence - b.confidence)
  }, [quote])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!quote) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (isTyping(e)) return
        e.preventDefault()
        if (undo(quote.id)) toast('Undid last edit')
        else toast('Nothing to undo')
        return
      }
      if (mod || e.altKey || isTyping(e) || document.querySelector('[role=dialog]')) return
      const k = e.key.toLowerCase()
      if (/^[1-5]$/.test(k)) {
        goTab(WS_TABS[+k - 1])
      } else if ((k === 'j' || k === 'k') && queue.length) {
        const idx = queue.findIndex((q) => q.id === selectedId)
        const next = k === 'j' ? (idx + 1) % queue.length : (idx - 1 + queue.length) % queue.length
        setSelectedId(queue[next].id)
        goTab('extraction')
      } else if ((k === 'a' || k === 'f') && selectedId) {
        const item = queue.find((q) => q.id === selectedId)
        if (!item) return
        setStatus(quote.id, item.kind, item.id, k === 'a' ? 'Accepted' : item.status === 'Flagged' ? 'Pending' : 'Flagged')
        if (k === 'a') {
          const nextPending = queue.find((q) => q.id !== item.id && (q.status === 'Pending' || q.status === 'Flagged'))
          if (nextPending) setSelectedId(nextPending.id)
        }
      } else if (k === 'escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [quote, undo, queue, selectedId, setStatus, goTab])

  if (!rfq) return <EmptyState title="RFQ not found" description={`${rfqId} does not exist or was deleted.`} />
  if (!quote || !spec) return null

  const sel = {
    selectedId,
    hoveredId,
    onSelect: (id: string | null) => {
      setSelectedId(id)
    },
    onHover: setHoveredId,
  }
  const openChecks = quote.checks.filter((c) => !c.resolved && c.severity === 'Critical').length

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader quote={quote} rfq={rfq} tab={tab} onTab={goTab} visited={visited} total={total} />
      <PanelGroup direction="horizontal" className="min-h-0 flex-1" autoSaveId={undefined}>
        <Panel defaultSize={46} minSize={28}>
          <DrawingViewer
            spec={spec}
            items={items}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={(id) => {
              setSelectedId(id)
              if (!id.endsWith('-title')) goTab('extraction')
            }}
            onHover={setHoveredId}
            balloons={balloons}
            onBalloonsChange={setBalloons}
          />
        </Panel>
        <PanelResizeHandle className="group relative w-1.5 bg-border transition-colors hover:bg-primary/40 data-[resize-handle-state=drag]:bg-primary focus-visible:bg-primary focus-visible:outline-none">
          <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/40 group-hover:bg-primary" />
        </PanelResizeHandle>
        <Panel defaultSize={54} minSize={32}>
          {!quote.extracted ? (
            <ExtractionPending quote={quote} rfq={rfq} />
          ) : (
            <Tabs value={tab} onValueChange={(v) => goTab(v as WsTab)} className="flex h-full flex-col">
              <TabsList className="shrink-0 overflow-x-auto scrollbar-none">
                <TabsTrigger value="extraction">
                  <ListChecks /> Extraction
                  {stats && stats.pending + stats.flagged > 0 && <span className="num rounded bg-amber-500/15 px-1 text-2xs text-amber-700 dark:text-amber-400">{stats.pending + stats.flagged}</span>}
                </TabsTrigger>
                <TabsTrigger value="checks">
                  <ShieldAlert /> Checks
                  {openChecks > 0 && <span className="num rounded bg-red-500/15 px-1 text-2xs text-red-700 dark:text-red-400">{openChecks}</span>}
                </TabsTrigger>
                <TabsTrigger value="plan">
                  <Route /> Process plan
                </TabsTrigger>
                <TabsTrigger value="costing">
                  <Calculator /> Costing
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <FileText /> Quote preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="extraction" className="min-h-0 flex-1">
                <ExtractionTab quote={quote} sel={sel} />
              </TabsContent>
              <TabsContent value="checks" className="min-h-0 flex-1">
                <ChecksTab quote={quote} spec={spec} sel={sel} />
              </TabsContent>
              <TabsContent value="plan" className="min-h-0 flex-1">
                <ProcessPlanTab quote={quote} />
              </TabsContent>
              <TabsContent value="costing" className="min-h-0 flex-1">
                <CostingTab quote={quote} spec={spec} rfq={rfq} />
              </TabsContent>
              <TabsContent value="preview" className="min-h-0 flex-1">
                <PreviewTab quote={quote} rfq={rfq} />
              </TabsContent>
            </Tabs>
          )}
        </Panel>
      </PanelGroup>
    </div>
  )
}
