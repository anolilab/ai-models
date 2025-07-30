import { useMemo, forwardRef } from "react";
import type { ComponentProps, CSSProperties, KeyboardEvent } from "react";
import {
  flexRender,
  type Table,
} from "@tanstack/react-table";
import {
  Table as BaseTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell as BaseTableCell,
} from "@/components/ui/table";
import { DataTableResizer } from "./data-table-resizer";
import { cn } from "@/lib/utils";

// Custom TableCell that doesn't use flexbox
const TableCell = forwardRef<
  HTMLTableCellElement,
  ComponentProps<"td">
>(({ className, ...props }, ref) => {
  return (
    <BaseTableCell
      ref={ref}
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
})
TableCell.displayName = "TableCell"

export interface RegularTableProps<TData> {
    table: Table<TData>;
    enableColumnResizing?: boolean;
    enableClickRowSelect?: boolean;
    enableKeyboardNavigation?: boolean;
    columns: any[];
    onKeyDown?: (event: KeyboardEvent) => void;
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
  const { rows } = table.getFilteredRowModel()
  
  // Create a more comprehensive key that changes when filters or data changes
  const tableKey = useMemo(() => {
    const filterState = table.getState().columnFilters
    const globalFilter = table.getState().globalFilter
    const sorting = table.getState().sorting
    return `table-${rows.length}-${JSON.stringify(filterState)}-${globalFilter}-${JSON.stringify(sorting)}`
  }, [table, rows.length])

  return (<div 
      className="relative w-full h-full overflow-auto"
      style={{
        height: containerHeight,
      }}
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
           className={cn(
             enableStickyHeader && "sticky top-0 z-50 bg-background border-b shadow-sm min-h-10"
           )}
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
            rows.map((row, rowIndex) => (
              <TableRow
                key={`${row.id}-${rowIndex}`}
                id={`row-${row.id}-${rowIndex}`}
                data-row-index={rowIndex}
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
            ))
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