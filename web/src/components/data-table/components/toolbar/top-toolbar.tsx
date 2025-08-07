import clsx from "clsx";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { GlobalFilterTextInput } from "../inputs/global-filter-text-input";
import { ProgressBar } from "./progress-bar";
import { TablePagination } from "./table-pagination";
import { ToolbarAlertBanner } from "./toolbar-alert-banner";
import { ToolbarDropZone } from "./toolbar-drop-zone";
import { ToolbarInternalButtons } from "./toolbar-internal-buttons";

interface Props<TData extends RowData> {
    className?: string;
    features?: any;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TopToolbar = <TData extends RowData>({ className, features = {}, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: {
            enableGlobalFilter,
            enablePagination,
            enableToolbarInternalActions,
            mantineTopToolbarProps,
            positionGlobalFilter,
            positionPagination,
            positionToolbarAlertBanner,
            positionToolbarDropZone,
            renderTopToolbarCustomActions,
        },
        refs: { topToolbarRef },
    } = table;

    const { isFullScreen, showGlobalFilter } = getState();

    // Simple media query check - can be enhanced with a proper hook if needed
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 720;
    const isTablet = typeof window !== "undefined" && window.innerWidth <= 1024;

    const toolbarProps = {
        ...parseFromValuesOrFunc(mantineTopToolbarProps, { table }),
        ...rest,
    };

    const stackAlertBanner = isMobile || !!renderTopToolbarCustomActions || (showGlobalFilter && isTablet);

    const globalFilterProps = {
        style: !isTablet
            ? {
                zIndex: 3,
            }
            : undefined,
        table,
    };

    return (
        <div
            {...toolbarProps}
            className={clsx(
                "relative z-30 flex grid min-h-[3.5rem] flex-wrap-reverse items-start overflow-visible bg-white p-0 transition-all duration-150 ease-in-out dark:bg-gray-900",
                isFullScreen && "sticky top-0",
                className,
            )}
            ref={(node: HTMLDivElement) => {
                if (node) {
                    topToolbarRef.current = node;

                    if (toolbarProps?.ref) {
                        toolbarProps.ref.current = node;
                    }
                }
            }}
            style={style}
        >
            {positionToolbarAlertBanner === "top" && <ToolbarAlertBanner stackAlertBanner={stackAlertBanner} table={table} />}
            {["both", "top"].includes(positionToolbarDropZone ?? "") && <ToolbarDropZone table={table} />}
            <div
                className={clsx(
                    "flex items-center justify-between",
                    "absolute top-0 right-0 box-border flex w-full items-start justify-between p-2",
                    stackAlertBanner && "relative",
                )}
            >
                {enableGlobalFilter && positionGlobalFilter === "left" && <GlobalFilterTextInput {...globalFilterProps} />}
                {renderTopToolbarCustomActions?.({ table }) ?? <span />}
                {enableToolbarInternalActions
                    ? (
                    <div className="flex flex-wrap-reverse justify-end">
                        {enableGlobalFilter && positionGlobalFilter === "right" && <GlobalFilterTextInput {...globalFilterProps} />}
                        <ToolbarInternalButtons table={table} />
                    </div>
                    )
                    : enableGlobalFilter && positionGlobalFilter === "right" && <GlobalFilterTextInput {...globalFilterProps} />
                }
            </div>
            {enablePagination && ["both", "top"].includes(positionPagination ?? "") && (
                <div className="flex justify-end">
                    <TablePagination position="top" table={table} />
                </div>
            )}
            <ProgressBar isTopToolbar table={table} />
        </div>
    );
};
