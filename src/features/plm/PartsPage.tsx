import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, FolderOpen, GitCompare, Layers } from 'lucide-react'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { customerName, userName } from '@/data/core'
import type { Eco, Part } from '@/data/types'
import { formatDate } from '@/lib/format'
import { useSimulatedLoad } from '@/lib/hooks'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'

export function PartsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'library'
  const parts = useData((s) => s.parts)
  const ecos = useData((s) => s.ecos)
  const navigate = useNavigate()
  const openTab = useUi((s) => s.openTab)
  const { loading, error, retry } = useSimulatedLoad()

  const cols = useMemo<ColumnDef<Part>[]>(
    () => [
      {
        accessorKey: 'partNo',
        header: 'Part no.',
        size: 140,
        cell: (c) => (
          <span className="num inline-flex items-center gap-1.5 font-medium text-primary">
            {c.row.original.isAssembly && <Layers className="h-3.5 w-3.5" />}
            {c.getValue<string>()}
          </span>
        ),
      },
      { accessorKey: 'description', header: 'Description', size: 230 },
      { id: 'customer', accessorFn: (p) => customerName(p.customerId), header: 'Customer', size: 180 },
      { accessorKey: 'family', header: 'Family', size: 100 },
      { accessorKey: 'material', header: 'Material', size: 100, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { accessorKey: 'revision', header: 'Rev', size: 56, meta: { align: 'center' }, cell: (c) => <span className="num font-semibold">{c.getValue<string>()}</span> },
      { accessorKey: 'status', header: 'Status', size: 110, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { accessorKey: 'updatedAt', header: 'Last updated', size: 120, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
    ],
    [],
  )
  const ecoCols = useMemo<ColumnDef<Eco>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 110, cell: (c) => <span className="num font-medium text-primary">{c.getValue<string>()}</span> },
      { accessorKey: 'type', header: 'Type', size: 64 },
      { accessorKey: 'title', header: 'Title', size: 320 },
      { id: 'parts', accessorFn: (e) => e.affectedParts.join(', '), header: 'Affected parts', size: 200, cell: (c) => <span className="num text-xs">{c.getValue<string>()}</span> },
      { id: 'by', accessorFn: (e) => userName(e.requestedBy), header: 'Requested by', size: 130 },
      { accessorKey: 'createdAt', header: 'Created', size: 110, cell: (c) => <span className="num">{formatDate(c.getValue<string>())}</span> },
      { accessorKey: 'status', header: 'Status', size: 110, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
    ],
    [],
  )

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Parts and Drawings" description="Part master, drawing revisions, BOMs and engineering changes." />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 px-5">
          <TabsTrigger value="library">Part library <span className="num text-2xs text-muted-foreground">{parts.length}</span></TabsTrigger>
          <TabsTrigger value="eco">Engineering changes <span className="num text-2xs text-muted-foreground">{ecos.filter((e) => e.status !== 'Implemented').length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="min-h-0 flex-1">
          <DataTable
            className="h-full"
            data={parts}
            columns={cols}
            getRowId={(p) => p.partNo}
            loading={loading}
            error={error}
            onRetry={retry}
            onOpen={(p) => navigate(`/parts/${p.partNo}`)}
            searchPlaceholder="Search part no., description, customer…"
            rowActions={(p) => [
              { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/parts/${p.partNo}`) },
              { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `part:${p.partNo}`, kind: 'part', title: p.partNo, subtitle: `rev ${p.revision}`, path: `/parts/${p.partNo}` }) },
              { label: 'Compare revisions', icon: GitCompare, onSelect: () => navigate(`/parts/${p.partNo}/compare`) },
            ]}
            empty={{ title: 'No parts', description: 'Parts are created from won quotes or imported from your ERP.' }}
          />
        </TabsContent>
        <TabsContent value="eco" className="min-h-0 flex-1">
          <DataTable
            className="h-full"
            data={ecos}
            columns={ecoCols}
            getRowId={(e) => e.id}
            loading={loading}
            error={error}
            onRetry={retry}
            onOpen={(e) => navigate(`/eco/${e.id}`)}
            rowActions={(e) => [
              { label: 'Open', icon: FolderOpen, onSelect: () => navigate(`/eco/${e.id}`) },
              { label: 'Open in new tab', icon: ExternalLink, onSelect: () => openTab({ id: `eco:${e.id}`, kind: 'eco', title: e.id, path: `/eco/${e.id}` }) },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
