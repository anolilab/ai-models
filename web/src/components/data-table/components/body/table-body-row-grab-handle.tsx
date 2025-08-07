import type { DragEvent, RefObject } from "react";

import type { Row, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { GrabHandleButton } from "../buttons/grab-handle-button";

interface Props<TData extends RowData> {
    className?: string;
    row: Row<TData>;
    rowRef: RefObject<HTMLTableRowElement>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableBodyRowGrabHandle = <TData extends RowData>({ className, row, rowRef, style, table, ...rest }: Props<TData>) => {
    const {
        options,
    } = table;
    
    // Handle missing properties with defaults
    const {
        mantineRowDragHandleProps = {},
    } = (options as any) || {};

    const actionIconProps = {
        ...parseFromValuesOrFunc(mantineRowDragHandleProps, {
            row,
            table,
        }),
        ...rest,
    };

    const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
        actionIconProps?.onDragStart?.(event);
        if (event.dataTransfer && event.dataTransfer.setDragImage && rowRef.current) {
            event.dataTransfer.setDragImage(rowRef.current as HTMLElement, 0, 0);
        }
        if (table.setDraggingRow) {
            table.setDraggingRow(row as any);
        }
    };

    const handleDragEnd = (event: DragEvent<HTMLButtonElement>) => {
        actionIconProps?.onDragEnd?.(event);
        if (table.setDraggingRow) table.setDraggingRow(null);
        if (table.setHoveredRow) table.setHoveredRow(null);
    };

    return <GrabHandleButton actionIconProps={actionIconProps} onDragEnd={handleDragEnd} onDragStart={handleDragStart} table={table} />;
};
