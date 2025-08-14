import { Fragment, useMemo } from "react";

import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import type { FilterOption, Header, InternalFilterOption, Localization, RowData, TableInstance } from "../../types";

export const mrtFilterOptions = (localization: Localization): InternalFilterOption[] => [
    {
        divider: false,
        label: localization.filterFuzzy,
        option: "fuzzy",
        symbol: "≈",
    },
    {
        divider: false,
        label: localization.filterContains,
        option: "contains",
        symbol: "*",
    },
    {
        divider: false,
        label: localization.filterStartsWith,
        option: "startsWith",
        symbol: "a",
    },
    {
        divider: true,
        label: localization.filterEndsWith,
        option: "endsWith",
        symbol: "z",
    },
    {
        divider: false,
        label: localization.filterEquals,
        option: "equals",
        symbol: "=",
    },
    {
        divider: true,
        label: localization.filterNotEquals,
        option: "notEquals",
        symbol: "≠",
    },
    {
        divider: false,
        label: localization.filterBetween,
        option: "between",
        symbol: "⇿",
    },
    {
        divider: true,
        label: localization.filterBetweenInclusive,
        option: "betweenInclusive",
        symbol: "⬌",
    },
    {
        divider: false,
        label: localization.filterGreaterThan,
        option: "greaterThan",
        symbol: ">",
    },
    {
        divider: false,
        label: localization.filterGreaterThanOrEqualTo,
        option: "greaterThanOrEqualTo",
        symbol: "≥",
    },
    {
        divider: false,
        label: localization.filterLessThan,
        option: "lessThan",
        symbol: "<",
    },
    {
        divider: true,
        label: localization.filterLessThanOrEqualTo,
        option: "lessThanOrEqualTo",
        symbol: "≤",
    },
    {
        divider: false,
        label: localization.filterEmpty,
        option: "empty",
        symbol: "∅",
    },
    {
        divider: false,
        label: localization.filterNotEmpty,
        option: "notEmpty",
        symbol: "!∅",
    },
];

interface Props<TData extends RowData> {
    header?: Header<TData>;
    onSelect?: () => void;
    table: TableInstance<TData>;
}

export const FilterOptionMenu = <TData extends RowData>({ header, onSelect, table }: Props<TData>) => {
    const {
        getState,
        options: { columnFilterModeOptions, globalFilterFn, localization, renderColumnFilterModeMenuItems, renderGlobalFilterModeMenuItems },
        setColumnFilterFns,
        setGlobalFilterFn,
    } = table;
    const { columnFilterFns } = getState();

    const { column } = header ?? {};
    const { columnDef } = column ?? {};

    const internalFilterOptions = useMemo(
        () =>
            (header && column && columnDef ? columnDef.columnFilterModeOptions ?? columnFilterModeOptions : columnFilterModeOptions)
            ?? mrtFilterOptions(localization),
        [columnFilterModeOptions, columnDef, header, localization],
    );

    const handleSelectFilterMode = (option: FilterOption) => {
        if (header && column && columnDef) {
            // set column filter mode
            setColumnFilterFns((prev) => {
                return {
                    ...prev,
                    [column.id]: option,
                };
            });
        } else {
            // set global filter mode
            setGlobalFilterFn(option);
        }

        // reset filter value and/or perform new filter render
        if (header && column && columnDef) {
            const currentFilterValue = column.getFilterValue();
            const prevFilterMode = columnFilterFns[column.id];
            const emptyModes: FilterOption[] = ["empty", "notEmpty"];
            const arrModes = ["in", "notIn", "arrayContains", "arrayNotContains"];
            const rangeModes: FilterOption[] = ["between", "betweenInclusive", "inNumberRange"];
            const rangeVariants = ["range", "date-range", "range-slider"];

            // reset filter value and/or perform new filter render
            if (emptyModes.includes(option)) {
                // will now be empty/notEmpty filter mode
                if (currentFilterValue !== " " && !emptyModes.includes(prevFilterMode)) {
                    column.setFilterValue(" ");
                } else if (currentFilterValue) {
                    column.setFilterValue(currentFilterValue); // perform new filter render
                }
            } else if (columnDef?.filterVariant === "multi-select" || arrModes.includes(option as string)) {
                // will now be array filter mode
                if (currentFilterValue instanceof String || (currentFilterValue as any[])?.length) {
                    column.setFilterValue([]);
                } else if (currentFilterValue) {
                    column.setFilterValue(currentFilterValue); // perform new filter render
                }
            } else if (rangeVariants.includes(columnDef?.filterVariant as string) || rangeModes.includes(option as FilterOption)) {
                // will now be range filter mode
                if (!Array.isArray(currentFilterValue) || (!(currentFilterValue as any[])?.every((v) => v === "") && !rangeModes.includes(prevFilterMode))) {
                    column.setFilterValue(["", ""]);
                } else {
                    column.setFilterValue(currentFilterValue); // perform new filter render
                }
            } else {
                // will now be single value filter mode
                if (Array.isArray(currentFilterValue)) {
                    column.setFilterValue("");
                } else if (currentFilterValue === " " && emptyModes.includes(prevFilterMode)) {
                    column.setFilterValue(undefined);
                } else {
                    column.setFilterValue(currentFilterValue); // perform new filter render
                }
            }
        }

        onSelect?.();
    };

    const filterOption = !!header && columnDef ? columnDef._filterFn : globalFilterFn;

    return (
        <DropdownMenuContent>
            {(header && column && columnDef
                ? columnDef.renderColumnFilterModeMenuItems?.({
                    column: column as any,
                    internalFilterOptions,
                    onSelectFilterMode: handleSelectFilterMode,
                    table,
                })
                ?? renderColumnFilterModeMenuItems?.({
                    column: column as any,
                    internalFilterOptions,
                    onSelectFilterMode: handleSelectFilterMode,
                    table,
                })
                : renderGlobalFilterModeMenuItems?.({
                    internalFilterOptions,
                    onSelectFilterMode: handleSelectFilterMode,
                    table,
                }))
                ?? internalFilterOptions.map(({ divider, label, option, symbol }, index) => (
                    <Fragment key={index}>
                        <DropdownMenuItem
                            className={option === filterOption ? "bg-blue-50 text-blue-700" : ""}
                            onClick={() => handleSelectFilterMode(option as FilterOption)}
                        >
                            <span className="w-[2ch] -translate-y-[0.1em] text-center text-xl">{symbol}</span>
                            {label}
                        </DropdownMenuItem>
                        {divider && <DropdownMenuSeparator />}
                    </Fragment>
                ))}
        </DropdownMenuContent>
    );
};
