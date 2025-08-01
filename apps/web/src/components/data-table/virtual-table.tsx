import type { Cell, Header, HeaderGroup, Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

import {
    Table as BaseTable,
    TableBody as BaseTableBody,
    TableCell as BaseTableCell,
    TableHead as BaseTableHead,
    TableHeader,
    TableRow as BaseTableRow,
} from "../ui/table";
import { DataTableResizer } from "./data-table-resizer";
import type { RegularTableProps } from "./regular-table";

// Define ExportableData type locally since it's not exported from the utils
interface ExportableData {
    [key: string]: any;
}

interface VirtualizationOptions {
    containerHeight: number;
    estimatedRowHeight: number;
    overscan: number;
}

interface VirtualizedTableProps<TData extends ExportableData> extends RegularTableProps<TData> {
    virtualizationOptions: VirtualizationOptions;
}

interface TableHeadProps<TData extends ExportableData> {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
    enableColumnResizing?: boolean;
    enableRowSelection?: boolean;
    enableStickyHeader?: boolean;
    table: Table<TData>;
    virtualPaddingLeft: number;
    virtualPaddingRight: number;
}

interface TableHeadRowProps<TData extends ExportableData> {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
    enableColumnResizing?: boolean;
    headerGroup: HeaderGroup<TData>;
    table: Table<TData>;
    virtualPaddingLeft: number;
    virtualPaddingRight: number;
}

interface TableHeadCellProps<TData extends ExportableData> {
    enableColumnResizing?: boolean;
    header: Header<TData, unknown>;
    table: Table<TData>;
}

interface TableBodyProps<TData extends ExportableData> {
    columns: any[];
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
    enableClickRowSelect?: boolean;
    enableRowSelection?: boolean;
    enableStickyHeader?: boolean;
    table: Table<TData>;
    tableContainerRef: RefObject<HTMLDivElement | null>;
    virtualizationOptions: VirtualizationOptions;
    virtualPaddingLeft: number;
    virtualPaddingRight: number;
}

interface TableBodyRowProps<TData extends ExportableData> {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
    enableClickRowSelect?: boolean;
    row: Row<TData>;
    rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
    virtualPaddingLeft: number;
    virtualPaddingRight: number;
    virtualRow: VirtualItem;
}

interface TableBodyCellProps<TData extends ExportableData> {
    cell: Cell<TData, unknown>;
    cellIndex: number;
}

const VirtualizedTable = <TData extends ExportableData>({
    className,
    columns,
    enableClickRowSelect = false,
    enableColumnResizing = false,
    enableKeyboardNavigation = false,
    enableStickyHeader = true,
    onKeyDown,
    style,
    table,
    virtualizationOptions,
}: VirtualizedTableProps<TData>) => {
    const visibleColumns = table.getVisibleLeafColumns();
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // CRITICAL: Memoize expensive width calculation (React Compiler can't optimize this)
    const totalWidth = useMemo(() => visibleColumns.reduce((sum, column) => sum + column.getSize(), 0), [visibleColumns]);

    // Column virtualization for horizontal scrolling
    const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
        count: visibleColumns.length,
        estimateSize: (index) => visibleColumns[index].getSize(),
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3,
        scrollPaddingEnd: 0,
        scrollPaddingStart: 0,
    });

    const virtualColumns = columnVirtualizer.getVirtualItems();

    // Force column virtualizer to recalculate when container changes
    useEffect(() => {
        if (tableContainerRef.current) {
            columnVirtualizer.measure();
        }
    }, [tableContainerRef.current, columnVirtualizer]);

    // Calculate virtual padding for smooth horizontal scrolling
    const virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
    const virtualPaddingRight = virtualColumns.length > 0 ? columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0) : 0;

    return (
        <div
            className="relative overflow-auto"
            ref={tableContainerRef}
            style={{
                height: virtualizationOptions.containerHeight,
                ...enableStickyHeader && {
                    position: "relative",
                },
            }}
        >
            <BaseTable
                classNames={{
                    container: "w-full",
                    table: cn("grid", enableColumnResizing ? "resizable-table" : "", className),
                }}
                onKeyDown={enableKeyboardNavigation ? onKeyDown : undefined}
                style={{
                    ...style,
                    width: `${totalWidth}px`,
                }}
            >
                <TableHead
                    columnVirtualizer={columnVirtualizer}
                    enableColumnResizing={enableColumnResizing}
                    enableRowSelection={table.getState().rowSelection !== undefined}
                    enableStickyHeader={enableStickyHeader}
                    table={table}
                    virtualPaddingLeft={virtualPaddingLeft}
                    virtualPaddingRight={virtualPaddingRight}
                />
                <TableBody
                    columns={columns}
                    columnVirtualizer={columnVirtualizer}
                    enableClickRowSelect={enableClickRowSelect}
                    enableRowSelection={table.getState().rowSelection !== undefined}
                    enableStickyHeader={enableStickyHeader}
                    table={table}
                    tableContainerRef={tableContainerRef}
                    virtualizationOptions={virtualizationOptions}
                    virtualPaddingLeft={virtualPaddingLeft}
                    virtualPaddingRight={virtualPaddingRight}
                />
            </BaseTable>
        </div>
    );
};

const TableHead = <TData extends ExportableData>({
    columnVirtualizer,
    enableColumnResizing = false,
    enableRowSelection = false,
    enableStickyHeader = true,
    table,
    virtualPaddingLeft,
    virtualPaddingRight,
}: TableHeadProps<TData>) => {
    // Create a key that changes when selection state or sorting changes
    const sortingState = table
        .getState()
        .sorting
        .map((s) => `${s.id}-${s.desc}`)
        .join(",");
    const headerKey = enableRowSelection ? `header-${JSON.stringify(table.getState().rowSelection)}-${sortingState}` : `header-${sortingState}`;

    return (
        <TableHeader className={cn(enableStickyHeader && "bg-background sticky top-0 z-50 min-h-10 border-b shadow-sm")} key={headerKey}>
            {table.getHeaderGroups().map((headerGroup) => {
                const sortingState = table
                    .getState()
                    .sorting
                    .map((s) => `${s.id}-${s.desc}`)
                    .join(",");

                return (
                    <TableHeadRow
                        columnVirtualizer={columnVirtualizer}
                        enableColumnResizing={enableColumnResizing}
                        headerGroup={headerGroup}
                        key={`${headerGroup.id}-${sortingState}`}
                        table={table}
                        virtualPaddingLeft={virtualPaddingLeft}
                        virtualPaddingRight={virtualPaddingRight}
                    />
                );
            })}
        </TableHeader>
    );
};

const TableHeadRow = <TData extends ExportableData>({
    columnVirtualizer,
    enableColumnResizing = false,
    headerGroup,
    table,
    virtualPaddingLeft,
    virtualPaddingRight,
}: TableHeadRowProps<TData>) => {
    const virtualColumns = columnVirtualizer.getVirtualItems();
    const hasVirtualColumns = virtualColumns.length > 0;

    // Use virtual columns when available, otherwise fall back to all headers
    const headersToRender = hasVirtualColumns
        ? virtualColumns.map((vc) => headerGroup.headers[vc.index])
        : headerGroup.headers.filter((header) => !header.isPlaceholder);

    return (
        <BaseTableRow className="flex w-full">
            {/* Left padding for virtualization */}
            {hasVirtualColumns && virtualPaddingLeft > 0 && <BaseTableHead className="flex" style={{ width: virtualPaddingLeft }} />}

            {/* Render header cells */}
            {headersToRender.map((header) => {
                const sortingState = table
                    .getState()
                    .sorting
                    .map((s) => `${s.id}-${s.desc}`)
                    .join(",");

                return <TableHeadCell enableColumnResizing={enableColumnResizing} header={header} key={`${header.id}-${sortingState}`} table={table} />;
            })}

            {/* Right padding for virtualization */}
            {hasVirtualColumns && virtualPaddingRight > 0 && <BaseTableHead className="flex" style={{ width: virtualPaddingRight }} />}
        </BaseTableRow>
    );
};

const TableHeadCell = <TData extends ExportableData>({ enableColumnResizing = false, header, table }: TableHeadCellProps<TData>) => {
    // Include sorting state in key to force re-render when sorting changes
    const sortingState = table
        .getState()
        .sorting
        .map((s: { desc: boolean; id: string }) => `${s.id}-${s.desc}`)
        .join(",");

    return (
        <BaseTableHead
            className="group/th bg-background relative flex p-2 text-left"
            colSpan={header.colSpan}
            data-column-resizing={enableColumnResizing && header.column.getIsResizing() ? "true" : undefined}
            scope="col"
            style={{
                width: header.getSize(),
            }}
            tabIndex={-1}
        >
            {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
            {enableColumnResizing && header.column.getCanResize() && <DataTableResizer header={header} />}
        </BaseTableHead>
    );
};

const TableBody = <TData extends ExportableData>({
    columns,
    columnVirtualizer,
    enableClickRowSelect = false,
    enableRowSelection = false,
    enableStickyHeader = true,
    table,
    tableContainerRef,
    virtualizationOptions,
    virtualPaddingLeft,
    virtualPaddingRight,
}: TableBodyProps<TData>) => {
    const { rows } = table.getRowModel();

    // Row virtualization for vertical scrolling
    const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
        count: rows.length,
        estimateSize: () => virtualizationOptions.estimatedRowHeight,
        getScrollElement: () => tableContainerRef.current,
        measureElement: (element: HTMLTableRowElement | null) => {
            if (!element) {
                return virtualizationOptions.estimatedRowHeight;
            }

            return element.getBoundingClientRect().height;
        },
        overscan: virtualizationOptions.overscan,
        scrollPaddingEnd: 0,
        scrollPaddingStart: enableStickyHeader ? 40 : 0,
    });

    // Force virtualizer to recalculate when container, data, filters, or sorting change
    useEffect(() => {
        if (tableContainerRef.current && rows.length > 0) {
            rowVirtualizer.measure();
        }
    }, [tableContainerRef.current, rows.length, rowVirtualizer, table.getState().columnFilters, table.getState().globalFilter, table.getState().sorting]);

    // Force virtualizer to scroll to top when sorting changes
    useEffect(() => {
        if (tableContainerRef.current) {
            rowVirtualizer.scrollToIndex(0);
        }
    }, [table.getState().sorting, rowVirtualizer]);

    const virtualRows = rowVirtualizer.getVirtualItems();

    // Force virtualizer to recalculate when container ref becomes available
    useEffect(() => {
        if (tableContainerRef.current) {
            rowVirtualizer.measure();
        }
    }, [tableContainerRef.current, rowVirtualizer]);

    // Handle no results
    if (!rows.length) {
        return (
            <BaseTableBody>
                <BaseTableRow>
                    <BaseTableCell className="h-24 truncate text-left" colSpan={columns.length}>
                        No results.
                    </BaseTableCell>
                </BaseTableRow>
            </BaseTableBody>
        );
    }

    return (
        <BaseTableBody
            className="relative w-full"
            style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
            }}
        >
            {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<TData>;

                // Include sorting state in key to force re-render when sorting changes
                const sortingState = table
                    .getState()
                    .sorting
                    .map((s) => `${s.id}-${s.desc}`)
                    .join(",");
                const rowKey = enableRowSelection
                    ? `${row.id}-${virtualRow.index}-${row.getIsSelected()}-${sortingState}`
                    : `${row.id}-${virtualRow.index}-${sortingState}`;

                return (
                    <TableBodyRow
                        columnVirtualizer={columnVirtualizer}
                        enableClickRowSelect={enableClickRowSelect}
                        key={rowKey}
                        row={row}
                        rowVirtualizer={rowVirtualizer}
                        virtualPaddingLeft={virtualPaddingLeft}
                        virtualPaddingRight={virtualPaddingRight}
                        virtualRow={virtualRow}
                    />
                );
            })}
        </BaseTableBody>
    );
};

const TableBodyRow = <TData extends ExportableData>({
    columnVirtualizer,
    enableClickRowSelect = false,
    row,
    rowVirtualizer,
    virtualPaddingLeft,
    virtualPaddingRight,
    virtualRow,
}: TableBodyRowProps<TData>) => {
    const visibleCells = row.getVisibleCells();
    const virtualColumns = columnVirtualizer.getVirtualItems();

    return (
        <BaseTableRow
            aria-selected={row.getIsSelected()}
            className="absolute right-0 left-0 flex w-full"
            data-index={virtualRow.index}
            data-state={row.getIsSelected() ? "selected" : undefined}
            id={`row-${row.id}-${virtualRow.index}`}
            key={row.id}
            onClick={enableClickRowSelect ? () => row.toggleSelected() : undefined}
            onFocus={(e) => {
                // Remove focus from other rows
                for (const el of document.querySelectorAll("[data-focused=\"true\"]")) {
                    el.removeAttribute("data-focused");
                }

                e.currentTarget.setAttribute("data-focused", "true");
            }}
            ref={(node) => rowVirtualizer.measureElement(node)}
            style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
            }}
            tabIndex={0}
        >
            {/* Left padding for virtualization */}
            {virtualPaddingLeft > 0 && <BaseTableCell className="flex" style={{ width: virtualPaddingLeft }} />}

            {/* Render virtual cells */}
            {virtualColumns.map((vc, cellIndex) => {
                const cell = visibleCells[vc.index];

                return <TableBodyCell cell={cell} cellIndex={cellIndex} key={cell.id} />;
            })}

            {/* Right padding for virtualization */}
            {virtualPaddingRight > 0 && <BaseTableCell className="flex" style={{ width: virtualPaddingRight }} />}
        </BaseTableRow>
    );
};

const TableBodyCell = <TData extends ExportableData>({ cell, cellIndex }: TableBodyCellProps<TData>) => (
        <BaseTableCell
            className="flex truncate px-4.5 py-2 text-left"
            id={`cell-${cellIndex}`}
            style={{
                width: cell.column.getSize(),
            }}
        >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </BaseTableCell>
);

export { TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableHeadRow, type VirtualizationOptions, VirtualizedTable };
