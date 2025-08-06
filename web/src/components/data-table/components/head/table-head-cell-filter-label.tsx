import clsx from "clsx";
import { Filter } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { localizedFilterOption } from "../../fns/filter-fns";
import type { Header, RowData, TableInstance } from "../../types";
import { dataVariable } from "../../utils/utils";
import { TableHeadCellFilterContainer } from "./table-head-cell-filter-container";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHeadCellFilterLabel = <TData extends RowData>({ className, header, style, table, ...rest }: Props<TData>) => {
    const {
        options: { columnFilterDisplayMode, localization },
        refs: { filterInputRefs },
        setShowColumnFilters,
    } = table;
    const { column } = header;
    const { columnDef } = column;

    const filterValue = column.getFilterValue();

    const [popoverOpened, setPopoverOpened] = useState(false);

    const isFilterActive = (Array.isArray(filterValue) && filterValue.some(Boolean)) || (!!filterValue && !Array.isArray(filterValue));

    const isRangeFilter
        = columnDef.filterVariant === "range"
            || columnDef.filterVariant === "date-range"
            || ["between", "betweenInclusive", "inNumberRange"].includes(columnDef._filterFn);
    const currentFilterOption = columnDef._filterFn;
    const filterValueFn = columnDef.filterTooltipValueFn || ((value) => value as string);

    type FilterValueType = Parameters<typeof filterValueFn>[0];

    // Safety check for localization
    if (!localization) {
        return null;
    }

    const filterTooltip
        = columnFilterDisplayMode === "popover" && !isFilterActive
            ? localization.filterByColumn?.replace("{column}", String(columnDef.header))
            : localization.filteringByColumn
                .replace("{column}", String(columnDef.header))
                .replace("{filterType}", localizedFilterOption(localization, currentFilterOption))
                .replace(
                    "{filterValue}",
                    `"${
                        Array.isArray(column.getFilterValue())
                            ? (column.getFilterValue() as [FilterValueType, FilterValueType])
                                .map((v) => filterValueFn(v))
                                .join(`" ${isRangeFilter ? localization.and : localization.or} "`)
                            : filterValueFn(column.getFilterValue())
                    }"`,
                )
                .replace("\" \"", "");

    const shouldShow
        = columnFilterDisplayMode === "popover"
            || (!!column.getFilterValue() && !isRangeFilter)
            || (isRangeFilter && (!!(column.getFilterValue() as [any, any])?.[0] || !!(column.getFilterValue() as [any, any])?.[1]));

    if (!shouldShow) {
        return null;
    }

    const FilterButton = (
        <Button
            aria-label={filterTooltip}
            className={clsx(
                "ano-table-head-cell-filter-label-icon h-6 w-6 p-0 text-gray-600 transition-all duration-150 ease-in-out hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                isFilterActive && "text-blue-600 dark:text-blue-400",
                className,
            )}
            style={style}
            variant="ghost"
            {...dataVariable("active", isFilterActive)}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();

                if (columnFilterDisplayMode === "popover") {
                    setPopoverOpened((opened) => !opened);
                } else {
                    setShowColumnFilters(true);
                }

                setTimeout(() => {
                    const input = filterInputRefs.current[`${column.id}-0`];

                    input?.focus();
                    input?.select();
                }, 100);
            }}
            {...rest}
        >
            <Filter className="h-4 w-4" />
        </Button>
    );

    if (columnFilterDisplayMode === "popover") {
        return (
            <Popover onOpenChange={setPopoverOpened} open={popoverOpened}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>{FilterButton}</PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs">{filterTooltip}</p>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent
                    className="w-96"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.key === "Enter" && setPopoverOpened(false)}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <TableHeadCellFilterContainer header={header} table={table} />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{FilterButton}</TooltipTrigger>
            <TooltipContent>
                <p className="max-w-xs">{filterTooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
};
