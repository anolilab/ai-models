import { useEffect, useRef } from 'react'
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
  estimatedRowHeight?: number
  overscan?: number
  containerHeight?: number
}

interface VirtualizedTableProps<TData extends ExportableData> extends RegularTableProps<TData> {
  virtualizationOptions: Required<VirtualizationOptions>
}

interface TableHeadProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TData>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  enableStickyHeader?: boolean
  enableColumnResizing?: boolean
}

interface TableHeadRowProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  headerGroup: HeaderGroup<TData>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  enableColumnResizing?: boolean
}

interface TableHeadCellProps<TData extends ExportableData> {
  header: Header<TData, unknown>
}

interface TableBodyProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TData>
  tableContainerRef: RefObject<HTMLDivElement | null>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  virtualizationOptions: Required<VirtualizationOptions>
  enableClickRowSelect?: boolean
  columns: any[]
}

interface TableBodyRowProps<TData extends ExportableData> {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  row: Row<TData>
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  virtualRow: VirtualItem
  enableClickRowSelect?: boolean
}

interface TableBodyCellProps<TData extends ExportableData> {
  cell: Cell<TData, unknown>
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
  const tableContainerRef = useRef<HTMLTableElement>(null)

  //we are using a slightly different virtualization strategy for columns (compared to virtual rows) in order to support dynamic row heights
  const columnVirtualizer = useVirtualizer<
    HTMLDivElement,
    HTMLTableCellElement
  >({
    count: visibleColumns.length,
    estimateSize: index => visibleColumns[index].getSize(), //estimate width of each column for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3, //how many columns to render on each side off screen each way (adjust this for performance)
  })

  const virtualColumns = columnVirtualizer.getVirtualItems()

  //different virtualization strategy for columns - instead of absolute and translateY, we add empty columns to the left and right
  let virtualPaddingLeft: number | undefined
  let virtualPaddingRight: number | undefined

  if (columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0
    virtualPaddingRight =
      columnVirtualizer.getTotalSize() -
      (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
  }

  // Calculate total width for horizontal scrolling
  const totalWidth = visibleColumns.reduce((sum, column) => sum + column.getSize(), 0)
  
  return (
    <BaseTable classNames={{
      table: cn("grid", enableColumnResizing ? "resizable-table" : "", className),
      container: cn("overflow-auto", enableStickyHeader && "relative"),
    }}
    ref={tableContainerRef}
    onKeyDown={enableKeyboardNavigation ? onKeyDown : undefined}
    style={{
      ...style,
      height: virtualizationOptions.containerHeight,
      width: `${totalWidth}px`,
    }}>
      <TableHead
        columnVirtualizer={columnVirtualizer}
        table={table}
        virtualPaddingLeft={virtualPaddingLeft}
        virtualPaddingRight={virtualPaddingRight}
        enableStickyHeader={enableStickyHeader}
        enableColumnResizing={enableColumnResizing}
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
      />
    </BaseTable>
  )
}

const TableHead = <TData extends ExportableData>({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  enableStickyHeader = true,
  enableColumnResizing = false,
}: TableHeadProps<TData>) => {
  return (
    <TableHeader className={enableStickyHeader ? "sticky top-0 z-50 bg-background border-b shadow-sm" : ""}>
      {table.getHeaderGroups().map(headerGroup => (
        <TableHeadRow
          columnVirtualizer={columnVirtualizer}
          headerGroup={headerGroup}
          key={headerGroup.id}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          enableColumnResizing={enableColumnResizing}
        />
      ))}
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
  return (
    <BaseTableRow key={headerGroup.id} className="flex w-full">
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <BaseTableHead className="flex" style={{ width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map(virtualColumn => {
        const header = headerGroup.headers[virtualColumn.index]
        return <TableHeadCell key={header.id} header={header} enableColumnResizing={enableColumnResizing} />
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <BaseTableHead className="flex" style={{ width: virtualPaddingRight }} />
      ) : null}
    </BaseTableRow>
  )
}

const TableHeadCell = <TData extends ExportableData>({ 
  header, 
  enableColumnResizing = false 
}: TableHeadCellProps<TData> & { enableColumnResizing?: boolean }) => {
  return (
    <BaseTableHead
      key={header.id}
      className="p-2 relative text-left group/th bg-background flex"
      colSpan={header.colSpan}
      scope="col"
      tabIndex={-1}
      style={{
        width: header.getSize(),
      }}
      data-column-resizing={enableColumnResizing && header.column.getIsResizing() ? "true" : undefined}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
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
}: TableBodyProps<TData>) => {
  const { rows } = table.getFilteredRowModel()

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => virtualizationOptions.estimatedRowHeight,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: virtualizationOptions.overscan,
    // Ensure virtualization works even with small containers
    scrollPaddingEnd: 0,
    scrollPaddingStart: 40, // Add header height as scroll padding
  })

  // Force virtualizer to recalculate when container is available
  useEffect(() => {
    if (tableContainerRef.current && rows.length > 0) {
      rowVirtualizer.measure();
    }
  }, [tableContainerRef.current, rows.length, rowVirtualizer]);

  // Also recalculate when the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tableContainerRef.current && rows.length > 0) {

        rowVirtualizer.measure();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const virtualRows = rowVirtualizer.getVirtualItems()
  
  // Force virtualizer to recalculate when container ref becomes available
  useEffect(() => {
    if (tableContainerRef.current) {
      rowVirtualizer.measure()
    }
  }, [tableContainerRef.current, rowVirtualizer])
  
  // Only render virtual rows if we have a valid container ref
  if (!tableContainerRef.current) {
    return (
      <BaseTableBody
        className="grid relative"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      />
    )
  }

  // Handle no results
  if (!rows.length) {
    return (
      <BaseTableBody className="grid relative">
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
      className="grid relative"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
        paddingTop: '40px', // Add padding to push content below sticky header
      }}
    >
      {virtualRows.map(virtualRow => {
        const row = rows[virtualRow.index] as Row<TData>

        return (
          <TableBodyRow
            columnVirtualizer={columnVirtualizer}
            key={row.id}
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
      ref={node => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      id={`row-${virtualRow.index}`}
      data-index={virtualRow.index} //needed for dynamic row height measurement
      data-row-index={virtualRow.index}
      data-state={row.getIsSelected() ? "selected" : undefined}
      tabIndex={0}
      aria-selected={row.getIsSelected()}
      onClick={enableClickRowSelect ? () => row.toggleSelected() : undefined}
      onFocus={(e) => {
        // Add a data attribute to the currently focused row
        for (const el of document.querySelectorAll('[data-focused="true"]')) {
          el.removeAttribute('data-focused');
        }
        e.currentTarget.setAttribute('data-focused', 'true');
      }}
      className="flex absolute w-full"
      style={{
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
      }}
    >
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <BaseTableCell className="flex" style={{ width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((vc, cellIndex) => {
        const cell = visibleCells[vc.index]
        return <TableBodyCell key={cell.id} cell={cell} cellIndex={cellIndex} />
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <BaseTableCell className="flex" style={{ width: virtualPaddingRight }} />
      ) : null}
    </BaseTableRow>
  )
}

const TableBodyCell = <TData extends ExportableData>({ 
  cell, 
  cellIndex 
}: TableBodyCellProps<TData> & { cellIndex: number }) => {
  return (
    <BaseTableCell
      key={cell.id}
      className="p-2 truncate text-left flex"
      id={`cell-${cellIndex}`}
      data-cell-index={cellIndex}
      style={{
        width: cell.column.getSize() + 5,
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