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
        options: { mantineRowDragHandleProps },
    } = table;

    const actionIconProps = {
        ...parseFromValuesOrFunc(mantineRowDragHandleProps, {
            row,
            table,
        }),
        ...rest,
    };

    const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
        actionIconProps?.onDragStart?.(event);
        event.dataTransfer.setDragImage(rowRef.current as HTMLElement, 0, 0);
        table.setDraggingRow(row as any);
    };

    const handleDragEnd = (event: DragEvent<HTMLButtonElement>) => {
        actionIconProps?.onDragEnd?.(event);
        table.setDraggingRow(null);
        table.setHoveredRow(null);
    };

    return <GrabHandleButton actionIconProps={actionIconProps} onDragEnd={handleDragEnd} onDragStart={handleDragStart} table={table} />;
};
