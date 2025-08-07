import type { Row } from "@tanstack/react-table";
import { useMemo } from "react";

import type {
    Column,
    ColumnDef,
    ColumnOrderState,
    DefinedColumnDef,
    DefinedTableOptions,
    DropdownOption,
    FilterOption,
    Header,
    RowData,
    TableInstance,
} from "../types";

export const getColumnId = <TData extends RowData>(columnDef: ColumnDef<TData>): string =>
    columnDef.id ?? columnDef.accessorKey?.toString?.() ?? columnDef.header;

export const getAllLeafColumnDefs = <TData extends RowData>(columns: ColumnDef<TData>[]): ColumnDef<TData>[] => {
    const allLeafColumnDefs: ColumnDef<TData>[] = [];
    const getLeafColumns = (cols: ColumnDef<TData>[]) => {
        cols.forEach((col) => {
            if (col.columns) {
                getLeafColumns(col.columns);
            } else {
                allLeafColumnDefs.push(col);
            }
        });
    };

    getLeafColumns(columns);

    return allLeafColumnDefs;
};

export const prepareColumns = <TData extends RowData>({
    columnDefs,
    tableOptions,
}: {
    columnDefs: ColumnDef<TData>[];
    tableOptions: DefinedTableOptions<TData>;
}): DefinedColumnDef<TData>[] => {
    const { aggregationFns = {}, defaultDisplayColumn, filterFns = {}, sortingFns = {}, state: { columnFilterFns = {} } = {} } = tableOptions;

    return columnDefs.map((columnDef) => {
        // assign columnId
        if (!columnDef.id)
            columnDef.id = getColumnId(columnDef);

        // assign columnDefType
        if (!columnDef.columnDefType)
            columnDef.columnDefType = "data";

        if (columnDef.columns?.length) {
            columnDef.columnDefType = "group";
            // recursively prepare columns if this is a group column
            columnDef.columns = prepareColumns({
                columnDefs: columnDef.columns,
                tableOptions,
            });
        } else if (columnDef.columnDefType === "data") {
            // assign aggregationFns if multiple aggregationFns are provided
            if (Array.isArray(columnDef.aggregationFn)) {
                const aggFns = columnDef.aggregationFn as string[];

                columnDef.aggregationFn = (columnId: string, leafRows: Row<TData>[], childRows: Row<TData>[]) =>
                    aggFns.map((fn) => aggregationFns[fn]?.(columnId, leafRows, childRows));
            }

            // assign filterFns
            if (Object.keys(filterFns).includes(columnFilterFns[columnDef.id])) {
                columnDef.filterFn = filterFns[columnFilterFns[columnDef.id]] ?? filterFns.fuzzy;
                (columnDef as DefinedColumnDef<TData>)._filterFn = columnFilterFns[columnDef.id];
            }

            // assign sortingFns
            if (Object.keys(sortingFns).includes(columnDef.sortingFn as string)) {
                columnDef.sortingFn = sortingFns[columnDef.sortingFn];
            }
        } else if (columnDef.columnDefType === "display") {
            columnDef = {
                ...(defaultDisplayColumn as ColumnDef<TData>),
                ...columnDef,
            };
        }

        return columnDef;
    }) as DefinedColumnDef<TData>[];
};

export const reorderColumn = <TData extends RowData>(
    draggedColumn: Column<TData>,
    targetColumn: Column<TData>,
    columnOrder: ColumnOrderState,
): ColumnOrderState => {
    if (draggedColumn.getCanPin && typeof draggedColumn.getCanPin === 'function' && draggedColumn.getCanPin()) {
        if (draggedColumn.pin && typeof draggedColumn.pin === 'function' && targetColumn.getIsPinned && typeof targetColumn.getIsPinned === 'function') {
            draggedColumn.pin(targetColumn.getIsPinned());
        }
    }

    const newColumnOrder = [...columnOrder];

    newColumnOrder.splice(newColumnOrder.indexOf(targetColumn.id), 0, newColumnOrder.splice(newColumnOrder.indexOf(draggedColumn.id), 1)[0]);

    return newColumnOrder;
};

export const getDefaultColumnFilterFn = <TData extends RowData>(columnDef: ColumnDef<TData>): FilterOption => {
    const { filterVariant } = columnDef;

    if (filterVariant === "multi-select")
        return "arrIncludesSome";

    if (filterVariant?.includes("range"))
        return "betweenInclusive";

    if (filterVariant === "select" || filterVariant === "checkbox")
        return "equals";

    return "fuzzy";
};

export const getColumnFilterInfo = <TData extends RowData>({ header, table }: { header: Header<TData>; table: TableInstance<TData> }) => {
    const {
        options,
    } = table;
    
    // Handle missing properties with defaults
    const {
        columnFilterModeOptions = {},
    } = (options as any) || {};
    const { column } = header;
    const { columnDef } = column;
    const { filterVariant } = columnDef;

    const isDateFilter = !!(filterVariant?.startsWith("date") || filterVariant?.startsWith("time"));
    const isAutocompleteFilter = filterVariant === "autocomplete";
    const isRangeFilter = filterVariant?.includes("range") || ["between", "betweenInclusive", "inNumberRange"].includes(columnDef._filterFn);
    const isSelectFilter = filterVariant === "select";
    const isMultiSelectFilter = filterVariant === "multi-select";
    const isTextboxFilter = ["autocomplete", "text"].includes(filterVariant!) || (!isSelectFilter && !isMultiSelectFilter);
    const currentFilterOption = columnDef._filterFn;

    const allowedColumnFilterOptions = columnDef?.columnFilterModeOptions ?? columnFilterModeOptions;

    const facetedUniqueValues = column.getFacetedUniqueValues();

    return {
        allowedColumnFilterOptions,
        currentFilterOption,
        facetedUniqueValues,
        isAutocompleteFilter,
        isDateFilter,
        isMultiSelectFilter,
        isRangeFilter,
        isSelectFilter,
        isTextboxFilter,
    } as const;
};

export const useDropdownOptions = <TData extends RowData>({
    header,
    table,
}: {
    header: Header<TData>;
    table: TableInstance<TData>;
}): DropdownOption[] | undefined => {
    const { column } = header;
    const { columnDef } = column;
    const { facetedUniqueValues, isAutocompleteFilter, isMultiSelectFilter, isSelectFilter } = getColumnFilterInfo({ header, table });

    return useMemo<DropdownOption[] | undefined>(
        () =>
            columnDef.filterSelectOptions
            ?? ((isSelectFilter || isMultiSelectFilter || isAutocompleteFilter) && facetedUniqueValues
                ? Array.from(facetedUniqueValues.keys())
                    .filter((value) => value !== null && value !== undefined)
                    .sort((a, b) => String(a).localeCompare(String(b)))
                : undefined),
        [columnDef.filterSelectOptions, facetedUniqueValues, isMultiSelectFilter, isSelectFilter],
    );
};
