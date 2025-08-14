import clsx from "clsx";

import type { Header, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHeadCellResizeHandle = <TData extends RowData>({ className, header, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { columnResizeDirection, columnResizeMode },
        setColumnSizingInfo,
    } = table;
    const { density } = getState();
    const { column } = header;
    const handler = header.getResizeHandler();

    const offset
        = column.getIsResizing() && columnResizeMode === "onEnd"
            ? `translateX(${(columnResizeDirection === "rtl" ? -1 : 1) * (getState().columnSizingInfo.deltaOffset ?? 0)}px)`
            : undefined;

    return (
        <div
            onDoubleClick={() => {
                setColumnSizingInfo((old) => {
                    return {
                        ...old,
                        isResizingColumn: false,
                    };
                });
                column.resetSize();
            }}
            onMouseDown={handler}
            onTouchStart={handler}
            role="separator"
            style={{
                transform: offset,
                ...style,
            }}
            {...rest}
            className={clsx(
                "ano-table-head-cell-resize-handle absolute h-6 w-1 cursor-col-resize rounded bg-gray-400 hover:bg-blue-500 active:bg-blue-600",
                columnResizeDirection === "ltr" ? "right-0 -mr-2.5 md:-mr-4 xl:-mr-5.5" : "left-0 -ml-2.5 md:-ml-4 xl:-ml-5.5",
                !header.subHeaders.length && columnResizeMode === "onChange" && "active:opacity-0",
                density,
                className,
            )}
        />
    );
};
