import clsx from "clsx";
import { X } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { localizedFilterOption } from "../../fns/filter-fns";
import type { Header, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    rangeFilterIndex?: number;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const FilterTextInput = <TData extends RowData>({ className, header, rangeFilterIndex, style, table, ...rest }: Props<TData>) => {
    const {
        options: {
            columnFilterDisplayMode,
            columnFilterModeOptions,
            localization,
            mantineFilterAutocompleteProps,
            mantineFilterDateInputProps,
            mantineFilterMultiSelectProps = {
                clearable: true,
            },
            mantineFilterSelectProps,
            mantineFilterTextInputProps,
            manualFiltering,
        },
        refs: { filterInputRefs },
        setColumnFilterFns,
    } = table;
    const { column } = header;
    const { columnDef } = column;

    const arg = { column, rangeFilterIndex, table };
    const textInputProps = {
        ...parseFromValuesOrFunc(mantineFilterTextInputProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterTextInputProps, arg),
        ...rest,
    };

    const selectProps = {
        ...parseFromValuesOrFunc(mantineFilterSelectProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterSelectProps, arg),
    };

    const multiSelectProps = {
        ...parseFromValuesOrFunc(mantineFilterMultiSelectProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterMultiSelectProps, arg),
    };

    const dateInputProps = {
        ...parseFromValuesOrFunc(mantineFilterDateInputProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterDateInputProps, arg),
    };

    const autoCompleteProps = {
        ...parseFromValuesOrFunc(mantineFilterAutocompleteProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterAutocompleteProps, arg),
    };

    const isRangeFilter = columnDef.filterVariant === "range" || columnDef.filterVariant === "date-range" || rangeFilterIndex !== undefined;
    const isSelectFilter = columnDef.filterVariant === "select";
    const isMultiSelectFilter = columnDef.filterVariant === "multi-select";
    const isDateFilter = columnDef.filterVariant === "date" || columnDef.filterVariant === "date-range";
    const isAutoCompleteFilter = columnDef.filterVariant === "autocomplete";
    const allowedColumnFilterOptions = columnDef?.columnFilterModeOptions ?? columnFilterModeOptions;

    const currentFilterOption = columnDef._filterFn;
    const filterChipLabel = ["empty", "notEmpty"].includes(currentFilterOption) ? localizedFilterOption(localization, currentFilterOption) : "";
    const filterPlaceholder = !isRangeFilter
        ? textInputProps?.placeholder ?? localization.filterByColumn?.replace("{column}", String(columnDef.header))
        : rangeFilterIndex === 0
            ? localization.min
            : rangeFilterIndex === 1
                ? localization.max
                : "";

    const facetedUniqueValues = column.getFacetedUniqueValues();

    const filterSelectOptions = useMemo(
        () =>
            (
                autoCompleteProps?.data
                ?? selectProps?.data
                ?? multiSelectProps?.data
                ?? ((isAutoCompleteFilter || isSelectFilter || isMultiSelectFilter) && facetedUniqueValues
                    ? Array.from(facetedUniqueValues.keys())
                        .filter((key) => key !== null)
                        .sort((a, b) => a.localeCompare(b))
                    : [])
            )
                // @ts-ignore
                .filter((o: any) => o !== undefined && o !== null),
        [autoCompleteProps?.data, facetedUniqueValues, isAutoCompleteFilter, isMultiSelectFilter, isSelectFilter, multiSelectProps?.data, selectProps?.data],
    );

    const isMounted = useRef(false);

    const [filterValue, setFilterValue] = useState<any>(() =>
        (isMultiSelectFilter
            ? (column.getFilterValue() as string[]) || []
            : isRangeFilter
                ? (column.getFilterValue() as [string, string])?.[rangeFilterIndex as number] || ""
                : (column.getFilterValue() as string) ?? ""),
    );

    // Custom debounce implementation
    const [debouncedFilterValue, setDebouncedFilterValue] = useState(filterValue);

    useEffect(() => {
        const timer = setTimeout(
            () => {
                setDebouncedFilterValue(filterValue);
            },
            manualFiltering ? 400 : 200,
        );

        return () => clearTimeout(timer);
    }, [filterValue, manualFiltering]);

    // send debounced filterValue to table instance
    useEffect(() => {
        if (!isMounted.current)
            return;

        if (isRangeFilter) {
            column.setFilterValue((old: [string, string]) => {
                const newFilterValues = Array.isArray(old) ? old : ["", ""];

                newFilterValues[rangeFilterIndex as number] = debouncedFilterValue as string;

                return newFilterValues;
            });
        } else {
            column.setFilterValue(debouncedFilterValue ?? undefined);
        }
    }, [debouncedFilterValue]);

    // receive table filter value and set it to local state
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;

            return;
        }

        const tableFilterValue = column.getFilterValue();

        if (tableFilterValue === undefined) {
            handleClear();
        } else if (isRangeFilter && rangeFilterIndex !== undefined) {
            setFilterValue(((tableFilterValue ?? ["", ""]) as [string, string])[rangeFilterIndex]);
        } else {
            setFilterValue(tableFilterValue ?? "");
        }
    }, [column.getFilterValue()]);

    const handleClear = () => {
        if (isMultiSelectFilter) {
            setFilterValue([]);
            column.setFilterValue([]);
        } else if (isRangeFilter) {
            setFilterValue("");
            column.setFilterValue((old: [string, string]) => {
                const newFilterValues = Array.isArray(old) ? old : ["", ""];

                newFilterValues[rangeFilterIndex as number] = "";

                return newFilterValues;
            });
        } else {
            setFilterValue("");
            column.setFilterValue(undefined);
        }
    };

    const handleClearEmptyFilterChip = () => {
        if (isMultiSelectFilter) {
            setFilterValue([]);
            column.setFilterValue([]);
        } else {
            setFilterValue("");
            column.setFilterValue(undefined);
        }

        setColumnFilterFns((prev) => {
            return {
                ...prev,
                [header.id]: allowedColumnFilterOptions?.[0] ?? "fuzzy",
            };
        });
    };

    const { className: inputClassName, ...commonProps } = {
        "aria-label": filterPlaceholder,
        className: clsx(
            "ano-filter-text-input font-normal border-b-2 border-gray-300 dark:border-gray-700 min-w-auto w-full",
            isDateFilter ? "min-w-[125px]" : isRangeFilter ? "min-w-[80px]" : !filterChipLabel && "min-w-[100px]",
        ),
        disabled: !!filterChipLabel,
        onClick: (event: MouseEvent<HTMLInputElement>) => event.stopPropagation(),
        placeholder: filterPlaceholder,
        style: {
            ...isMultiSelectFilter
                ? multiSelectProps?.style
                : isSelectFilter
                    ? selectProps?.style
                    : isDateFilter
                        ? dateInputProps?.style
                        : textInputProps?.style,
            ...style,
        },
        title: filterPlaceholder,
        value: isMultiSelectFilter && !Array.isArray(filterValue) ? [] : filterValue,
    } as const;

    const ClearButton = filterValue
        ? (
        <Button
            aria-label={localization.clearFilter}
            className="h-6 w-6 p-0"
            onClick={handleClear}
            size="sm"
            title={localization.clearFilter ?? ""}
            variant="ghost"
        >
            <X className="h-3 w-3" />
        </Button>
        )
        : null;

    if (columnDef.Filter) {
        return <>{columnDef.Filter?.({ column, header, rangeFilterIndex, table })}</>;
    }

    if (filterChipLabel) {
        return (
            <div style={commonProps.style}>
                <Badge className={clsx("m-1.5 cursor-pointer")} onClick={handleClearEmptyFilterChip} variant="secondary">
                    {filterChipLabel}
                    {ClearButton}
                </Badge>
            </div>
        );
    }

    if (isMultiSelectFilter) {
        // For now, use a simple text input for multi-select
        // TODO: Implement proper multi-select with Shadcn
        return (
            <Input
                {...commonProps}
                className={clsx(inputClassName, multiSelectProps.className)}
                onChange={(e) => setFilterValue(e.target.value)}
                ref={(node) => {
                    if (node) {
                        filterInputRefs.current[`${column.id}-${rangeFilterIndex ?? 0}`] = node;

                        if (multiSelectProps.ref) {
                            multiSelectProps.ref.current = node;
                        }
                    }
                }}
                style={commonProps.style}
            />
        );
    }

    if (isSelectFilter) {
        return (
            <Select onValueChange={(value) => setFilterValue(value)} value={filterValue?.toString() || ""}>
                <SelectTrigger
                    {...commonProps}
                    className={clsx(inputClassName, selectProps.className)}
                    ref={(node) => {
                        if (node) {
                            filterInputRefs.current[`${column.id}-${rangeFilterIndex ?? 0}`] = node;

                            if (selectProps.ref) {
                                selectProps.ref.current = node;
                            }
                        }
                    }}
                    style={commonProps.style}
                >
                    <SelectValue placeholder={filterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    {filterSelectOptions.map((option: string) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (isDateFilter) {
        // For now, use a simple text input for date
        // TODO: Implement proper date input with Shadcn
        return (
            <Input
                {...commonProps}
                className={clsx(inputClassName, dateInputProps.className)}
                onChange={(e) => setFilterValue(e.target.value)}
                ref={(node) => {
                    if (node) {
                        filterInputRefs.current[`${column.id}-${rangeFilterIndex ?? 0}`] = node;

                        if (dateInputProps.ref) {
                            dateInputProps.ref.current = node;
                        }
                    }
                }}
                style={commonProps.style}
                type="date"
            />
        );
    }

    if (isAutoCompleteFilter) {
        // For now, use a simple text input for autocomplete
        // TODO: Implement proper autocomplete with Shadcn
        return (
            <Input
                {...commonProps}
                className={clsx(inputClassName, autoCompleteProps.className)}
                onChange={(e) => setFilterValue(e.target.value)}
                ref={(node) => {
                    if (node) {
                        filterInputRefs.current[`${column.id}-${rangeFilterIndex ?? 0}`] = node;

                        if (autoCompleteProps.ref) {
                            autoCompleteProps.ref.current = node;
                        }
                    }
                }}
                style={commonProps.style}
            />
        );
    }

    return (
        <Input
            {...commonProps}
            className={clsx(inputClassName, textInputProps.className)}
            onChange={(e) => setFilterValue(e.target.value)}
            ref={(node) => {
                if (node) {
                    filterInputRefs.current[`${column.id}-${rangeFilterIndex ?? 0}`] = node;

                    if (textInputProps.ref) {
                        textInputProps.ref.current = node;
                    }
                }
            }}
            style={commonProps.style}
        />
    );
};
