import clsx from "clsx";
import { useEffect } from "react";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { BottomToolbar } from "../toolbar/bottom-toolbar";
import { TopToolbar } from "../toolbar/top-toolbar";
import { TableContainer } from "./table-container";

interface Props<TData extends RowData> {
    className?: string;
    features?: any;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TablePaper = <TData extends RowData>({ className, features = {}, style, table, ...rest }: Props<TData>): React.JSX.Element => {
    const {
        getState,
        options: { enableBottomToolbar, enableTopToolbar, mantinePaperProps, renderBottomToolbar, renderTopToolbar },
        refs: { tablePaperRef },
    } = table;
    const { isFullScreen } = getState();

    // Force re-render and handle body overflow when fullscreen changes
    useEffect(() => {
        if (isFullScreen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.classList.add('ano-table-fullscreen-active');
        } else {
            document.body.style.overflow = '';
            document.documentElement.classList.remove('ano-table-fullscreen-active');
        }
    }, [isFullScreen]);

    const tablePaperProps = {
        ...parseFromValuesOrFunc(mantinePaperProps, { table }),
        className,
        style,
        ...rest,
    };

    const fullScreenStyles = isFullScreen
        ? {
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            margin: 0,
            borderRadius: 0,
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
        }
        : {};

    return (
        <div
            className={clsx(
                'ano-table-paper',
                isFullScreen && 'ano-table-paper-fullscreen',
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
            {enableTopToolbar && (parseFromValuesOrFunc(renderTopToolbar, { table }) ?? <TopToolbar features={features} table={table} />)}
            <TableContainer table={table} />
            {enableBottomToolbar && (parseFromValuesOrFunc(renderBottomToolbar, { table }) ?? <BottomToolbar features={features} table={table} />)}
        </div>
    );
};
