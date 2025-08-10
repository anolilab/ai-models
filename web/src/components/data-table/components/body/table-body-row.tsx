import clsx from "clsx";
import type { DragEvent } from "react";
import { memo, useMemo, useRef } from "react";

import { TableRow as ShadcnTableRow } from "@/components/ui/table";

import type { Cell, ColumnVirtualizer, DensityState, Row, RowData, RowVirtualizer, TableInstance, VirtualItem } from "../../types";
import { getIsRowSelected } from "../../utils/row-utils";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { Memo_TableBodyCell, TableBodyCell } from "./table-body-cell";
import { TableDetailPanel } from "./table-detail-panel";

interface Props<TData extends RowData> {
    children?: React.ReactNode;
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    numRows?: number;
    pinnedRowIds?: string[];
    renderedRowIndex?: number;
    row: Row<TData>;
    rowVirtualizer?: RowVirtualizer;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
    virtualRow?: VirtualItem;
}

export const TableBodyRow = <TData extends RowData>({
    children,
    className,
    columnVirtualizer,
    numRows,
    pinnedRowIds,
    renderedRowIndex = 0,
    row,
    rowVirtualizer,
    style,
    table,
    virtualRow,
    ...rest
}: Props<TData>) => {
    const {
        getState,
        options: {
            enableRowOrdering,
            enableRowPinning,
            enableStickyFooter,
            enableStickyHeader,
            layoutMode,
            mantineTableBodyRowProps,
            memoMode,
            renderDetailPanel,
            rowPinningDisplayMode,
        },
        refs: { tableFooterRef, tableHeadRef },
        setHoveredRow,
    } = table;
    const { density, draggingColumn, draggingRow, editingCell, editingRow, hoveredRow, isFullScreen, rowPinning } = getState();

    const visibleCells = row.getVisibleCells();

    const { virtualColumns, virtualPaddingLeft, virtualPaddingRight } = columnVirtualizer ?? {};

    const isRowSelected = getIsRowSelected({ row, table });
    const isRowPinned = enableRowPinning && row.getIsPinned();
    const isRowStickyPinned = isRowPinned && rowPinningDisplayMode?.includes("sticky") && "sticky";
    const isDraggingRow = draggingRow?.id === row.id;
    const isHoveredRow = hoveredRow?.id === row.id;

    const tableRowProps = {
        ...parseFromValuesOrFunc(mantineTableBodyRowProps, {
            renderedRowIndex,
            row,
            table,
        }),
        ...rest,
    };

    const [bottomPinnedIndex, topPinnedIndex] = useMemo(() => {
        if (!enableRowPinning || !isRowStickyPinned || !pinnedRowIds || !row.getIsPinned())
            return [];

        return [[...pinnedRowIds].reverse().indexOf(row.id), pinnedRowIds.indexOf(row.id)];
    }, [pinnedRowIds, rowPinning]);

    const tableHeadHeight = ((enableStickyHeader || isFullScreen) && tableHeadRef.current?.clientHeight) || 0;
    const tableFooterHeight = (enableStickyFooter && tableFooterRef.current?.clientHeight) || 0;

    const defaultRowHeightByDensity: Record<DensityState, number> = {
        lg: 61,
        md: 53,
        sm: 45,
        xl: 69,
        xs: 37,
    };

    const rowHeight
        // @ts-ignore
        = parseInt(tableRowProps?.style?.height, 10) || (defaultRowHeightByDensity[density] ?? defaultRowHeightByDensity["md"]);

    const handleDragEnter = (_e: DragEvent) => {
        if (enableRowOrdering && draggingRow) {
            setHoveredRow(row);
        }
    };

    const rowRef = useRef<HTMLTableRowElement | null>(null);

    let striped = tableRowProps.striped as boolean | string;

    if (striped) {
        if (striped === true) {
            striped = "odd";
        }

        if (striped === "odd" && renderedRowIndex % 2 !== 0) {
            striped = false;
        }

        if (striped === "even" && renderedRowIndex % 2 === 0) {
            striped = false;
        }
    }

    return (
        <>
            <ShadcnTableRow
                className={clsx(
                    "box-border w-full transition-all duration-150 ease-in-out",
                    layoutMode?.startsWith("grid") && "flex",
                    className,
                )}
                data-dragging-row={isDraggingRow || undefined}
                data-hovered-row-target={isHoveredRow || undefined}
                data-index={renderDetailPanel ? renderedRowIndex * 2 : renderedRowIndex}
                data-row-pinned={isRowStickyPinned || isRowPinned || undefined}
                data-selected={isRowSelected || undefined}
                data-striped={striped}
                onDragEnter={handleDragEnter}
                ref={(node: HTMLTableRowElement) => {
                    if (node) {
                        rowRef.current = node;
                        rowVirtualizer?.measureElement(node);
                    }
                }}
                style={{
                    ...tableRowProps?.style,
                    "--ano-pinned-row-bottom":
                        !virtualRow && bottomPinnedIndex !== undefined && isRowPinned
                            ? `${bottomPinnedIndex * rowHeight + (enableStickyFooter ? tableFooterHeight - 1 : 0)}`
                            : undefined,
                    "--ano-pinned-row-top": topPinnedIndex !== undefined && isRowPinned
                            ? `${topPinnedIndex * rowHeight + (enableStickyHeader || isFullScreen ? tableHeadHeight - 1 : 0)}`
                            : undefined,
                    ...style,
                }}
            >
                {virtualPaddingLeft ? <td style={{ display: "flex", width: virtualPaddingLeft }} /> : null}
                {children
                    || (virtualColumns ?? row.getVisibleCells()).map((cellOrVirtualCell, renderedColumnIndex) => {
                        let cell = cellOrVirtualCell as Cell<TData>;

                        if (columnVirtualizer) {
                            renderedColumnIndex = (cellOrVirtualCell as VirtualItem).index;
                            cell = visibleCells[renderedColumnIndex];
                        }

                        const cellProps = {
                            cell,
                            numRows,
                            renderedColumnIndex,
                            renderedRowIndex,
                            rowRef,
                            table,
                            virtualCell: columnVirtualizer ? (cellOrVirtualCell as VirtualItem) : undefined,
                        };

                        return memoMode === "cells"
                            && cell.column.columnDef.columnDefType === "data"
                            && !draggingColumn
                            && !draggingRow
                            && editingCell?.id !== cell.id
                            && editingRow?.id !== row.id
                            ? (
                            <Memo_TableBodyCell key={cell.id} {...cellProps} />
                            )
                            : (
                            <TableBodyCell key={cell.id} {...cellProps} />
                            );
                    })}
                {virtualPaddingRight ? <td style={{ display: "flex", width: virtualPaddingRight }} /> : null}
            </ShadcnTableRow>
            {renderDetailPanel && !row.getIsGrouped() && (
                <TableDetailPanel
                    parentRowRef={rowRef}
                    renderedRowIndex={renderedRowIndex}
                    row={row}
                    rowVirtualizer={rowVirtualizer}
                    striped={striped}
                    table={table}
                    virtualRow={virtualRow}
                />
            )}
        </>
    );
};

export const Memo_TableBodyRow = memo(TableBodyRow, (prev, next) => prev.row === next.row) as typeof TableBodyRow;
