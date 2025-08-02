"use client";

import type { ColumnDef, ColumnResizeMode, ColumnSizingState } from "@tanstack/react-table";
import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { VirtualizedTable } from "@/components/data-table/virtual-table";

import type { ColumnConfig, FilterStrategy } from "./filter/core/types";
import { useDataTableFilters } from "./filter/hooks/use-data-table-filters";
import { createTSTColumns, createTSTFilters } from "./filter/integrations/tanstack-table";
import { DataTablePagination } from "./pagination";
import { RegularTable } from "./regular-table";
import DataTableToolbar from "./toolbar";
import { cleanupColumnResizing, initializeColumnSizes, trackColumnResizing } from "./utils/column-sizing";
import type { DataTransformFunction, ExportableData } from "./utils/export-utils";
import { createKeyboardNavigationHandler } from "./utils/keyboard-navigation";
import { usePerformanceMonitor } from "./utils/performance-utils";
import type { TableConfig } from "./utils/table-config";
import { useTableConfig } from "./utils/table-config";
import { createColumnSizingHandler, createPaginationHandler } from "./utils/table-state-handlers";

type RowSelectionUpdater = (prev: Record<string, boolean>) => Record<string, boolean>;

interface DataTableProps<TData extends ExportableData, TValue> {
    classes?: {
        root?: string;
        table?: string;
        toolbar?: string;
    };

    // Allow overriding the table configuration
    config?: Partial<TableConfig>;

    containerHeight?: number;

    // Data to display in the table
    data: TData[];

    // Default pagination configuration
    defaultPagination?: {
        page?: number;
        pageSize?: number;
    };

    // Default sorting configuration
    defaultSorting?: {
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    };

    // Export configuration
    exportConfig: {
        columnMapping: Record<string, string>;
        columnWidths: { wch: number }[];
        entityName: string;
        headers: string[];
        transformFunction?: DataTransformFunction<TData>;
    };

    // External column filters (for data-table-filter integration)
    externalColumnFilters?: { id: string; value: unknown }[];
    // New filter system props
    filterColumns?: ColumnConfig<TData>[];
    filterStrategy?: FilterStrategy;

    // Column definitions generator
    getColumns: (handleRowDeselection: ((rowId: string) => void) | null | undefined) => ColumnDef<TData, TValue>[];
    // ID field in TData for tracking selected items
    idField: keyof TData;
    // Custom page size options
    pageSizeOptions?: number[];

    // Custom toolbar content render function
    renderToolbarContent?: (props: {
        allSelectedIds: (string | number)[];
        resetSelection: () => void;
        selectedRows: TData[];
        totalSelectedCount: number;
    }) => ReactNode;

    // Virtualization options (only used when enableRowVirtualization is true)
    virtualizationOptions?: {
        estimatedRowHeight?: number;
        overscan?: number;
    };
}

// Add these types and reducers before the DataTable component
type TableState = {
    columnFilters: { id: string; value: unknown }[];
    columnSizing: ColumnSizingState;
    columnVisibility: Record<string, boolean>;
    pagination: {
        page: number;
        pageSize: number;
    };
    selectedItemIds: Record<string, boolean> | Set<string>;
    sorting: {
        sortBy?: string;
        sortOrder: "asc" | "desc";
    };
};

type TableAction
    = | { payload: { page?: number; pageSize?: number }; type: "SET_PAGINATION" }
        | { payload: { sortBy?: string; sortOrder?: "asc" | "desc" }; type: "SET_SORTING" }
        | { payload: Record<string, boolean>; type: "SET_COLUMN_VISIBILITY" }
        | { payload: { id: string; value: unknown }[]; type: "SET_COLUMN_FILTERS" }
        | { payload: ColumnSizingState; type: "SET_COLUMN_SIZING" }
        | { payload: Record<string, boolean> | Set<string>; type: "SET_SELECTED_ITEMS" }
        | { payload: string; type: "ADD_SELECTED_ITEM" }
        | { payload: string; type: "REMOVE_SELECTED_ITEM" }
        | { type: "CLEAR_SELECTIONS" };

function tableReducer(state: TableState, action: TableAction): TableState {
    switch (action.type) {
        case "ADD_SELECTED_ITEM": {
            const isVirtualized = state.selectedItemIds instanceof Set;

            if (isVirtualized) {
                const newSet = new Set(state.selectedItemIds as Set<string>);

                newSet.add(action.payload);

                return { ...state, selectedItemIds: newSet };
            }

            return {
                ...state,
                selectedItemIds: {
                    ...(state.selectedItemIds as Record<string, boolean>),
                    [action.payload]: true,
                },
            };
        }
        case "CLEAR_SELECTIONS": {
            const isVirtualized = state.selectedItemIds instanceof Set;

            return {
                ...state,
                selectedItemIds: isVirtualized ? new Set() : {},
            };
        }
        case "REMOVE_SELECTED_ITEM": {
            const isVirtualized = state.selectedItemIds instanceof Set;

            if (isVirtualized) {
                const newSet = new Set(state.selectedItemIds as Set<string>);

                newSet.delete(action.payload);

                return { ...state, selectedItemIds: newSet };
            }

            const newRecord = { ...(state.selectedItemIds as Record<string, boolean>) };

            delete newRecord[action.payload];

            return { ...state, selectedItemIds: newRecord };
        }
        case "SET_COLUMN_FILTERS":
            return {
                ...state,
                columnFilters: action.payload,
            };
        case "SET_COLUMN_SIZING":
            return {
                ...state,
                columnSizing: action.payload,
            };
        case "SET_COLUMN_VISIBILITY":
            return {
                ...state,
                columnVisibility: action.payload,
            };
        case "SET_PAGINATION":
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload,
                },
            };
        case "SET_SELECTED_ITEMS":
            return {
                ...state,
                selectedItemIds: action.payload,
            };
        case "SET_SORTING":
            return {
                ...state,
                sorting: {
                    ...state.sorting,
                    ...action.payload,
                },
            };
        default:
            return state;
    }
}

const DataTable = <TData extends ExportableData, TValue>({
    classes = {},
    config = {},
    containerHeight,
    data,
    defaultPagination = {},
    defaultSorting = {},
    exportConfig,
    externalColumnFilters,
    filterColumns,
    filterStrategy = "client",
    getColumns,
    idField = "id" as keyof TData,
    pageSizeOptions,
    renderToolbarContent,
    virtualizationOptions = {},
}: DataTableProps<TData, TValue>): ReactNode => {
    // Performance monitoring (disabled in test environment)
    if (process.env.NODE_ENV !== "test") {
        usePerformanceMonitor("DataTable");
    }

    // Load table configuration with any overrides
    const tableConfig = useTableConfig(config);

    // Consolidated state management using useReducer
    const [state, dispatch] = useReducer(tableReducer, {
        columnFilters: [],
        columnSizing: {},
        columnVisibility: {},
        pagination: {
            page: defaultPagination.page ?? 1,
            pageSize: defaultPagination.pageSize ?? 10,
        },
        selectedItemIds: tableConfig.enableRowVirtualization ? new Set<string>() : {},
        sorting: {
            sortBy: defaultSorting.sortBy ?? "lastUpdated",
            sortOrder: defaultSorting.sortOrder ?? "desc",
        },
    });

    // Destructure state for easier access
    const { columnFilters, columnSizing, columnVisibility, pagination, selectedItemIds, sorting } = state;

    // Ref to store current rowSelection to avoid circular dependency
    const rowSelectionRef = useRef<Record<string, boolean>>({});

    // Set up data-table-filter if filterColumns are provided
    const filterData = useMemo(() => data, [data]);
    

    
    const {
        actions,
        columns: filterColumnsData,
        filters,
        strategy: filterStrategyData,
    } = useDataTableFilters({
        columnsConfig: filterColumns || [],
        data: filterData,
        strategy: filterStrategy,
    });
    


    // Convert filter system filters to TanStack Table column filters
    const convertedColumnFilters = useMemo(() => {
        if (!filters || filters.length === 0) {
            return [];
        }

        return createTSTFilters(filters);
    }, [filters]);

    // Use converted filters as external column filters with better memoization
    const effectiveColumnFilters = useMemo(() => {
        if (convertedColumnFilters.length > 0) {
            return convertedColumnFilters;
        }

        if (externalColumnFilters && externalColumnFilters.length > 0) {
            return externalColumnFilters;
        }

        return columnFilters;
    }, [convertedColumnFilters, externalColumnFilters, columnFilters]);



    // Helper functions to handle both Record and Set selection states
    const isItemSelected = useCallback(
        (itemId: string): boolean =>
            (tableConfig.enableRowVirtualization ? (selectedItemIds as Set<string>).has(itemId) : !!(selectedItemIds as Record<string, boolean>)[itemId]),
        [selectedItemIds, tableConfig.enableRowVirtualization],
    );

    const removeSelectedItem = useCallback((itemId: string) => {
        dispatch({ payload: itemId, type: "REMOVE_SELECTED_ITEM" });
    }, []);

    const clearAllSelections = useCallback(() => {
        dispatch({ type: "CLEAR_SELECTIONS" });
    }, []);

    const getSelectedCount = useCallback((): number => {
        if (tableConfig.enableRowVirtualization) {
            return (selectedItemIds as Set<string>).size;
        }

        return Object.keys(selectedItemIds as Record<string, boolean>).length;
    }, [selectedItemIds, tableConfig.enableRowVirtualization]);

    const getSelectedIds = useCallback((): (string | number)[] => {
        if (tableConfig.enableRowVirtualization) {
            return Array.from(selectedItemIds as Set<string>);
        }

        return Object.keys(selectedItemIds as Record<string, boolean>);
    }, [selectedItemIds, tableConfig.enableRowVirtualization]);

    const dataItems = useMemo(() => data || [], [data]);

    const rowSelection = useMemo(() => {
        if (!dataItems.length)
            return {};

        const selection: Record<string, boolean> = {};
        const dataLength = dataItems.length;

        for (let i = 0; i < dataLength; i++) {
            const item = dataItems[i];
            const itemId = String(item[idField]);

            if (isItemSelected(itemId)) {
                selection[itemId] = true;
            }
        }

        // Update the ref with the current selection
        rowSelectionRef.current = selection;

        return selection;
    }, [dataItems, isItemSelected, idField, selectedItemIds]);

    // Calculate total selected items - memoize to avoid recalculation
    const totalSelectedItems = useMemo(() => getSelectedCount(), [getSelectedCount]);

    const handleRowDeselection = useCallback(
        (rowId: string) => {
            if (!dataItems.length)
                return;

            const rowIndex = Number.parseInt(rowId, 10);
            const item = dataItems[rowIndex];

            if (item) {
                const itemId = String(item[idField]);

                removeSelectedItem(itemId);
            }
        },
        [dataItems, idField, removeSelectedItem],
    );

    const handleRowSelectionChange = useCallback(
        (updaterOrValue: RowSelectionUpdater | Record<string, boolean>) => {
            // Determine the new row selection value
            const newRowSelection = typeof updaterOrValue === "function" ? updaterOrValue(rowSelectionRef.current) : updaterOrValue;

            // Check if we have a max selection limit and if we're in comparison mode
            if (tableConfig.selectionMode === "comparison" && tableConfig.maxSelectionLimit > 0) {
                const selectedKeys = Object.keys(newRowSelection);
                if (selectedKeys.length > tableConfig.maxSelectionLimit) {
                    // If we're exceeding the limit, keep only the first N items
                    const limitedSelection: Record<string, boolean> = {};
                    selectedKeys.slice(0, tableConfig.maxSelectionLimit).forEach(key => {
                        limitedSelection[key] = true;
                    });
                    
                    // CRITICAL: Update our selectedItemIds state to match TanStack Table's state
                    if (tableConfig.enableRowVirtualization) {
                        dispatch({ payload: new Set(Object.keys(limitedSelection)), type: "SET_SELECTED_ITEMS" });
                    } else {
                        dispatch({ payload: limitedSelection, type: "SET_SELECTED_ITEMS" });
                    }
                    return;
                }
            }

            // CRITICAL: Update our selectedItemIds state to match TanStack Table's state
            if (tableConfig.enableRowVirtualization) {
                dispatch({ payload: new Set(Object.keys(newRowSelection)), type: "SET_SELECTED_ITEMS" });
            } else {
                dispatch({ payload: newRowSelection, type: "SET_SELECTED_ITEMS" });
            }
        },
        [tableConfig.enableRowVirtualization, tableConfig.maxSelectionLimit, tableConfig.selectionMode],
    );

    // Get selected items data - React Compiler optimized
    const getSelectedItems = useCallback(async () => {
        // If nothing is selected, return empty array
        if (totalSelectedItems === 0) {
            return [];
        }

        // Use a more efficient approach for React Compiler
        const selectedItems: typeof dataItems = [];
        const dataLength = dataItems.length;

        for (let i = 0; i < dataLength; i++) {
            const item = dataItems[i];

            if (isItemSelected(String(item[idField]))) {
                selectedItems.push(item);
            }
        }

        return selectedItems;
    }, [dataItems, isItemSelected, totalSelectedItems, idField]);

    // Get all items
    const getAllItems = useCallback(
        (): TData[] =>
            // Return all data
            dataItems,
        [dataItems],
    );

    // Memoized pagination state
    const tablePagination = useMemo(() => {
        return {
            pageIndex: pagination.page - 1,
            pageSize: pagination.pageSize,
        };
    }, [pagination.page, pagination.pageSize]);

    // Get columns with the deselection handler - React Compiler will optimize this
    const columns = useMemo(() => {
        // Only pass deselection handler if row selection is enabled
        const columnDefs = getColumns(tableConfig.enableRowSelection ? handleRowDeselection : null);

        // Use data-table-filter's createTSTColumns when filter columns are provided
        if (filterColumns && filterColumns.length > 0 && filterColumnsData && filterColumnsData.length > 0) {
            const processedColumns = createTSTColumns({
                columns: columnDefs,
                configs: filterColumnsData,
            });
            
            return processedColumns.map((column) => {
                return {
                    ...column,
                    meta: {
                        ...column.meta,
                        _cachedAccessor: "accessorFn" in column ? column.accessorFn : "accessorKey" in column ? column.accessorKey : undefined,
                    },
                };
            });
        }

        return columnDefs.map((column) => {
            return {
                ...column,
                meta: {
                    ...column.meta,
                    _cachedAccessor: "accessorFn" in column ? column.accessorFn : "accessorKey" in column ? column.accessorKey : undefined,
                },
            };
        });
    }, [getColumns, handleRowDeselection, tableConfig.enableRowSelection, filterColumns, filterColumnsData]);

    // Create event handlers using utility functions

    const handleSortingChange = useCallback(
        (updaterOrValue: { desc: boolean; id: string }[] | ((prev: { desc: boolean; id: string }[]) => { desc: boolean; id: string }[])) => {
            const newSorting = typeof updaterOrValue === "function" ? updaterOrValue([]) : updaterOrValue;

            if (newSorting.length > 0) {
                const columnId = newSorting[0].id;
                const direction = newSorting[0].desc ? "desc" : "asc";

                dispatch({ payload: { sortBy: columnId, sortOrder: direction }, type: "SET_SORTING" });
            } else {
                dispatch({ payload: { sortBy: undefined, sortOrder: "asc" }, type: "SET_SORTING" });
            }
        },
        [],
    );

    // Create wrapper functions for pagination and column sizing
    const setPageWrapper = useCallback(
        (value: number | ((prev: number) => number)) => {
            const newValue = typeof value === "function" ? value(pagination.page) : value;

            dispatch({ payload: { page: newValue }, type: "SET_PAGINATION" });

            return undefined;
        },
        [pagination.page],
    );

    const setPageSizeWrapper = useCallback(
        (value: number | ((prev: number) => number)) => {
            const newValue = typeof value === "function" ? value(pagination.pageSize) : value;

            dispatch({ payload: { pageSize: newValue }, type: "SET_PAGINATION" });

            return undefined;
        },
        [pagination.pageSize],
    );

    const setColumnSizingWrapper = useCallback(
        (value: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState)) => {
            const newValue = typeof value === "function" ? value(columnSizing) : value;

            dispatch({ payload: newValue, type: "SET_COLUMN_SIZING" });

            return undefined;
        },
        [columnSizing],
    );

    const handlePaginationChange = useCallback(createPaginationHandler(setPageWrapper, setPageSizeWrapper, pagination.page, pagination.pageSize), [
        setPageWrapper,
        setPageSizeWrapper,
        pagination.page,
        pagination.pageSize,
    ]);

    const handleColumnSizingChange = useCallback(createColumnSizingHandler(setColumnSizingWrapper, columnSizing), [setColumnSizingWrapper, columnSizing]);

    // Memoize table configuration to prevent unnecessary re-renders
    const tableOptions = useMemo(() => {
        const baseOptions = {
            columnResizeMode: "onChange" as ColumnResizeMode,
            columns,
            data: dataItems,
            onColumnSizingChange: handleColumnSizingChange,
            state: {
                columnFilters: effectiveColumnFilters,
                columnVisibility,
                rowSelection,
                sorting: sorting.sortBy && sorting.sortOrder ? [{ desc: sorting.sortOrder === "desc", id: sorting.sortBy }] : [],
                // Only include pagination state if pagination is enabled
                ...tableConfig.enablePagination ? { pagination: tablePagination } : {},
                columnSizing,
            },
            // Only include pagination-related options if pagination is enabled
            ...tableConfig.enablePagination
                ? {
                    onPaginationChange: handlePaginationChange,
                    pageCount: Math.ceil(dataItems.length / pagination.pageSize),
                }
                : {},
            enableColumnFilters: true,
            enableColumnResizing: tableConfig.enableColumnResizing,
            enableMultiSort: false, // Only allow single column sorting
            enableRowSelection: tableConfig.enableRowSelection,
            getCoreRowModel: getCoreRowModel<TData>(),
            getFacetedRowModel: getFacetedRowModel<TData>(),
            getFilteredRowModel: getFilteredRowModel<TData>(),
            getRowId: (row: TData) => {
                const id = row[idField];

                return id != null ? String(id) : "";
            },
            getSortedRowModel: getSortedRowModel<TData>(),
            manualFiltering: false,
            manualPagination: false,
            manualSorting: false,
            onColumnFiltersChange: (
                value: { id: string; value: unknown }[] | ((prev: { id: string; value: unknown }[]) => { id: string; value: unknown }[]),
            ) => {
                const newValue = typeof value === "function" ? value(columnFilters) : value;

                dispatch({ payload: newValue, type: "SET_COLUMN_FILTERS" });
            },
            onColumnVisibilityChange: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
                const newValue = typeof value === "function" ? value(columnVisibility) : value;

                dispatch({ payload: newValue, type: "SET_COLUMN_VISIBILITY" });
            },
            onRowSelectionChange: handleRowSelectionChange,
            onSortingChange: handleSortingChange,
            rowSelection,
            // Only use pagination row model if pagination is enabled
            ...tableConfig.enablePagination ? { getPaginationRowModel: getPaginationRowModel<TData>() } : {},
            getFacetedUniqueValues: getFacetedUniqueValues<TData>(),
        };

        return baseOptions;
    }, [
        dataItems,
        columns,
        sorting,
        columnVisibility,
        rowSelection,
        effectiveColumnFilters,
        // Only include pagination-related dependencies if pagination is enabled
        ...tableConfig.enablePagination ? [pagination, handlePaginationChange] : [],
        columnSizing,
        handleColumnSizingChange,
        tableConfig.enableRowSelection,
        tableConfig.enableColumnResizing,
        handleRowSelectionChange,
        handleSortingChange,
        idField,
    ]);

    // Set up the table with memoized configuration - React Compiler will optimize this
    const table = useReactTable<TData>(tableOptions);

    // Create keyboard navigation handler
    const handleKeyDown = useCallback(
        createKeyboardNavigationHandler(table, () => {
            // Example action on keyboard activation
        }),
        [],
    );

    // Add an effect to validate page number when page size changes
    useEffect(() => {
        // This effect ensures page is valid after page size changes
        const totalPages = Math.ceil(dataItems.length / pagination.pageSize);

        if (totalPages > 0 && pagination.page > totalPages) {
            dispatch({ payload: { page: 1 }, type: "SET_PAGINATION" });
        }
    }, [dataItems.length, pagination.pageSize, pagination.page]);

    // Clear selections when selection mode changes
    useEffect(() => {
        dispatch({ type: "CLEAR_SELECTIONS" });
    }, [tableConfig.selectionMode]);

    // Initialize default column sizes when columns are available and no saved sizes exist
    useEffect(() => {
        initializeColumnSizes(columns, (value) => dispatch({ payload: value, type: "SET_COLUMN_SIZING" }));
    }, [columns]);

    // Handle column resizing
    useEffect(() => {
        const isResizingAny = table.getHeaderGroups().some((headerGroup) => headerGroup.headers.some((header) => header.column.getIsResizing()));

        trackColumnResizing(isResizingAny);

        // Cleanup on unmount
        return () => {
            cleanupColumnResizing();
        };
    }, [table]);

    return (
        <div className={classes.root} data-testid="data-table">
            {tableConfig.enableToolbar && (
                <DataTableToolbar
                    className={classes.toolbar}
                    columnMapping={exportConfig.columnMapping}
                    columnWidths={exportConfig.columnWidths}
                    config={tableConfig}
                    customToolbarComponent={renderToolbarContent?.({
                        allSelectedIds: getSelectedIds(),
                        resetSelection: clearAllSelections,
                        selectedRows: dataItems.filter((item) => isItemSelected(String(item[idField]))),
                        totalSelectedCount: totalSelectedItems,
                    })}
                    entityName={exportConfig.entityName}
                    filterActions={actions}
                    filterColumns={filterColumnsData}
                    filters={filters}
                    filterStrategy={filterStrategyData}
                    getAllItems={getAllItems}
                    getSelectedItems={getSelectedItems}
                    headers={exportConfig.headers}
                    table={table}
                    totalSelectedItems={totalSelectedItems}
                    transformFunction={exportConfig.transformFunction}
                />
            )}
            
            {tableConfig.enableRowVirtualization && (
                <VirtualizedTable
                    className={classes.table}
                    columns={columns}
                    enableStickyHeader={tableConfig.enableStickyHeader}
                    onKeyDown={tableConfig.enableKeyboardNavigation ? handleKeyDown : undefined}
                    table={table}
                    virtualizationOptions={{
                        containerHeight: containerHeight ?? 400, // Default fallback height
                        estimatedRowHeight: virtualizationOptions.estimatedRowHeight ?? tableConfig.estimatedRowHeight,
                        overscan: virtualizationOptions.overscan ?? tableConfig.virtualizationOverscan,
                    }}
                />
            )}

            {!tableConfig.enableRowVirtualization && (
                <RegularTable
                    className={classes.table}
                    columns={columns}
                    containerHeight={containerHeight}
                    enableClickRowSelect={tableConfig.enableClickRowSelect}
                    enableColumnResizing={tableConfig.enableColumnResizing}
                    enableKeyboardNavigation={tableConfig.enableKeyboardNavigation}
                    enableStickyHeader={tableConfig.enableStickyHeader}
                    onKeyDown={handleKeyDown}
                    table={table}
                />
            )}

            {tableConfig.enablePagination && (
                <DataTablePagination
                    pageSizeOptions={pageSizeOptions || [10, 20, 30, 40, 50]}
                    size={tableConfig.size}
                    table={table}
                    totalItems={dataItems.length}
                    totalSelectedItems={totalSelectedItems}
                />
            )}
        </div>
    );
};

export default DataTable;
