"use client";

import * as React from "react";
import {
    type ColumnSizingState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnResizeMode,
} from "@tanstack/react-table";

import { useEffect, useCallback, useMemo, useRef, useReducer } from "react";

import { VirtualizedTable } from "@/components/data-table/virtual-table";

import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";
import { useTableConfig, type TableConfig } from "./utils/table-config";
import { usePerformanceMonitor } from "./utils/performance-utils";

import type { DataTransformFunction, ExportableData } from "./utils/export-utils";
import type { ColumnConfig, FilterStrategy } from "./filter/core/types";
import { useDataTableFilters } from "./filter/hooks/use-data-table-filters";
import { createTSTFilters } from "./filter/integrations/tanstack-table";

import { RegularTable } from "./regular-table";

import { createSortingHandler, createPaginationHandler, createColumnSizingHandler, createSortingState } from "./utils/table-state-handlers";
import { createKeyboardNavigationHandler } from "./utils/keyboard-navigation";
import { initializeColumnSizes, trackColumnResizing, cleanupColumnResizing } from "./utils/column-sizing";

// Error boundary component for table rendering
class TableErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Table rendering error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="text-muted-foreground p-4 text-center">Something went wrong rendering the table. Please refresh the page.</div>
                )
            );
        }

        return this.props.children;
    }
}

type RowSelectionUpdater = (prev: Record<string, boolean>) => Record<string, boolean>;

interface DataTableProps<TData extends ExportableData, TValue> {
    // Allow overriding the table configuration
    config?: Partial<TableConfig>;

    // Column definitions generator
    getColumns: (handleRowDeselection: ((rowId: string) => void) | null | undefined) => ColumnDef<TData, TValue>[];

    // Data to display in the table
    data: TData[];

    // Export configuration
    exportConfig: {
        entityName: string;
        columnMapping: Record<string, string>;
        columnWidths: Array<{ wch: number }>;
        headers: string[];
        transformFunction?: DataTransformFunction<TData>;
    };

    // ID field in TData for tracking selected items
    idField: keyof TData;

    // Custom page size options
    pageSizeOptions?: number[];

    // Custom toolbar content render function
    renderToolbarContent?: (props: {
        selectedRows: TData[];
        allSelectedIds: (string | number)[];
        totalSelectedCount: number;
        resetSelection: () => void;
    }) => React.ReactNode;

    // Virtualization options (only used when enableRowVirtualization is true)
    virtualizationOptions?: {
        estimatedRowHeight?: number;
        overscan?: number;
    };
    classes?: {
        root?: string;
        table?: string;
        toolbar?: string;
    };
    // External column filters (for data-table-filter integration)
    externalColumnFilters?: Array<{ id: string; value: unknown }>;

    // New filter system props
    filterColumns?: ColumnConfig<TData>[];
    filterStrategy?: FilterStrategy;
    containerHeight?: number;

    // Default sorting configuration
    defaultSorting?: {
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    };

    // Default pagination configuration
    defaultPagination?: {
        page?: number;
        pageSize?: number;
    };
}

// Add these types and reducers before the DataTable component
type TableState = {
    pagination: {
        page: number;
        pageSize: number;
    };
    sorting: {
        sortBy?: string;
        sortOrder: "asc" | "desc";
    };
    columnVisibility: Record<string, boolean>;
    columnFilters: Array<{ id: string; value: unknown }>;
    columnSizing: ColumnSizingState;
    selectedItemIds: Record<string, boolean> | Set<string>;
};

type TableAction =
    | { type: "SET_PAGINATION"; payload: { page?: number; pageSize?: number } }
    | { type: "SET_SORTING"; payload: { sortBy?: string; sortOrder?: "asc" | "desc" } }
    | { type: "SET_COLUMN_VISIBILITY"; payload: Record<string, boolean> }
    | { type: "SET_COLUMN_FILTERS"; payload: Array<{ id: string; value: unknown }> }
    | { type: "SET_COLUMN_SIZING"; payload: ColumnSizingState }
    | { type: "SET_SELECTED_ITEMS"; payload: Record<string, boolean> | Set<string> }
    | { type: "ADD_SELECTED_ITEM"; payload: string }
    | { type: "REMOVE_SELECTED_ITEM"; payload: string }
    | { type: "CLEAR_SELECTIONS" };

function tableReducer(state: TableState, action: TableAction): TableState {
    switch (action.type) {
        case "SET_PAGINATION":
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload,
                },
            };
        case "SET_SORTING":
            return {
                ...state,
                sorting: {
                    ...state.sorting,
                    ...action.payload,
                },
            };
        case "SET_COLUMN_VISIBILITY":
            return {
                ...state,
                columnVisibility: action.payload,
            };
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
        case "SET_SELECTED_ITEMS":
            return {
                ...state,
                selectedItemIds: action.payload,
            };
        case "ADD_SELECTED_ITEM": {
            const isVirtualized = state.selectedItemIds instanceof Set;
            if (isVirtualized) {
                const newSet = new Set(state.selectedItemIds as Set<string>);
                newSet.add(action.payload);
                return { ...state, selectedItemIds: newSet };
            } else {
                return {
                    ...state,
                    selectedItemIds: {
                        ...(state.selectedItemIds as Record<string, boolean>),
                        [action.payload]: true,
                    },
                };
            }
        }
        case "REMOVE_SELECTED_ITEM": {
            const isVirtualized = state.selectedItemIds instanceof Set;
            if (isVirtualized) {
                const newSet = new Set(state.selectedItemIds as Set<string>);
                newSet.delete(action.payload);
                return { ...state, selectedItemIds: newSet };
            } else {
                const newRecord = { ...(state.selectedItemIds as Record<string, boolean>) };
                delete newRecord[action.payload];
                return { ...state, selectedItemIds: newRecord };
            }
        }
        case "CLEAR_SELECTIONS": {
            const isVirtualized = state.selectedItemIds instanceof Set;
            return {
                ...state,
                selectedItemIds: isVirtualized ? new Set() : {},
            };
        }
        default:
            return state;
    }
}

export function DataTable<TData extends ExportableData, TValue>({
    config = {},
    getColumns,
    data,
    exportConfig,
    idField = "id" as keyof TData,
    pageSizeOptions,
    renderToolbarContent,
    virtualizationOptions = {},
    classes = {},
    externalColumnFilters,
    filterColumns,
    filterStrategy = "client",
    containerHeight,
    defaultSorting = {},
    defaultPagination = {},
}: DataTableProps<TData, TValue>) {
    // Performance monitoring (disabled in test environment)
    if (process.env.NODE_ENV !== "test") {
        usePerformanceMonitor("DataTable");
    }

    // Load table configuration with any overrides
    const tableConfig = useTableConfig(config);

    // Consolidated state management using useReducer
    const [state, dispatch] = useReducer(tableReducer, {
        pagination: {
            page: defaultPagination.page ?? 1,
            pageSize: defaultPagination.pageSize ?? 10,
        },
        sorting: {
            sortBy: defaultSorting.sortBy ?? "lastUpdated",
            sortOrder: defaultSorting.sortOrder ?? "desc",
        },
        columnVisibility: {},
        columnFilters: [],
        columnSizing: {},
        selectedItemIds: tableConfig.enableRowVirtualization ? new Set<string>() : {},
    });

    // Destructure state for easier access
    const { pagination, sorting, columnVisibility, columnFilters, columnSizing, selectedItemIds } = state;

    // Ref to store current rowSelection to avoid circular dependency
    const rowSelectionRef = useRef<Record<string, boolean>>({});

    // Set up data-table-filter if filterColumns are provided
    const filterData = useMemo(() => data, [data]);
    const {
        columns: filterColumnsData,
        filters,
        actions,
        strategy: filterStrategyData,
    } = useDataTableFilters({
        strategy: filterStrategy,
        data: filterData,
        columnsConfig: filterColumns || [],
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
        (itemId: string): boolean => {
            return tableConfig.enableRowVirtualization ? (selectedItemIds as Set<string>).has(itemId) : !!(selectedItemIds as Record<string, boolean>)[itemId];
        },
        [selectedItemIds, tableConfig.enableRowVirtualization],
    );

    const removeSelectedItem = useCallback((itemId: string) => {
        dispatch({ type: "REMOVE_SELECTED_ITEM", payload: itemId });
    }, []);

    const clearAllSelections = useCallback(() => {
        dispatch({ type: "CLEAR_SELECTIONS" });
    }, []);

    const getSelectedCount = useCallback((): number => {
        if (tableConfig.enableRowVirtualization) {
            return (selectedItemIds as Set<string>).size;
        } else {
            return Object.keys(selectedItemIds as Record<string, boolean>).length;
        }
    }, [selectedItemIds, tableConfig.enableRowVirtualization]);

    const getSelectedIds = useCallback((): (string | number)[] => {
        if (tableConfig.enableRowVirtualization) {
            return Array.from(selectedItemIds as Set<string>);
        } else {
            return Object.keys(selectedItemIds as Record<string, boolean>);
        }
    }, [selectedItemIds, tableConfig.enableRowVirtualization]);

    const dataItems = useMemo(() => data || [], [data]);

    const rowSelection = useMemo(() => {
        if (!dataItems.length) return {};

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
            if (!dataItems.length) return;

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

            // CRITICAL: Update our selectedItemIds state to match TanStack Table's state
            if (tableConfig.enableRowVirtualization) {
                dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(Object.keys(newRowSelection)) });
            } else {
                dispatch({ type: "SET_SELECTED_ITEMS", payload: newRowSelection });
            }
        },
        [tableConfig.enableRowVirtualization],
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
    const getAllItems = useCallback((): TData[] => {
        // Return all data
        return dataItems;
    }, [dataItems]);

    // Memoized pagination state
    const tablePagination = useMemo(
        () => ({
            pageIndex: pagination.page - 1,
            pageSize: pagination.pageSize,
        }),
        [pagination.page, pagination.pageSize],
    );

    // Get columns with the deselection handler - React Compiler will optimize this
    const columns = useMemo(() => {
        // Only pass deselection handler if row selection is enabled
        const columnDefs = getColumns(tableConfig.enableRowSelection ? handleRowDeselection : null);

        // Pre-compute column metadata for better performance
        return columnDefs.map((column) => ({
            ...column,
            // Add computed properties for better performance
            meta: {
                ...column.meta,
                // Cache the accessor function result for better performance
                _cachedAccessor: "accessorFn" in column ? column.accessorFn : "accessorKey" in column ? column.accessorKey : undefined,
            },
        }));
    }, [getColumns, handleRowDeselection, tableConfig.enableRowSelection]);

    // Create event handlers using utility functions
    // Create wrapper functions that match the expected SetStateFunction signature
    const setSortByWrapper = useCallback(
        (value: string | ((prev: string) => string)) => {
            const newValue = typeof value === "function" ? value(sorting.sortBy || "lastUpdated") : value;
            dispatch({ type: "SET_SORTING", payload: { sortBy: newValue } });
            return undefined;
        },
        [sorting.sortBy],
    );

    const setSortOrderWrapper = useCallback(
        (value: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => {
            const newValue = typeof value === "function" ? value(sorting.sortOrder) : value;
            dispatch({ type: "SET_SORTING", payload: { sortOrder: newValue } });
            return undefined;
        },
        [sorting.sortOrder],
    );

    const handleSortingChange = useCallback(createSortingHandler(setSortByWrapper, setSortOrderWrapper), [setSortByWrapper, setSortOrderWrapper]);

    // Create wrapper functions for pagination and column sizing
    const setPageWrapper = useCallback(
        (value: number | ((prev: number) => number)) => {
            const newValue = typeof value === "function" ? value(pagination.page) : value;
            dispatch({ type: "SET_PAGINATION", payload: { page: newValue } });
            return undefined;
        },
        [pagination.page],
    );

    const setPageSizeWrapper = useCallback(
        (value: number | ((prev: number) => number)) => {
            const newValue = typeof value === "function" ? value(pagination.pageSize) : value;
            dispatch({ type: "SET_PAGINATION", payload: { pageSize: newValue } });
            return undefined;
        },
        [pagination.pageSize],
    );

    const setColumnSizingWrapper = useCallback(
        (value: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState)) => {
            const newValue = typeof value === "function" ? value(columnSizing) : value;
            dispatch({ type: "SET_COLUMN_SIZING", payload: newValue });
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
            data: dataItems,
            columns,
            state: {
                sorting: sorting.sortBy && sorting.sortOrder ? [{ id: sorting.sortBy, desc: sorting.sortOrder === "desc" }] : [],
                columnVisibility,
                rowSelection,
                columnFilters: effectiveColumnFilters,
                // Only include pagination state if pagination is enabled
                ...(tableConfig.enablePagination ? { pagination: tablePagination } : {}),
                columnSizing,
            },
            columnResizeMode: "onChange" as ColumnResizeMode,
            onColumnSizingChange: handleColumnSizingChange,
            // Only include pagination-related options if pagination is enabled
            ...(tableConfig.enablePagination
                ? {
                      pageCount: Math.ceil(dataItems.length / pagination.pageSize),
                      onPaginationChange: handlePaginationChange,
                  }
                : {}),
            enableRowSelection: tableConfig.enableRowSelection,
            rowSelection,
            enableColumnResizing: tableConfig.enableColumnResizing,
            enableColumnFilters: true,
            enableMultiSort: false, // Only allow single column sorting
            manualPagination: false,
            manualSorting: false,
            manualFiltering: false,
            getRowId: (row: TData) => {
                const id = row[idField];
                return id != null ? String(id) : "";
            },
            onRowSelectionChange: handleRowSelectionChange,
            onSortingChange: handleSortingChange,
            onColumnFiltersChange: (
                value: Array<{ id: string; value: unknown }> | ((prev: Array<{ id: string; value: unknown }>) => Array<{ id: string; value: unknown }>),
            ) => {
                const newValue = typeof value === "function" ? value(columnFilters) : value;
                dispatch({ type: "SET_COLUMN_FILTERS", payload: newValue });
            },
            onColumnVisibilityChange: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
                const newValue = typeof value === "function" ? value(columnVisibility) : value;
                dispatch({ type: "SET_COLUMN_VISIBILITY", payload: newValue });
            },
            getCoreRowModel: getCoreRowModel<TData>(),
            getFilteredRowModel: getFilteredRowModel<TData>(),
            getFacetedRowModel: getFacetedRowModel<TData>(),
            getSortedRowModel: getSortedRowModel<TData>(),
            // Only use pagination row model if pagination is enabled
            ...(tableConfig.enablePagination ? { getPaginationRowModel: getPaginationRowModel<TData>() } : {}),
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
        ...(tableConfig.enablePagination ? [pagination, handlePaginationChange] : []),
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
            dispatch({ type: "SET_PAGINATION", payload: { page: 1 } });
        }
    }, [dataItems.length, pagination.pageSize, pagination.page]);

    // Initialize default column sizes when columns are available and no saved sizes exist
    useEffect(() => {
        initializeColumnSizes(columns, (value) => dispatch({ type: "SET_COLUMN_SIZING", payload: value }));
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
                    table={table}
                    totalSelectedItems={totalSelectedItems}
                    getSelectedItems={getSelectedItems}
                    getAllItems={getAllItems}
                    config={tableConfig}
                    entityName={exportConfig.entityName}
                    columnMapping={exportConfig.columnMapping}
                    columnWidths={exportConfig.columnWidths}
                    headers={exportConfig.headers}
                    transformFunction={exportConfig.transformFunction}
                    customToolbarComponent={renderToolbarContent?.({
                        selectedRows: dataItems.filter((item) => isItemSelected(String(item[idField]))),
                        allSelectedIds: getSelectedIds(),
                        totalSelectedCount: totalSelectedItems,
                        resetSelection: clearAllSelections,
                    })}
                    className={classes.toolbar}
                    filterColumns={filterColumnsData}
                    filterStrategy={filterStrategyData}
                    filters={filters}
                    filterActions={actions}
                />
            )}
            {tableConfig.enableRowVirtualization ? (
                <TableErrorBoundary fallback={<div className="text-muted-foreground p-4 text-center">Error loading virtual table.</div>}>
                    <VirtualizedTable
                        table={table}
                        onKeyDown={tableConfig.enableKeyboardNavigation ? handleKeyDown : undefined}
                        enableStickyHeader={tableConfig.enableStickyHeader}
                        virtualizationOptions={{
                            estimatedRowHeight: virtualizationOptions.estimatedRowHeight ?? tableConfig.estimatedRowHeight,
                            overscan: virtualizationOptions.overscan ?? tableConfig.virtualizationOverscan,
                            containerHeight: containerHeight ?? 400, // Default fallback height
                        }}
                        columns={columns}
                        className={classes.table}
                    />
                </TableErrorBoundary>
            ) : (
                <TableErrorBoundary fallback={<div className="text-muted-foreground p-4 text-center">Error loading regular table.</div>}>
                    <RegularTable
                        table={table}
                        enableColumnResizing={tableConfig.enableColumnResizing}
                        enableClickRowSelect={tableConfig.enableClickRowSelect}
                        enableKeyboardNavigation={tableConfig.enableKeyboardNavigation}
                        columns={columns}
                        onKeyDown={handleKeyDown}
                        enableStickyHeader={tableConfig.enableStickyHeader}
                        className={classes.table}
                        containerHeight={containerHeight}
                    />
                </TableErrorBoundary>
            )}

            {tableConfig.enablePagination && (
                <DataTablePagination
                    table={table}
                    totalItems={dataItems.length}
                    totalSelectedItems={totalSelectedItems}
                    pageSizeOptions={pageSizeOptions || [10, 20, 30, 40, 50]}
                    size={tableConfig.size}
                />
            )}
        </div>
    );
}
