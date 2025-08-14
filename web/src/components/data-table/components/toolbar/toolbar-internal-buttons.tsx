import clsx from "clsx";

import type { RowData, TableInstance } from "../../types";
import { ShowHideColumnsButton } from "../buttons/show-hide-columns-button";
import { ToggleDensePaddingButton } from "../buttons/toggle-dense-padding-button";
import { ToggleFiltersButton } from "../buttons/toggle-filters-button";
import { ToggleFullScreenButton } from "../buttons/toggle-full-screen-button";
import { ToggleGlobalFilterButton } from "../buttons/toggle-global-filter-button";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const ToolbarInternalButtons = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        options: {
            columnFilterDisplayMode,
            enableColumnFilters,
            enableColumnOrdering,
            enableColumnPinning,
            enableDensityToggle,
            enableFilters,
            enableFullScreenToggle,
            enableGlobalFilter,
            enableHiding,
            initialState,
            renderToolbarInternalActions,
        },
    } = table;

    return (
        <div {...rest} className={clsx("ano-toolbar-internal-buttons z-10 ml-1 flex items-center gap-2", className)} style={style}>
            {renderToolbarInternalActions?.({ table }) ?? (
                <>
                    {enableFilters && enableGlobalFilter && !initialState?.showGlobalFilter && <ToggleGlobalFilterButton table={table} />}
                    {enableFilters && enableColumnFilters && columnFilterDisplayMode !== "popover" && <ToggleFiltersButton table={table} />}
                    {(enableHiding || enableColumnOrdering || enableColumnPinning) && <ShowHideColumnsButton table={table} />}
                    {enableDensityToggle && <ToggleDensePaddingButton table={table} />}
                    {enableFullScreenToggle && <ToggleFullScreenButton table={table} />}
                </>
            )}
        </div>
    );
};
