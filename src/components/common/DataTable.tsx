import { useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { EmptyState, ErrorState, TableSkeleton } from './States'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right' | 'center'
    className?: string
    label?: string
  }
}

export interface RowAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect: () => void
  destructive?: boolean
  separatorBefore?: boolean
  shortcut?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  getRowId: (row: T) => string
  onOpen?: (row: T) => void
  rowActions?: (row: T) => RowAction[]
  selectable?: boolean
  onSelectionChange?: (rows: T[]) => void
  toolbar?: React.ReactNode
  bulkActions?: (rows: T[], clear: () => void) => React.ReactNode
  searchPlaceholder?: string
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  empty?: { title: string; description?: string; action?: React.ReactNode }
  initialSorting?: SortingState
  rowClassName?: (row: T) => string | undefined
  className?: string
  dense?: boolean
  footer?: React.ReactNode
  hideSearch?: boolean
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  onOpen,
  rowActions,
  selectable,
  onSelectionChange,
  toolbar,
  bulkActions,
  searchPlaceholder = 'Search…',
  loading,
  error,
  onRetry,
  empty,
  initialSorting = [],
  rowClassName,
  className,
  dense,
  footer,
  hideSearch,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [visibility, setVisibility] = useState<VisibilityState>({})
  const bodyRef = useRef<HTMLTableSectionElement>(null)

  const allColumns = useMemo<ColumnDef<T, any>[]>(() => {
    if (!selectable) return columns
    return [
      {
        id: '__select',
        size: 34,
        enableResizing: false,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows"
            checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false}
            onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} onClick={(e) => e.stopPropagation()} />
        ),
      },
      ...columns,
    ]
  }, [columns, selectable])

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, globalFilter, rowSelection, columnVisibility: visibility },
    getRowId,
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (onSelectionChange) {
          const rows = data.filter((d) => next[getRowId(d)])
          queueMicrotask(() => onSelectionChange(rows))
        }
        return next
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    defaultColumn: { size: 140, minSize: 50, maxSize: 600 },
  })

  const rows = table.getRowModel().rows
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)

  const focusRow = (idx: number) => {
    const el = bodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-row]')[idx]
    el?.focus()
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {(toolbar || !hideSearch || (bulkActions && selected.length > 0)) && (
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          {selected.length > 0 && bulkActions ? (
            <div className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1">
              <span className="text-xs font-medium">{selected.length} selected</span>
              {bulkActions(selected, () => table.resetRowSelection())}
              <Button variant="ghost" size="icon-xs" aria-label="Clear selection" onClick={() => table.resetRowSelection()}>
                <X />
              </Button>
            </div>
          ) : (
            <>
              {!hideSearch && (
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} className="h-7 pl-7 text-xs" aria-label="Search table" />
                </div>
              )}
              {toolbar}
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              <span className="num">{rows.length}</span> of <span className="num">{data.length}</span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Choose columns">
                  <Columns3 />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                {table
                  .getAllLeafColumns()
                  .filter((c) => c.id !== '__select')
                  .map((c) => (
                    <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)} onSelect={(e) => e.preventDefault()}>
                      {c.columnDef.meta?.label ?? (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-auto">
        {error ? (
          <ErrorState onRetry={onRetry} />
        ) : loading ? (
          <TableSkeleton cols={Math.min(allColumns.length, 7)} />
        ) : (
          <table className="w-full table-fixed border-separate border-spacing-0 text-[13px]" style={{ minWidth: table.getCenterTotalSize() }}>
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const align = h.column.columnDef.meta?.align
                    const sorted = h.column.getIsSorted()
                    return (
                      <th
                        key={h.id}
                        style={{ width: h.getSize() }}
                        className={cn('group relative h-8 select-none border-b px-2.5 text-left text-2xs font-semibold uppercase tracking-wide text-muted-foreground', align === 'right' && 'text-right', align === 'center' && 'text-center')}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      >
                        {h.isPlaceholder ? null : h.column.getCanSort() ? (
                          <button
                            className={cn('inline-flex max-w-full items-center gap-1 rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring', align === 'right' && 'flex-row-reverse')}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            <span className="truncate">{flexRender(h.column.columnDef.header, h.getContext())}</span>
                            {sorted === 'asc' ? <ArrowUp className="h-3 w-3" /> : sorted === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />}
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                        {h.column.getCanResize() && (
                          <div
                            onMouseDown={h.getResizeHandler()}
                            onDoubleClick={() => h.column.resetSize()}
                            className={cn('absolute right-0 top-1.5 h-5 w-1 cursor-col-resize rounded bg-border opacity-0 group-hover:opacity-100', h.column.getIsResizing() && 'bg-primary opacity-100')}
                            role="separator"
                            aria-label="Resize column"
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody ref={bodyRef}>
              {rows.map((row, idx) => {
                const tr = (
                  <tr
                    key={row.id}
                    data-row
                    tabIndex={0}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onDoubleClick={() => onOpen?.(row.original)}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button,a,input,[role=checkbox]')) return
                      onOpen?.(row.original)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onOpen?.(row.original)
                      else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        focusRow(idx + 1)
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        focusRow(idx - 1)
                      } else if (e.key === ' ' && selectable) {
                        e.preventDefault()
                        row.toggleSelected()
                      }
                    }}
                    className={cn(
                      'group/row cursor-default outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/70 focus-visible:shadow-[inset_2px_0_0_hsl(var(--ring))] data-[state=selected]:bg-primary/5',
                      onOpen && 'cursor-pointer',
                      rowClassName?.(row.original),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'truncate border-b px-2.5',
                            dense ? 'h-8' : 'h-[34px]',
                            meta?.align === 'right' && 'text-right',
                            meta?.align === 'center' && 'text-center',
                            meta?.className,
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                )
                if (!rowActions) return tr
                const actions = rowActions(row.original)
                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>{tr}</ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                      {actions.map((a) => (
                        <div key={a.label}>
                          {a.separatorBefore && <ContextMenuSeparator />}
                          <ContextMenuItem destructive={a.destructive} onSelect={a.onSelect}>
                            {a.icon && <a.icon />}
                            {a.label}
                            {a.shortcut && <span className="ml-auto font-mono text-2xs text-muted-foreground">{a.shortcut}</span>}
                          </ContextMenuItem>
                        </div>
                      ))}
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title={globalFilter ? 'No matching rows' : empty?.title ?? 'Nothing here yet'}
            description={globalFilter ? `Nothing matches “${globalFilter}”. Try a different search or clear filters.` : empty?.description}
            action={globalFilter ? <Button size="sm" variant="outline" onClick={() => setGlobalFilter('')}>Clear search</Button> : empty?.action}
          />
        )}
      </div>
      {footer}
    </div>
  )
}
