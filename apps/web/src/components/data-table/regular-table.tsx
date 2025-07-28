import * as React from "react";
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
  TableCell,
} from "@/components/ui/table";
import { DataTableResizer } from "./data-table-resizer";
import { cn } from "@/lib/utils";

export interface RegularTableProps<TData> {
    table: Table<TData>;
    enableColumnResizing?: boolean;
    enableClickRowSelect?: boolean;
    enableKeyboardNavigation?: boolean;
    columns: any[];
    onKeyDown?: (event: React.KeyboardEvent) => void;
    className?: string;
    style?: React.CSSProperties;
    enableStickyHeader?: boolean;
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
}: RegularTableProps<TData>) {
  return (
    <BaseTable 
      className={enableColumnResizing ? "resizable-table" : ""} 
      onKeyDown={enableKeyboardNavigation ? onKeyDown : undefined}
      style={style}
    >
      <TableHeader className={cn(enableStickyHeader && "sticky top-0 z-10")}>
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

      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row, rowIndex) => (
            <TableRow
              key={row.id}
              id={`row-${rowIndex}`}
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
                  className="p-2 truncate text-left"
                  key={cell.id}
                  id={`cell-${rowIndex}-${cellIndex}`}
                  data-cell-index={cellIndex}
                  style={{
                    width: cell.column.getSize() + 5,
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
  );
} 