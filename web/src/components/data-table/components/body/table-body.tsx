import clsx from "clsx";
import { memo, useMemo } from "react";

import { TableBody as ShadcnTableBody } from "@/components/ui/table";

import { useRowVirtualizer } from "../../hooks/use-row-virtualizer";
import { useRows } from "../../hooks/use-rows";
import type { ColumnVirtualizer, Row, RowData, TableInstance, VirtualItem } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import TableBodyEmptyRow from "./table-body-empty-row";
import { Memo_TableBodyRow, TableBodyRow } from "./table-body-row";

export interface TableBodyProps<TData extends RowData> {
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableBody = <TData extends RowData>({ className, columnVirtualizer, style, table, ...rest }: TableBodyProps<TData>): React.JSX.Element => {
    const {
        getBottomRows,
        getIsSomeRowsPinned,
        getRowModel,
        getState,
        getTopRows,
        options,
        refs: { tableFooterRef, tableHeadRef },
    } = table;
    
    const state = getState();
    const { isFullScreen = false, rowPinning = {} } = (state as any) || {};
    
    // Handle missing properties with defaults
    const {
        enableStickyFooter = false,
        enableStickyHeader = false,
        layoutMode = 'table',
        mantineTableBodyProps = {},
        memoMode = 'none',
        renderDetailPanel = false,
        rowPinningDisplayMode = '',
    } = (options as any) || {};

    const tableBodyProps = {
        ...parseFromValuesOrFunc(mantineTableBodyProps, { table }),
        ...rest,
    };

    const tableHeadHeight = ((enableStickyHeader || isFullScreen) && tableHeadRef.current?.clientHeight) || 0;
    const tableFooterHeight = (enableStickyFooter && tableFooterRef.current?.clientHeight) || 0;

    const pinnedRowIds = useMemo<string[]>(() => {
        if (!rowPinning.bottom?.length && !rowPinning.top?.length)
            return [];

        return getRowModel()
            .rows
            .filter((row: Row<TData>) => row.getIsPinned())
            .map((r: Row<TData>) => r.id);
    }, [rowPinning, getRowModel().rows]);

    const rows = useRows(table);

    const rowVirtualizer = useRowVirtualizer(table, rows);

    const { virtualRows } = rowVirtualizer ?? {};

    const commonRowProps = {
        columnVirtualizer,
        numRows: rows.length,
        table,
    };

    return (
        <>
            {!rowPinningDisplayMode?.includes("sticky") && getIsSomeRowsPinned("top") && (
                <ShadcnTableBody
                    className={clsx(
                        "sticky top-[calc(var(--ano-table-head-height,0)*1px-1px)] bottom-[calc(var(--ano-table-footer-height,0)*1px-1px)] z-10",
                        layoutMode?.startsWith("grid") && "grid",
                        className,
                    )}
                    style={{
                        ["--ano-table-head-height" as any]: `${tableHeadHeight}`,
                        ...style,
                    }}
                >
                    {getTopRows().map((row, renderedRowIndex) => {
                        const rowProps = {
                            ...commonRowProps,
                            renderedRowIndex,
                            row,
                        };

                        return memoMode === "rows" ? <Memo_TableBodyRow key={row.id} {...rowProps} /> : <TableBodyRow key={row.id} {...rowProps} />;
                    })}
                </ShadcnTableBody>
            )}
            <ShadcnTableBody
                className={clsx(
                    "relative bg-white dark:bg-gray-900",
                    layoutMode?.startsWith("grid") && "grid",
                    !rows.length && "min-h-[100px]",
                    className,
                )}
                style={{
                    // ✅ FIXED: Set proper height for virtualization
                    height: rowVirtualizer ? `${rowVirtualizer.getTotalSize()}px` : undefined,
                    ...style,
                    ...tableBodyProps.style,
                }}
            >
                {tableBodyProps?.children
                    ?? (!rows.length
                        ? (
                        <TableBodyEmptyRow {...commonRowProps} />
                        )
                        : (
                        <>
                            {rowVirtualizer && virtualRows && virtualRows.length > 0 && virtualRows[0]?.start > 0 && (
                                <tr style={{ height: `${virtualRows[0].start}px` }}>
                                    <td colSpan={table.getVisibleLeafColumns().length} />
                                </tr>
                            )}
                            {(virtualRows ?? rows).map((rowOrVirtualRow: any, renderedRowIndex: number) => {
                                if (rowVirtualizer) {
                                    if (renderDetailPanel) {
                                        if (rowOrVirtualRow.index % 2 === 1) {
                                            return null;
                                        }

                                        renderedRowIndex = rowOrVirtualRow.index / 2;
                                    } else {
                                        renderedRowIndex = rowOrVirtualRow.index;
                                    }
                                }

                                const row = rowVirtualizer ? rows[renderedRowIndex] : (rowOrVirtualRow as Row<TData>);
                                const props = {
                                    ...commonRowProps,
                                    pinnedRowIds,
                                    renderedRowIndex,
                                    row,
                                    rowVirtualizer,
                                    virtualRow: rowVirtualizer ? (rowOrVirtualRow as VirtualItem) : undefined,
                                };
                                const key = `${row.id}-${row.index}`;

                                return memoMode === "rows" ? <Memo_TableBodyRow key={key} {...props} /> : <TableBodyRow key={key} {...props} />;
                            })}
                            {rowVirtualizer && virtualRows && virtualRows.length > 0 && (
                                (() => {
                                    const lastVirtualRow = virtualRows[virtualRows.length - 1];
                                    const remainingHeight = rowVirtualizer.getTotalSize() - (lastVirtualRow.start + lastVirtualRow.size);
                                    
                                    return remainingHeight > 0 ? (
                                        <tr style={{ height: `${remainingHeight}px` }}>
                                            <td colSpan={table.getVisibleLeafColumns().length} />
                                        </tr>
                                    ) : null;
                                })()
                            )}
                        </>
                        ))}
            </ShadcnTableBody>
            {!rowPinningDisplayMode?.includes("sticky") && getIsSomeRowsPinned("bottom") && (
                <ShadcnTableBody
                    className={clsx(
                        "sticky top-[calc(var(--ano-table-head-height,0)*1px-1px)] bottom-[calc(var(--ano-table-footer-height,0)*1px-1px)] z-10",
                        layoutMode?.startsWith("grid") && "grid",
                        className,
                    )}
                    style={{
                        ["--ano-table-footer-height" as any]: `${tableFooterHeight}`,
                        ...style,
                    }}
                >
                    {getBottomRows().map((row, renderedRowIndex) => {
                        const props = {
                            ...commonRowProps,
                            renderedRowIndex,
                            row,
                        };

                        return memoMode === "rows" ? <Memo_TableBodyRow key={row.id} {...props} /> : <TableBodyRow key={row.id} {...props} />;
                    })}
                </ShadcnTableBody>
            )}
        </>
    );
};

export const Memo_TableBody = memo(TableBody, (prev, next) => prev.table.options.data === next.table.options.data) as typeof TableBody;
