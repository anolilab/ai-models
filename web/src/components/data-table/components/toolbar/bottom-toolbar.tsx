import clsx from "clsx";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { ProgressBar } from "./progress-bar";
import { TablePagination } from "./table-pagination";
import { ToolbarAlertBanner } from "./toolbar-alert-banner";
import { ToolbarDropZone } from "./toolbar-drop-zone";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const BottomToolbar = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: {
            enablePagination,
            mantineBottomToolbarProps,
            positionPagination,
            positionToolbarAlertBanner,
            positionToolbarDropZone,
            renderBottomToolbarCustomActions,
        },
        refs: { bottomToolbarRef },
    } = table;
    const { isFullScreen } = getState();

    // Simple media query check - can be enhanced with a proper hook if needed
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 720;

    const toolbarProps = {
        ...parseFromValuesOrFunc(mantineBottomToolbarProps, {
            table,
        }),
        ...rest,
    };

    const stackAlertBanner = isMobile || !!renderBottomToolbarCustomActions;

    return (
        <div
            {...toolbarProps}
            className={clsx(
                "ano-bottom-toolbar relative right-0 bottom-0 left-0 border-t border-gray-300 bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1)_inset] dark:border-gray-700 dark:bg-gray-900",
                isFullScreen && "fixed bottom-0",
                className,
            )}
            ref={(node: HTMLDivElement) => {
                if (node) {
                    bottomToolbarRef.current = node;

                    if (toolbarProps?.ref) {
                        toolbarProps.ref.current = node;
                    }
                }
            }}
            style={style}
        >
            <ProgressBar isTopToolbar={false} table={table} />
            {positionToolbarAlertBanner === "bottom" && <ToolbarAlertBanner stackAlertBanner={stackAlertBanner} table={table} />}
            {["both", "bottom"].includes(positionToolbarDropZone ?? "") && <ToolbarDropZone table={table} />}
            <div className="box-border flex w-full items-center justify-between p-2">
                {renderBottomToolbarCustomActions ? renderBottomToolbarCustomActions({ table }) : <span />}
                <div className={clsx("absolute top-0 right-0 flex justify-end", stackAlertBanner && "relative")}>
                    {enablePagination && ["both", "bottom"].includes(positionPagination ?? "") && <TablePagination position="bottom" table={table} />}
                </div>
            </div>
        </div>
    );
};
