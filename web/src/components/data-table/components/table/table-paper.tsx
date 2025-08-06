import clsx from "clsx";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { BottomToolbar } from "../toolbar/bottom-toolbar";
import { TopToolbar } from "../toolbar/top-toolbar";
import { TableContainer } from "./table-container";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TablePaper = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { enableBottomToolbar, enableTopToolbar, mantinePaperProps, renderBottomToolbar, renderTopToolbar },
        refs: { tablePaperRef },
    } = table;
    const { isFullScreen } = getState();

    const tablePaperProps = {
        ...parseFromValuesOrFunc(mantinePaperProps, { table }),
        className,
        style,
        ...rest,
    };

    const fullScreenStyles = isFullScreen
        ? {
            border: 0,
            borderRadius: 0,
            bottom: 0,
            height: "100vh",
            left: 0,
            margin: 0,
            maxHeight: "100vh",
            maxWidth: "100vw",
            padding: 0,
            position: "fixed" as const,
            right: 0,
            top: 0,
            width: "100vw",
            zIndex: 200,
        }
        : {};

    return (
        <div
            className={clsx(
                "ano-table-paper overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition-all duration-150 ease-in-out",
                isFullScreen && "ano-table-paper-fullscreen",
                tablePaperProps?.className,
            )}
            ref={(ref: HTMLDivElement) => {
                tablePaperRef.current = ref;

                if (tablePaperProps?.ref) {
                    tablePaperProps.ref.current = ref;
                }
            }}
            style={{
                ...fullScreenStyles,
                ...parseFromValuesOrFunc(tablePaperProps?.style, {}),
            }}
        >
            {enableTopToolbar && (parseFromValuesOrFunc(renderTopToolbar, { table }) ?? <TopToolbar table={table} />)}
            <TableContainer table={table} />
            {enableBottomToolbar && (parseFromValuesOrFunc(renderBottomToolbar, { table }) ?? <BottomToolbar table={table} />)}
        </div>
    );
};
