import clsx from "clsx";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { localizedFilterOption } from "../../fns/filter-fns";
import type { Header, RowData, TableInstance } from "../../types";
import { FilterCheckbox } from "../inputs/filter-checkbox";
import { FilterRangeFields } from "../inputs/filter-range-fields";
import { FilterRangeSlider } from "../inputs/filter-range-slider";
import { FilterTextInput } from "../inputs/filter-text-input";
import { FilterOptionMenu } from "../menus/filter-option-menu";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHeadCellFilterContainer = <TData extends RowData>({ className, header, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options,
        refs,
    } = table;
    
    // Handle missing properties with defaults
    const {
        columnFilterDisplayMode = "subheader",
        columnFilterModeOptions = {},
        enableColumnFilterModes = false,
        localization = {},
    } = (options as any) || {};

    const { filterInputRefs } = refs || {};

    // Handle missing getState method
    const state = getState ? getState() : { showColumnFilters: false };
    const { showColumnFilters = false } = (state as any) || {};
    const { column } = header;
    const { columnDef } = column;

    const currentFilterOption = columnDef.filterFn;
    const allowedColumnFilterOptions = columnDef?.columnFilterModeOptions ?? columnFilterModeOptions;
    const showChangeModeButton
        = enableColumnFilterModes
            && columnDef.enableColumnFilterModes !== false
            && (allowedColumnFilterOptions === undefined || !!allowedColumnFilterOptions?.length);

    const shouldShow = showColumnFilters || columnFilterDisplayMode === "popover";

    if (!shouldShow) {
        return null;
    }

    return (
        <div className={clsx("flex flex-col", className)} style={style} {...rest}>
            <div className="flex items-end gap-2">
                {(() => {
                    if (columnDef.filterVariant === "checkbox") {
                        return <FilterCheckbox column={column} table={table} />;
                    }
                    if (columnDef.filterVariant === "range-slider") {
                        return <FilterRangeSlider header={header} table={table} />;
                    }
                    if (["date-range", "range"].includes(columnDef.filterVariant ?? "") ||
                        ["between", "betweenInclusive", "inNumberRange"].includes(columnDef.filterFn)) {
                        return <FilterRangeFields header={header} table={table} />;
                    }
                    return <FilterTextInput header={header} table={table} />;
                })()}
                {showChangeModeButton && (
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-label={localization?.changeFilterMode || 'Change filter mode'} className="h-8 w-8 p-0" size="sm" variant="ghost">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{localization?.changeFilterMode || 'Change filter mode'}</p>
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent>
                            <FilterOptionMenu
                                header={header}
                                onSelect={() => setTimeout(() => filterInputRefs.current[`${column.id}-0`]?.focus(), 100)}
                                table={table}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {showChangeModeButton
                ? (
                <span className={clsx("mt-1 text-xs whitespace-nowrap text-gray-500")}>
                    {localization?.filterMode?.replace("{filterType}", localizedFilterOption(localization || {}, currentFilterOption)) || `Filter mode: ${currentFilterOption}`}
                </span>
                )
                : null}
        </div>
    );
};
