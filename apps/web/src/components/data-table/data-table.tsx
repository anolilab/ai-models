"use client";

import type * as React from "react";
import {
  type ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnResizeMode
} from "@tanstack/react-table";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";
import { useTableConfig, type TableConfig } from "./utils/table-config";

import type { DataTransformFunction, ExportableData } from "./utils/export-utils";

import { DataTableResizer } from "./data-table-resizer";

import {
  createSortingHandler,
  createPaginationHandler,
  createColumnSizingHandler,
  createSortingState
  } from "./utils/table-state-handlers";
  import { createKeyboardNavigationHandler } from "./utils/keyboard-navigation";
  import {
  initializeColumnSizes,
  trackColumnResizing,
  cleanupColumnResizing
} from "./utils/column-sizing";

type ColumnOrderUpdater = (prev: string[]) => string[];
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
}

export function DataTable<TData extends ExportableData, TValue>({
  config = {},
  getColumns,
  data,
  exportConfig,
  idField = 'id' as keyof TData,
  pageSizeOptions,
  renderToolbarContent
}: DataTableProps<TData, TValue>) {
  // Load table configuration with any overrides
  const tableConfig = useTableConfig(config);

  // Column sizing state (moved from useTableColumnResize hook)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // Memoized function to reset column sizes
  const resetColumnSizing = useCallback(() => {
    setColumnSizing({});
  }, []);

  // Use regular React state for all table parameters (client-side only)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<{ from_date: string; to_date: string }>({ from_date: "", to_date: "" });
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  // Use regular React state for columnFilters since they contain complex objects
  const [columnFilters, setColumnFilters] = useState<Array<{ id: string; value: unknown }>>([]);

  // Column order state
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // PERFORMANCE FIX: Use only one selection state as the source of truth
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string | number, boolean>>({});

  // Convert the sorting to the format TanStack Table expects
  const sorting = useMemo(() => createSortingState(sortBy, sortOrder), [sortBy, sortOrder]);

  // Get current data items with date filtering - memoize to avoid recalculations
  const dataItems = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // If no date range is set, return all data
    if (!dateRange.from_date && !dateRange.to_date) {
      return data;
    }
    
    // Filter data based on date range
    return data.filter(item => {
      // Check if item has date fields to filter on
      const itemDate = (item as any).lastUpdated || (item as any).releaseDate;
      if (!itemDate || itemDate === 'N/A') return true; // Include items without dates
      
      try {
        const itemDateObj = new Date(itemDate);
        if (isNaN(itemDateObj.getTime())) return true; // Include items with invalid dates
        
        const fromDate = dateRange.from_date ? new Date(dateRange.from_date) : null;
        const toDate = dateRange.to_date ? new Date(dateRange.to_date) : null;
        
        // Check if item date is within range
        if (fromDate && itemDateObj < fromDate) return false;
        if (toDate && itemDateObj > toDate) return false;
        
        return true;
      } catch (error) {
        // If date parsing fails, include the item
        return true;
      }
    });
  }, [data, dateRange]);

  // PERFORMANCE FIX: Derive rowSelection from selectedItemIds using memoization
  const rowSelection = useMemo(() => {
    if (!dataItems.length) return {};

    // Map selectedItemIds to row indices for the table
    const selection: Record<string, boolean> = {};

    dataItems.forEach((item, index) => {
      const itemId = String(item[idField]);
      if (selectedItemIds[itemId]) {
        selection[String(index)] = true;
      }
    });

    return selection;
  }, [dataItems, selectedItemIds, idField]);

  // Calculate total selected items - memoize to avoid recalculation
  const totalSelectedItems = useMemo(() =>
    Object.keys(selectedItemIds).length,
    [selectedItemIds]
  );

  // PERFORMANCE FIX: Optimized row deselection handler
  const handleRowDeselection = useCallback((rowId: string) => {
    if (!dataItems.length) return;

    const rowIndex = Number.parseInt(rowId, 10);
    const item = dataItems[rowIndex];

    if (item) {
      const itemId = String(item[idField]);
      setSelectedItemIds(prev => {
        // Remove this item ID from selection
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  }, [dataItems, idField]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedItemIds({});
  }, []);

  // PERFORMANCE FIX: Optimized row selection handler
  const handleRowSelectionChange = useCallback((updaterOrValue: RowSelectionUpdater | Record<string, boolean>) => {
    // Determine the new row selection value
    const newRowSelection = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection)
      : updaterOrValue;

    // Batch update selectedItemIds based on the new row selection
    setSelectedItemIds(prev => {
      const next = { ...prev };

      // Process changes for current page
      if (dataItems.length) {
        // First handle explicit selections in newRowSelection
        for (const [rowId, isSelected] of Object.entries(newRowSelection)) {
          const rowIndex = Number.parseInt(rowId, 10);
          if (rowIndex >= 0 && rowIndex < dataItems.length) {
            const item = dataItems[rowIndex];
            const itemId = String(item[idField]);

            if (isSelected) {
              next[itemId] = true;
            } else {
              delete next[itemId];
            }
          }
        }

        // Then handle implicit deselection (rows that were selected but aren't in newRowSelection)
        dataItems.forEach((item, index) => {
          const itemId = String(item[idField]);
          const rowId = String(index);

          // If item was selected but isn't in new selection, deselect it
          if (prev[itemId] && newRowSelection[rowId] === undefined) {
            delete next[itemId];
          }
        });
      }

      return next;
    });
  }, [dataItems, rowSelection, idField]);

  // Get selected items data
  const getSelectedItems = useCallback(async () => {
    // If nothing is selected, return empty array
    if (totalSelectedItems === 0) {
      return [];
    }

    // Find items from current data that are selected
    const selectedItems = dataItems.filter(item =>
      selectedItemIds[String(item[idField])]
    );

    return selectedItems;
  }, [dataItems, selectedItemIds, totalSelectedItems, idField]);

  // Get all items
  const getAllItems = useCallback((): TData[] => {
    // Return all data
    return dataItems;
  }, [dataItems]);

  // Memoized pagination state
  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize,
    }),
    [page, pageSize]
  );

  // Ref for the table container for keyboard navigation
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Get columns with the deselection handler (memoize to avoid recreation on render)
  const columns = useMemo(() => {
    // Only pass deselection handler if row selection is enabled
    return getColumns(tableConfig.enableRowSelection ? handleRowDeselection : null);
  }, [getColumns, handleRowDeselection, tableConfig.enableRowSelection]);

  // Create event handlers using utility functions
  // Create wrapper functions that match the expected SetStateFunction signature
  const setSortByWrapper = useCallback((value: string | ((prev: string) => string)) => {
    setSortBy(value);
    return undefined;
  }, [setSortBy]);

  const setSortOrderWrapper = useCallback((value: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => {
    setSortOrder(value);
    return undefined;
  }, [setSortOrder]);

  const handleSortingChange = useCallback(
                  createSortingHandler(setSortByWrapper, setSortOrderWrapper),
                  [setSortByWrapper, setSortOrderWrapper]
                );

  // Create wrapper functions for pagination and column sizing
  const setPageWrapper = useCallback((value: number | ((prev: number) => number)) => {
    setPage(value);
    return undefined;
  }, [setPage]);

  const setPageSizeWrapper = useCallback((value: number | ((prev: number) => number)) => {
    setPageSize(value);
    return undefined;
  }, [setPageSize]);

  const setColumnSizingWrapper = useCallback((value: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState)) => {
    setColumnSizing(value);
    return undefined;
  }, [setColumnSizing]);

  const handlePaginationChange = useCallback(
    createPaginationHandler(setPageWrapper, setPageSizeWrapper, page, pageSize),
    [setPageWrapper, setPageSizeWrapper, page, pageSize]
  );

  const handleColumnSizingChange = useCallback(
    createColumnSizingHandler(setColumnSizingWrapper, columnSizing),
    [setColumnSizingWrapper, columnSizing]
  );

  // Column order change handler
  const handleColumnOrderChange = useCallback((updaterOrValue: ColumnOrderUpdater | string[]) => {
    const newColumnOrder = typeof updaterOrValue === 'function'
      ? updaterOrValue(columnOrder)
      : updaterOrValue;

    setColumnOrder(newColumnOrder);
  }, [columnOrder]);



  // Memoize table configuration to prevent unnecessary re-renders
  const tableOptions = useMemo(() => ({
    data: dataItems,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      // Only include pagination state if pagination is enabled
      ...(tableConfig.enablePagination ? { pagination } : {}),
      columnSizing,
      columnOrder,
      globalFilter: search,
    },
    columnResizeMode: 'onChange' as ColumnResizeMode,
    onColumnSizingChange: handleColumnSizingChange,
    onColumnOrderChange: handleColumnOrderChange,
    // Only include pagination-related options if pagination is enabled
    ...(tableConfig.enablePagination ? {
      pageCount: Math.ceil(dataItems.length / pageSize),
      onPaginationChange: handlePaginationChange,
    } : {}),
    enableRowSelection: tableConfig.enableRowSelection,
    enableColumnResizing: tableConfig.enableColumnResizing,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel<TData>(),
    getFilteredRowModel: getFilteredRowModel<TData>(),
    // Only use pagination row model if pagination is enabled
    ...(tableConfig.enablePagination ? { getPaginationRowModel: getPaginationRowModel<TData>() } : {}),
    getSortedRowModel: getSortedRowModel<TData>(),
    getFacetedRowModel: getFacetedRowModel<TData>(),
    getFacetedUniqueValues: getFacetedUniqueValues<TData>(),
  }), [
    dataItems,
    columns,
    sorting,
    columnVisibility,
    rowSelection,
    columnFilters,
    // Only include pagination-related dependencies if pagination is enabled
    ...(tableConfig.enablePagination ? [pagination, pageSize, handlePaginationChange] : []),
    columnSizing,
    columnOrder,
    search,
    dateRange,
    handleColumnSizingChange,
    handleColumnOrderChange,
    tableConfig.enableRowSelection,
    tableConfig.enableColumnResizing,
    handleRowSelectionChange,
    handleSortingChange,
    setColumnFilters,
    setSearch,
    setDateRange,
  ]);

  // Set up the table with memoized configuration
  const table = useReactTable<TData>(tableOptions);

  // Create keyboard navigation handler
  const handleKeyDown = useCallback(
    createKeyboardNavigationHandler(table, (row, rowIndex) => {
      // Example action on keyboard activation
    }),
    []
  );

  // Add an effect to validate page number when page size changes
  useEffect(() => {
    // This effect ensures page is valid after page size changes
    const totalPages = Math.ceil(dataItems.length / pageSize);
    
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [dataItems.length, pageSize, page, setPage]);

  // Initialize default column sizes when columns are available and no saved sizes exist
  useEffect(() => {
    initializeColumnSizes(columns, setColumnSizing);
  }, [columns, setColumnSizing]);

  // Handle column resizing
  useEffect(() => {
    const isResizingAny =
      table.getHeaderGroups().some(headerGroup =>
        headerGroup.headers.some(header => header.column.getIsResizing())
      );

    trackColumnResizing(isResizingAny);

    // Cleanup on unmount
    return () => {
      cleanupColumnResizing();
    };
  }, [table]);

  // Reset column order
  const resetColumnOrder = useCallback(() => {
    // Reset to empty array (which resets to default order)
    table.setColumnOrder([]);
    setColumnOrder([]);
  }, [table]);

  return (
    <div className="space-y-4">
      {tableConfig.enableToolbar && (
        <DataTableToolbar
          table={table}
          setSearch={setSearch}
          setDateRange={setDateRange}
          totalSelectedItems={totalSelectedItems}
          deleteSelection={clearAllSelections}
          getSelectedItems={getSelectedItems}
          getAllItems={getAllItems}
          config={tableConfig}
          resetColumnSizing={() => {
            resetColumnSizing();
            // Force a small delay and then refresh the UI
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
            }, 100);
          }}
          resetColumnOrder={resetColumnOrder}
          entityName={exportConfig.entityName}
          columnMapping={exportConfig.columnMapping}
          columnWidths={exportConfig.columnWidths}
          headers={exportConfig.headers}
          transformFunction={exportConfig.transformFunction}
          customToolbarComponent={renderToolbarContent?.({
            selectedRows: dataItems.filter((item) => selectedItemIds[String(item[idField])]),
            allSelectedIds: Object.keys(selectedItemIds),
            totalSelectedCount: totalSelectedItems,
            resetSelection: clearAllSelections
          })}
        />
      )}

      {tableConfig.enableStaticHeader ? (
        // Static header layout - header stays fixed, body scrolls
        <div className="rounded-md border table-container">
          {/* Static Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <Table className={tableConfig.enableColumnResizing ? "resizable-table" : ""}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        className="px-2 py-2 relative text-left group/th"
                        key={header.id}
                        colSpan={header.colSpan}
                        scope="col"
                        tabIndex={-1}
                        style={{
                          width: header.getSize(),
                        }}
                        data-column-resizing={header.column.getIsResizing() ? "true" : undefined}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {tableConfig.enableColumnResizing && header.column.getCanResize() && (
                          <DataTableResizer header={header} />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            </Table>
          </div>
          
          {/* Scrollable Body */}
          <div
            ref={tableContainerRef}
            className="overflow-y-auto"
            aria-label="Data table body"
            onKeyDown={tableConfig.enableKeyboardNavigation ? handleKeyDown : undefined}
          >
            <Table className={tableConfig.enableColumnResizing ? "resizable-table" : ""}>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  // Data rows
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow
                      key={row.id}
                      id={`row-${rowIndex}`}
                      data-row-index={rowIndex}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      tabIndex={0}
                      aria-selected={row.getIsSelected()}
                      onClick={tableConfig.enableClickRowSelect ? () => row.toggleSelected() : undefined}
                      onFocus={(e) => {
                        // Add a data attribute to the currently focused row
                        for (const el of document.querySelectorAll('[data-focused="true"]')) {
                          el.removeAttribute('data-focused');
                        }
                        e.currentTarget.setAttribute('data-focused', 'true');
                      }}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <TableCell
                          className="px-4 py-2 truncate max-w-0 text-left"
                          key={cell.id}
                          id={`cell-${rowIndex}-${cellIndex}`}
                          data-cell-index={cellIndex}
                          style={{
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  // No results
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-left truncate"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        // Regular layout - entire table scrolls together
        <div
          ref={tableContainerRef}
          className="overflow-y-auto rounded-md border table-container"
          aria-label="Data table"
          onKeyDown={tableConfig.enableKeyboardNavigation ? handleKeyDown : undefined}
        >
          <Table className={tableConfig.enableColumnResizing ? "resizable-table" : ""}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="px-2 py-2 relative text-left group/th"
                      key={header.id}
                      colSpan={header.colSpan}
                      scope="col"
                      tabIndex={-1}
                      style={{
                        width: header.getSize(),
                      }}
                      data-column-resizing={header.column.getIsResizing() ? "true" : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {tableConfig.enableColumnResizing && header.column.getCanResize() && (
                        <DataTableResizer header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                // Data rows
                table.getRowModel().rows.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    id={`row-${rowIndex}`}
                    data-row-index={rowIndex}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    tabIndex={0}
                    aria-selected={row.getIsSelected()}
                    onClick={tableConfig.enableClickRowSelect ? () => row.toggleSelected() : undefined}
                    onFocus={(e) => {
                      // Add a data attribute to the currently focused row
                      for (const el of document.querySelectorAll('[data-focused="true"]')) {
                        el.removeAttribute('data-focused');
                      }
                      e.currentTarget.setAttribute('data-focused', 'true');
                    }}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell
                        className="px-4 py-2 truncate max-w-0 text-left"
                        key={cell.id}
                        id={`cell-${rowIndex}-${cellIndex}`}
                        data-cell-index={cellIndex}
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // No results
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-left truncate"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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