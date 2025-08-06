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

export const TableBody = <TData extends RowData>({ className, columnVirtualizer, style, table, ...rest }: TableBodyProps<TData>) => {
    const {
        getBottomRows,
        getIsSomeRowsPinned,
        getRowModel,
        getState,
        getTopRows,
        options: { enableStickyFooter, enableStickyHeader, layoutMode, mantineTableBodyProps, memoMode, renderDetailPanel, rowPinningDisplayMode },
        refs: { tableFooterRef, tableHeadRef },
    } = table;
    const { isFullScreen, rowPinning } = getState();

    const tableBodyProps = {
        ...parseFromValuesOrFunc(mantineTableBodyProps, { table }),
        ...rest,
    };

    const tableHeadHeight = ((enableStickyHeader || isFullScreen) && tableHeadRef.current?.clientHeight) || 0;
    const tableFooterHeight = (enableStickyFooter && tableFooterRef.current?.clientHeight) || 0;

    const pinnedRowIds = useMemo(() => {
        if (!rowPinning.bottom?.length && !rowPinning.top?.length)
            return [];

        return getRowModel()
            .rows
            .filter((row) => row.getIsPinned())
            .map((r) => r.id);
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
                        "--ano-table-head-height": `${tableHeadHeight}`,
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
                    rowVirtualizer && "h-[var(--ano-table-body-height)]",
                    className,
                )}
                style={{
                    "--ano-table-body-height": rowVirtualizer ? `${rowVirtualizer.getTotalSize()}px` : undefined,
                    ...style,
                }}
            >
                {tableBodyProps?.children
                    ?? (!rows.length
                        ? (
                        <TableBodyEmptyRow {...commonRowProps} />
                        )
                        : (
                        <>
                            {(virtualRows ?? rows).map((rowOrVirtualRow, renderedRowIndex) => {
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
                        "--ano-table-footer-height": `${tableFooterHeight}`,
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
