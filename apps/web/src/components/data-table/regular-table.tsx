import { useMemo, useCallback } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import {
  flexRender,
} from '@tanstack/react-table'
import type {
  Table,
} from '@tanstack/react-table'
import {
  Table as BaseTable,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from '@/lib/utils'
import { DataTableResizer } from './data-table-resizer'

// Define ExportableData type locally since it's not exported from the utils
interface ExportableData {
  [key: string]: any
}

export interface RegularTableProps<TData> {
    table: Table<TData>;
    enableColumnResizing?: boolean;
    enableClickRowSelect?: boolean;
    enableKeyboardNavigation?: boolean;
    columns: any[];
    onKeyDown?: (event: KeyboardEvent<HTMLTableElement>) => void;
    className?: string;
    style?: CSSProperties;
    enableStickyHeader?: boolean;
    containerHeight?: number;
}

export function RegularTable<TData>({
  table,
  enableColumnResizing = false,
  enableClickRowSelect = false,
  enableKeyboardNavigation = false,
  columns,
  onKeyDown,
  style,
  enableStickyHeader = true,
  className,
  containerHeight,
}: RegularTableProps<TData>) {
  const { rows } = table.getRowModel()

  // Check if row selection is enabled
  const enableRowSelection = table.getState().rowSelection !== undefined;

  // OPTIMIZATION: Memoize table key to prevent unnecessary re-renders
  const tableKey = useMemo(() => {
    const { rows } = table.getFilteredRowModel()
    const filterState = table.getState().columnFilters
    const globalFilter = table.getState().globalFilter
    const sorting = table.getState().sorting
    return `regular-table-${rows.length}-${JSON.stringify(filterState)}-${globalFilter}-${JSON.stringify(sorting)}`
  }, [table])

  // OPTIMIZATION: Memoize table styles
  const tableStyles = useMemo(() => ({
    height: containerHeight,
  }), [containerHeight])

  // OPTIMIZATION: Memoize header styles
  const headerStyles = useMemo(() => enableStickyHeader ? "sticky top-0 z-50 bg-background border-b shadow-sm min-h-10" : "", [enableStickyHeader])

  // OPTIMIZATION: Memoize click handler
  const handleRowClick = useCallback((row: any) => {
    if (enableClickRowSelect) {
      row.toggleSelected()
    }
  }, [enableClickRowSelect])

  // OPTIMIZATION: Memoize focus handler
  const handleRowFocus = useCallback((e: React.FocusEvent<HTMLTableRowElement>) => {
    // Add a data attribute to the currently focused row
    for (const el of document.querySelectorAll('[data-focused="true"]')) {
      el.removeAttribute('data-focused');
    }
    e.currentTarget.setAttribute('data-focused', 'true');
  }, [])

  // Create header key that changes when selection state changes
  const headerKey = enableRowSelection
    ? `header-${JSON.stringify(table.getState().rowSelection)}`
    : 'header-static';

  return (
    <div
      className="relative w-full overflow-auto"
      style={tableStyles}
    >
      <BaseTable
        key={tableKey}
        classNames={{
          table: cn("relative", enableColumnResizing ? "resizable-table" : "", className),
          container: "overflow-auto",
        }}
        onKeyDown={enableKeyboardNavigation ? onKeyDown : undefined}
        style={style}
      >
                 <TableHeader 
           key={headerKey}
           className={headerStyles}
         >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="p-2 relative text-left group/th"
                  key={header.id}
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
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {enableColumnResizing && header.column.getCanResize() && (
                    <DataTableResizer header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody key={tableKey}>
          {rows?.length ? (
            rows.map((row, rowIndex) => {
              // OPTIMIZATION: Memoize row selection state
              const isSelected = row.getIsSelected()
              
              // Only include selection state in key if row selection is enabled
              const rowKey = enableRowSelection
                ? `${row.id}-${rowIndex}-${isSelected}`
                : `${row.id}-${rowIndex}`;
              
              return (
                <TableRow
                  key={rowKey}
                  id={`row-${row.id}-${rowIndex}`}
                  data-row-index={rowIndex}
                  data-state={isSelected ? "selected" : undefined}
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => handleRowClick(row)}
                  onFocus={handleRowFocus}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      className="truncate text-left px-4"
                      key={cell.id}
                      id={`cell-${rowIndex}-${cellIndex}`}
                      data-cell-index={cellIndex}
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            // No results
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-left truncate"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BaseTable>
    </div>
  );
} 