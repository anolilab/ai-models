import { useEffect, useRef, useMemo } from 'react'
import type { RefObject } from 'react'
import {
  flexRender,
} from '@tanstack/react-table'
import type {
  Cell,
  Header,
  HeaderGroup,
  Row,
  Table,
} from '@tanstack/react-table'
import {
  useVirtualizer,
} from '@tanstack/react-virtual'
import type {
  VirtualItem,
  Virtualizer,
} from '@tanstack/react-virtual'
import {
  Table as BaseTable,
  TableHeader,
  TableBody as BaseTableBody,
  TableHead as BaseTableHead,
  TableRow as BaseTableRow,
  TableCell as BaseTableCell,
} from '../ui/table'
import { cn } from '@/lib/utils'
import type { RegularTableProps } from './regular-table'
import { DataTableResizer } from './data-table-resizer'

// Define ExportableData type locally since it's not exported from the utils
interface ExportableData {
  [key: string]: any
}

interface VirtualizationOptions {
  estimatedRowHeight: number
  overscan: number
  containerHeight: number
}

interface VirtualizedTableProps<TData extends ExportableData> extends RegularTableProps<TData> {
  virtualizationOptions: VirtualizationOptions
}

interface TableHeadProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TData>
  virtualPaddingLeft: number
  virtualPaddingRight: number
  enableStickyHeader?: boolean
  enableColumnResizing?: boolean
  enableRowSelection?: boolean
}

interface TableHeadRowProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  headerGroup: HeaderGroup<TData>
  virtualPaddingLeft: number
  virtualPaddingRight: number
  enableColumnResizing?: boolean
}

interface TableHeadCellProps<TData extends ExportableData> {
  header: Header<TData, unknown>
  enableColumnResizing?: boolean
}

interface TableBodyProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TData>
  tableContainerRef: RefObject<HTMLDivElement | null>
  virtualPaddingLeft: number
  virtualPaddingRight: number
  virtualizationOptions: VirtualizationOptions
  enableClickRowSelect?: boolean
  columns: any[]
  enableStickyHeader?: boolean
  enableRowSelection?: boolean
}

interface TableBodyRowProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  row: Row<TData>
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
  virtualPaddingLeft: number
  virtualPaddingRight: number
  virtualRow: VirtualItem
  enableClickRowSelect?: boolean
}

interface TableBodyCellProps<TData extends ExportableData> {
  cell: Cell<TData, unknown>
  cellIndex: number
}

const VirtualizedTable = <TData extends ExportableData>({ 
  table,
  enableColumnResizing = false,
  enableClickRowSelect = false,
  enableKeyboardNavigation = false,
  columns,
  onKeyDown,
  className,
  style,
  virtualizationOptions,
  enableStickyHeader = true,
}: VirtualizedTableProps<TData>) => {
  const visibleColumns = table.getVisibleLeafColumns()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  // CRITICAL: Memoize expensive width calculation (React Compiler can't optimize this)
  const totalWidth = useMemo(() => 
    visibleColumns.reduce((sum, column) => sum + column.getSize(), 0),
    [visibleColumns]
  )

  // Column virtualization for horizontal scrolling
  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: visibleColumns.length,
    estimateSize: index => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3,
    scrollPaddingEnd: 0,
    scrollPaddingStart: 0,
  })

  const virtualColumns = columnVirtualizer.getVirtualItems()

  // Force column virtualizer to recalculate when container changes
  useEffect(() => {
    if (tableContainerRef.current) {
      columnVirtualizer.measure()
    }
  }, [tableContainerRef.current, columnVirtualizer])

  // Calculate virtual padding for smooth horizontal scrolling
  const virtualPaddingLeft = virtualColumns[0]?.start ?? 0
  const virtualPaddingRight = virtualColumns.length > 0
    ? columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
    : 0

  return (
    <div 
      ref={tableContainerRef}
      className="relative overflow-auto"
      style={{
        height: virtualizationOptions.containerHeight,
        ...(enableStickyHeader && {
          position: 'relative',
        }),
      }}
    >
      <BaseTable 
        classNames={{
          table: cn("grid", enableColumnResizing ? "resizable-table" : "", className),
          container: "w-full",
        }}
        onKeyDown={enableKeyboardNavigation ? onKeyDown : undefined}
        style={{
          ...style,
          width: `${totalWidth}px`,
        }}
      >
        <TableHead
          columnVirtualizer={columnVirtualizer}
          table={table}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          enableStickyHeader={enableStickyHeader}
          enableColumnResizing={enableColumnResizing}
          enableRowSelection={table.getState().rowSelection !== undefined}
        />
        <TableBody
          columnVirtualizer={columnVirtualizer}
          table={table}
          tableContainerRef={tableContainerRef}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualizationOptions={virtualizationOptions}
          enableClickRowSelect={enableClickRowSelect}
          columns={columns}
          enableStickyHeader={enableStickyHeader}
          enableRowSelection={table.getState().rowSelection !== undefined}
        />
      </BaseTable>
    </div>
  )
}

const TableHead = <TData extends ExportableData>({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  enableStickyHeader = true,
  enableColumnResizing = false,
  enableRowSelection = false,
}: TableHeadProps<TData>) => {
  // Create a key that changes when selection state changes
  const headerKey = enableRowSelection
    ? `header-${JSON.stringify(table.getState().rowSelection)}`
    : 'header-static';

  return (
    <TableHeader 
      key={headerKey}
      className={cn(
        enableStickyHeader && "sticky top-0 z-50 bg-background border-b shadow-sm min-h-10"
      )}
    >
      {table.getHeaderGroups().map(headerGroup => {
        return (
          <TableHeadRow
            key={headerGroup.id}
            columnVirtualizer={columnVirtualizer}
            headerGroup={headerGroup}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            enableColumnResizing={enableColumnResizing}
          />
        );
      })}
    </TableHeader>
  )
}

const TableHeadRow = <TData extends ExportableData>({
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
  enableColumnResizing = false,
}: TableHeadRowProps<TData>) => {
  const virtualColumns = columnVirtualizer.getVirtualItems()
  const hasVirtualColumns = virtualColumns.length > 0
  
  // Use virtual columns when available, otherwise fall back to all headers
  const headersToRender = hasVirtualColumns 
    ? virtualColumns.map(vc => headerGroup.headers[vc.index])
    : headerGroup.headers.filter(header => !header.isPlaceholder)

  return (
    <BaseTableRow className="flex w-full">
      {/* Left padding for virtualization */}
      {hasVirtualColumns && virtualPaddingLeft > 0 && (
        <BaseTableHead className="flex" style={{ width: virtualPaddingLeft }} />
      )}
      
      {/* Render header cells */}
      {headersToRender.map(header => (
        <TableHeadCell 
          key={header.id} 
          header={header} 
          enableColumnResizing={enableColumnResizing} 
        />
      ))}
      
      {/* Right padding for virtualization */}
      {hasVirtualColumns && virtualPaddingRight > 0 && (
        <BaseTableHead className="flex" style={{ width: virtualPaddingRight }} />
      )}
    </BaseTableRow>
  )
}

const TableHeadCell = <TData extends ExportableData>({ 
  header, 
  enableColumnResizing = false 
}: TableHeadCellProps<TData>) => {
  return (
    <BaseTableHead
      className="p-2 relative text-left group/th bg-background flex"
      colSpan={header.colSpan}
      scope="col"
      tabIndex={-1}
      style={{
        width: header.getSize(),
      }}
      data-column-resizing={enableColumnResizing && header.column.getIsResizing() ? "true" : undefined}
    >
      {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
      {enableColumnResizing && header.column.getCanResize() && (
        <DataTableResizer header={header} />
      )}
    </BaseTableHead>
  )
}

const TableBody = <TData extends ExportableData>({
  columnVirtualizer,
  table,
  tableContainerRef,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualizationOptions,
  enableClickRowSelect = false,
  columns,
  enableStickyHeader = true,
  enableRowSelection = false,
}: TableBodyProps<TData>) => {
  const { rows } = table.getRowModel()

  // Row virtualization for vertical scrolling
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => virtualizationOptions.estimatedRowHeight,
    getScrollElement: () => tableContainerRef.current,
    measureElement: (element: HTMLTableRowElement | null) => {
      if (!element) {
        return virtualizationOptions.estimatedRowHeight
      }
      return element.getBoundingClientRect().height
    },
    overscan: virtualizationOptions.overscan,
    scrollPaddingEnd: 0,
    scrollPaddingStart: enableStickyHeader ? 40 : 0,
  })

  // Force virtualizer to recalculate when container, data, filters, or sorting change
  useEffect(() => {
    if (tableContainerRef.current && rows.length > 0) {
      rowVirtualizer.measure()
    }
  }, [tableContainerRef.current, rows.length, rowVirtualizer, table.getState().columnFilters, table.getState().globalFilter, table.getState().sorting]);

  // Force virtualizer to scroll to top when sorting changes
  useEffect(() => {
    if (tableContainerRef.current) {
      rowVirtualizer.scrollToIndex(0)
    }
  }, [table.getState().sorting, rowVirtualizer]);

  const virtualRows = rowVirtualizer.getVirtualItems()

  // Force virtualizer to recalculate when container ref becomes available
  useEffect(() => {
    if (tableContainerRef.current) {
      rowVirtualizer.measure()
    }
  }, [tableContainerRef.current, rowVirtualizer])
  
  // Handle no results
  if (!rows.length) {
    return (
      <BaseTableBody>
        <BaseTableRow>
          <BaseTableCell
            colSpan={columns.length}
            className="h-24 text-left truncate"
          >
            No results.
          </BaseTableCell>
        </BaseTableRow>
      </BaseTableBody>
    )
  }
  
  return (
    <BaseTableBody
      className="relative w-full"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {virtualRows.map(virtualRow => {
        const row = rows[virtualRow.index] as Row<TData>
        
        // Include sorting state in key to force re-render when sorting changes
        const sortingState = table.getState().sorting.map(s => `${s.id}-${s.desc}`).join(',');
        const rowKey = enableRowSelection
          ? `${row.id}-${virtualRow.index}-${row.getIsSelected()}-${sortingState}`
          : `${row.id}-${virtualRow.index}-${sortingState}`;
        
        return (
          <TableBodyRow
            key={rowKey}
            columnVirtualizer={columnVirtualizer}
            row={row}
            rowVirtualizer={rowVirtualizer}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            virtualRow={virtualRow}
            enableClickRowSelect={enableClickRowSelect}
          />
        )
      })}
    </BaseTableBody>
  )
}

const TableBodyRow = <TData extends ExportableData>({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
  enableClickRowSelect = false,
}: TableBodyRowProps<TData>) => {
  const visibleCells = row.getVisibleCells()
  const virtualColumns = columnVirtualizer.getVirtualItems()

  return (
    <BaseTableRow
      ref={node => rowVirtualizer.measureElement(node)}
      key={row.id}
      id={`row-${row.id}-${virtualRow.index}`}
      data-state={row.getIsSelected() ? "selected" : undefined}
      tabIndex={0}
      aria-selected={row.getIsSelected()}
      onClick={enableClickRowSelect ? () => row.toggleSelected() : undefined}
      onFocus={(e) => {
        // Remove focus from other rows
        for (const el of document.querySelectorAll('[data-focused="true"]')) {
          el.removeAttribute('data-focused')
        }
        e.currentTarget.setAttribute('data-focused', 'true')
      }}
      className="absolute w-full flex left-0 right-0"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {/* Left padding for virtualization */}
      {virtualPaddingLeft > 0 && (
        <BaseTableCell className="flex" style={{ width: virtualPaddingLeft }} />
      )}
      
      {/* Render virtual cells */}
      {virtualColumns.map((vc, cellIndex) => {
        const cell = visibleCells[vc.index]
        return <TableBodyCell key={cell.id} cell={cell} cellIndex={cellIndex} />
      })}
      
      {/* Right padding for virtualization */}
      {virtualPaddingRight > 0 && (
        <BaseTableCell className="flex" style={{ width: virtualPaddingRight }} />
      )}
    </BaseTableRow>
  )
}

const TableBodyCell = <TData extends ExportableData>({ 
  cell, 
  cellIndex 
}: TableBodyCellProps<TData>) => {
  return (
    <BaseTableCell
      className="py-2 px-4.5 truncate text-left flex"
      id={`cell-${cellIndex}`}
      style={{
        width: cell.column.getSize(),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </BaseTableCell>
  )
}

export {
  VirtualizedTable,
  TableHead,
  TableHeadRow,
  TableHeadCell,
  TableBody,
  TableBodyRow,
  TableBodyCell,
  type VirtualizationOptions,
} 