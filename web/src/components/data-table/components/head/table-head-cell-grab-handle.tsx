import type { DragEvent, RefObject } from "react";

import type { CellValue, Column, RowData, TableInstance } from "../../types";
import { reorderColumn } from "../../utils/column-utils";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { GrabHandleButton } from "../buttons/grab-handle-button";

interface Props<TData extends RowData, TValue = CellValue> {
    className?: string;
    column: Column<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
    tableHeadCellRef: RefObject<HTMLTableCellElement>;
}

export const TableHeadCellGrabHandle = <TData extends RowData>({ className, column, style, table, tableHeadCellRef, ...rest }: Props<TData>) => {
    const {
        getState,
        options,
        setColumnOrder,
        setDraggingColumn,
        setHoveredColumn,
    } = table;
    const { columnDef } = column;
    const state = getState();
    
    // Handle missing properties with defaults
    const {
        enableColumnOrdering = false,
        mantineColumnDragHandleProps = {},
    } = (options as any) || {};
    
    const {
        columnOrder = [],
        draggingColumn = null,
        hoveredColumn = null,
    } = (state as any) || {};

    const arg = { column, table };
    const actionIconProps = {
        ...parseFromValuesOrFunc(mantineColumnDragHandleProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineColumnDragHandleProps, arg),
        className,
        style,
        ...rest,
    };

    const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
        actionIconProps?.onDragStart?.(event);
        setDraggingColumn(column);
        if (event.dataTransfer && event.dataTransfer.setDragImage && tableHeadCellRef.current) {
            event.dataTransfer.setDragImage(tableHeadCellRef.current as HTMLElement, 0, 0);
        }
    };

    const handleDragEnd = (event: DragEvent<HTMLButtonElement>) => {
        actionIconProps?.onDragEnd?.(event);

        if (hoveredColumn?.id === "drop-zone") {
            if (typeof column.toggleGrouping === 'function') {
                column.toggleGrouping();
            }
        } else if (enableColumnOrdering && hoveredColumn && hoveredColumn?.id !== draggingColumn?.id) {
            if (setColumnOrder && typeof setColumnOrder === 'function') {
                setColumnOrder(reorderColumn(column, hoveredColumn as Column<TData>, columnOrder));
            }
        }

        if (setDraggingColumn) setDraggingColumn(null);
        if (setHoveredColumn) setHoveredColumn(null);
    };

    return <GrabHandleButton actionIconProps={actionIconProps} onDragEnd={handleDragEnd} onDragStart={handleDragStart} table={table} />;
};
