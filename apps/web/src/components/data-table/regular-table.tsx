import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { CSSProperties, KeyboardEvent } from "react";
import { useCallback, useMemo } from "react";

import { Table as BaseTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { DataTableResizer } from "./data-table-resizer";

// Define ExportableData type locally since it's not exported from the utils
interface ExportableData {
    [key: string]: any;
}

export interface RegularTableProps<TData> {
    className?: string;
    columns: any[];
    containerHeight?: number;
    enableClickRowSelect?: boolean;
    enableColumnResizing?: boolean;
    enableKeyboardNavigation?: boolean;
    enableStickyHeader?: boolean;
    onKeyDown?: (event: KeyboardEvent<HTMLTableElement>) => void;
    style?: CSSProperties;
    table: Table<TData>;
}

export function RegularTable<TData>({
    className,
    columns,
    containerHeight,
    enableClickRowSelect = false,
    enableColumnResizing = false,
    enableKeyboardNavigation = false,
    enableStickyHeader = true,
    onKeyDown,
    style,
    table,
}: RegularTableProps<TData>) {
    const { rows } = table.getRowModel();

    // Check if row selection is enabled
    const enableRowSelection = table.getState().rowSelection !== undefined;

    // OPTIMIZATION: Memoize table key to prevent unnecessary re-renders
    const tableKey = useMemo(() => {
        const { rows } = table.getRowModel();
        const filterState = table.getState().columnFilters;
        const { globalFilter } = table.getState();
        const { sorting } = table.getState();

        return `regular-table-${rows.length}-${JSON.stringify(filterState)}-${globalFilter}-${JSON.stringify(sorting)}`;
    }, [table]);

    // OPTIMIZATION: Memoize table styles
    const tableStyles = useMemo(
        () => {
            return {
                height: containerHeight,
            };
        },
        [containerHeight],
    );

    // OPTIMIZATION: Memoize header styles
    const headerStyles = useMemo(() => (enableStickyHeader ? "sticky top-0 z-50 bg-background border-b shadow-sm min-h-10" : ""), [enableStickyHeader]);

    // OPTIMIZATION: Memoize click handler
    const handleRowClick = useCallback(
        (row: any) => {
            if (enableClickRowSelect) {
                row.toggleSelected();
            }
        },
        [enableClickRowSelect],
    );

    // OPTIMIZATION: Memoize focus handler
    const handleRowFocus = useCallback((e: React.FocusEvent<HTMLTableRowElement>) => {
        // Add a data attribute to the currently focused row
        for (const el of document.querySelectorAll("[data-focused=\"true\"]")) {
            el.removeAttribute("data-focused");
        }

        e.currentTarget.setAttribute("data-focused", "true");
    }, []);

    // Create header key that changes when selection state changes
    const headerKey = enableRowSelection ? `header-${JSON.stringify(table.getState().rowSelection)}` : "header-static";

    return (
        <div className="relative w-full overflow-auto" style={tableStyles}>
            <BaseTable
                classNames={{
                    container: "overflow-auto",
                    table: cn("relative", enableColumnResizing ? "resizable-table" : "", className),
                }}
                key={tableKey}
                onKeyDown={enableKeyboardNavigation ? onKeyDown : undefined}
                style={style}
            >
                <TableHeader className={headerStyles} key={headerKey}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    className="group/th relative p-2 text-left"
                                    colSpan={header.colSpan}
                                    data-column-resizing={enableColumnResizing && header.column.getIsResizing() ? "true" : undefined}
                                    key={header.id}
                                    scope="col"
                                    style={{
                                        width: header.getSize(),
                                    }}
                                    tabIndex={-1}
                                >
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    {enableColumnResizing && header.column.getCanResize() && <DataTableResizer header={header} />}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody key={tableKey}>
                    {rows?.length
                        ? rows.map((row, rowIndex) => {
                            // OPTIMIZATION: Memoize row selection state
                            const isSelected = row.getIsSelected();

                            // Include sorting state in key to force re-render when sorting changes
                            const sortingState = table
                                .getState()
                                .sorting
                                .map((s) => `${s.id}-${s.desc}`)
                                .join(",");
                            const rowKey = enableRowSelection
                                ? `${row.id}-${rowIndex}-${row.getIsSelected()}-${sortingState}`
                                : `${row.id}-${rowIndex}-${sortingState}`;

                            return (
                                <TableRow
                                    aria-selected={isSelected}
                                    data-row-index={rowIndex}
                                    data-state={isSelected ? "selected" : undefined}
                                    id={`row-${row.id}-${rowIndex}`}
                                    key={rowKey}
                                    onClick={() => handleRowClick(row)}
                                    onFocus={handleRowFocus}
                                    tabIndex={0}
                                >
                                    {row.getVisibleCells().map((cell, cellIndex) => (
                                        <TableCell
                                            className="truncate px-4 text-left"
                                            data-cell-index={cellIndex}
                                            id={`cell-${rowIndex}-${cellIndex}`}
                                            key={cell.id}
                                            style={{
                                                width: cell.column.getSize(),
                                            }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })
                        : (
                        // No results
                        <TableRow>
                            <TableCell className="h-24 truncate text-left" colSpan={columns.length}>
                                No results.
                            </TableCell>
                        </TableRow>
                        )}
                </TableBody>
            </BaseTable>
        </div>
    );
}
