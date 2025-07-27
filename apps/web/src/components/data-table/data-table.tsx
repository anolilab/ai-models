"use client";

import * as React from "react";
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
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { usePerformanceMonitor } from "./utils/performance-utils";

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

  // Virtualization options (only used when enableRowVirtualization is true)
  virtualizationOptions?: {
    estimatedRowHeight?: number;
    overscan?: number;
    containerHeight?: number;
  };
}

export function DataTable<TData extends ExportableData, TValue>({
  config = {},
  getColumns,
  data,
  exportConfig,
  idField = 'id' as keyof TData,
  pageSizeOptions,
  renderToolbarContent,
  virtualizationOptions = {}
}: DataTableProps<TData, TValue>) {
  // Performance monitoring (disabled in test environment)
  if (process.env.NODE_ENV !== 'test') {
    usePerformanceMonitor('DataTable');
  }

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

  // PERFORMANCE FIX: Use Set for selection state when virtualization is enabled, Record otherwise
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string | number, boolean> | Set<string>>(
    tableConfig.enableRowVirtualization ? new Set() : {}
  );

  // Helper functions to handle both Record and Set selection states
  const isItemSelected = useCallback((itemId: string): boolean => {
    if (tableConfig.enableRowVirtualization) {
      return (selectedItemIds as Set<string>).has(itemId);
    } else {
      return !!(selectedItemIds as Record<string, boolean>)[itemId];
    }
  }, [selectedItemIds, tableConfig.enableRowVirtualization]);

  const addSelectedItem = useCallback((itemId: string) => {
    if (tableConfig.enableRowVirtualization) {
      setSelectedItemIds(prev => {
        const next = new Set(prev as Set<string>);
        next.add(itemId);
        return next;
      });
    } else {
      setSelectedItemIds(prev => ({
        ...(prev as Record<string, boolean>),
        [itemId]: true
      }));
    }
  }, [tableConfig.enableRowVirtualization]);

  const removeSelectedItem = useCallback((itemId: string) => {
    if (tableConfig.enableRowVirtualization) {
      setSelectedItemIds(prev => {
        const next = new Set(prev as Set<string>);
        next.delete(itemId);
        return next;
      });
    } else {
      setSelectedItemIds(prev => {
        const next = { ...(prev as Record<string, boolean>) };
        delete next[itemId];
        return next;
      });
    }
  }, [tableConfig.enableRowVirtualization]);

  const clearAllSelections = useCallback(() => {
    setSelectedItemIds(tableConfig.enableRowVirtualization ? new Set() : {});
  }, [tableConfig.enableRowVirtualization]);

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

  // Convert the sorting to the format TanStack Table expects
  const sorting = useMemo(() => createSortingState(sortBy, sortOrder), [sortBy, sortOrder]);

  // Get current data items with date filtering - optimized for React Compiler
  const dataItems = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // If no date range is set, return all data (fast path)
    if (!dateRange.from_date && !dateRange.to_date) {
      return data;
    }
    
    // Pre-compile date objects to avoid repeated Date constructor calls
    const fromDate = dateRange.from_date ? new Date(dateRange.from_date) : null;
    const toDate = dateRange.to_date ? new Date(dateRange.to_date) : null;
    
    // Use a more efficient filtering approach
    const filteredData = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const itemDate = (item as any).lastUpdated || (item as any).releaseDate;
      
      // Fast path for items without dates
      if (!itemDate || itemDate === 'N/A') {
        filteredData.push(item);
        continue;
      }
      
      // Parse date once and reuse
      const itemDateObj = new Date(itemDate);
      if (isNaN(itemDateObj.getTime())) {
        filteredData.push(item);
        continue;
      }
      
      // Check date range
      if (fromDate && itemDateObj < fromDate) continue;
      if (toDate && itemDateObj > toDate) continue;
      
      filteredData.push(item);
    }
    
    return filteredData;
  }, [data, dateRange.from_date, dateRange.to_date]);

  // PERFORMANCE FIX: Derive rowSelection from selectedItemIds - React Compiler optimized
  const rowSelection = useMemo(() => {
    if (!dataItems.length) return {};

    // Use a more efficient approach for React Compiler
    const selection: Record<string, boolean> = {};
    const dataLength = dataItems.length;
    
    for (let i = 0; i < dataLength; i++) {
      const item = dataItems[i];
      const itemId = String(item[idField]);
      if (isItemSelected(itemId)) {
        selection[String(i)] = true;
      }
    }

    return selection;
  }, [dataItems, isItemSelected, idField]);

  // Calculate total selected items - memoize to avoid recalculation
  const totalSelectedItems = useMemo(() =>
    getSelectedCount(),
    [getSelectedCount]
  );

  // PERFORMANCE FIX: Optimized row deselection handler
  const handleRowDeselection = useCallback((rowId: string) => {
    if (!dataItems.length) return;

    const rowIndex = Number.parseInt(rowId, 10);
    const item = dataItems[rowIndex];

    if (item) {
      const itemId = String(item[idField]);
      removeSelectedItem(itemId);
    }
  }, [dataItems, idField, removeSelectedItem]);

  // PERFORMANCE FIX: Optimized row selection handler
  const handleRowSelectionChange = useCallback((updaterOrValue: RowSelectionUpdater | Record<string, boolean>) => {
    // Determine the new row selection value
    const newRowSelection = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection)
      : updaterOrValue;

    // Process changes for current page
    if (dataItems.length) {
      // First handle explicit selections in newRowSelection
      for (const [rowId, isSelected] of Object.entries(newRowSelection)) {
        const rowIndex = Number.parseInt(rowId, 10);
        if (rowIndex >= 0 && rowIndex < dataItems.length) {
          const item = dataItems[rowIndex];
          const itemId = String(item[idField]);

          if (isSelected) {
            addSelectedItem(itemId);
          } else {
            removeSelectedItem(itemId);
          }
        }
      }

      // Then handle implicit deselection (rows that were selected but aren't in newRowSelection)
      dataItems.forEach((item, index) => {
        const itemId = String(item[idField]);
        const rowId = String(index);

        // If item was selected but isn't in new selection, deselect it
        if (isItemSelected(itemId) && newRowSelection[rowId] === undefined) {
          removeSelectedItem(itemId);
        }
      });
    }
  }, [dataItems, rowSelection, idField, addSelectedItem, removeSelectedItem, isItemSelected]);

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
  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize,
    }),
    [page, pageSize]
  );

  // Ref for the table container for keyboard navigation
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Get columns with the deselection handler - React Compiler will optimize this
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

  // Set up the table with memoized configuration - React Compiler will optimize this
  const table = useReactTable<TData>(tableOptions);

  // VIRTUALIZATION SETUP (only when enabled)
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => virtualizationOptions.estimatedRowHeight || tableConfig.estimatedRowHeight,
    overscan: virtualizationOptions.overscan || tableConfig.virtualizationOverscan,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

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
            selectedRows: dataItems.filter((item) => isItemSelected(String(item[idField]))),
            allSelectedIds: getSelectedIds(),
            totalSelectedCount: totalSelectedItems,
            resetSelection: clearAllSelections
          })}
        />
      )}

      {tableConfig.enableStaticHeader ? (
        // Static header layout - header stays fixed, body scrolls
        <div 
          className="rounded-md border table-container"
          data-testid="data-table"
          style={tableConfig.enableRowVirtualization ? {
            height: (virtualizationOptions.containerHeight || 400) + 50, // Add extra space for header
          } : undefined}
        >
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
                        className="p-2 relative text-left group/th"
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
            className="overflow-y-auto flex-1"
            aria-label="Data table body"
            onKeyDown={tableConfig.enableKeyboardNavigation ? handleKeyDown : undefined}
            style={tableConfig.enableRowVirtualization ? {
              height: virtualizationOptions.containerHeight || 400,
            } : undefined}
          >
            {tableConfig.enableRowVirtualization && virtualRows.length > 0 ? (
              // Virtualized layout for static header
              <div
                style={{
                  height: `${totalSize}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <Table className={tableConfig.enableColumnResizing ? "resizable-table" : ""}>
                  <TableBody>
                    {virtualRows.map((virtualRow) => {
                      const row = rows[virtualRow.index];
                      return (
                        <TableRow
                          key={row.id}
                          id={`row-${virtualRow.index}`}
                          data-row-index={virtualRow.index}
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
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          style={{
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                          }}
                        >
                          {row.getVisibleCells().map((cell, cellIndex) => (
                            <TableCell
                              className="p-2 truncate text-left"
                              key={cell.id}
                              id={`cell-${virtualRow.index}-${cellIndex}`}
                              data-cell-index={cellIndex}
                              style={{
                                width: cell.column.getSize() + 5,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Non-virtualized layout for static header (fallback when virtualization fails or is disabled)
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
                            className="p-2 truncate text-left"
                            key={cell.id}
                            id={`cell-${rowIndex}-${cellIndex}`}
                            data-cell-index={cellIndex}
                            style={{
                              width: cell.column.getSize() + 5,
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
            )}
          </div>
        </div>
      ) : (
        // Regular layout - entire table scrolls together
        <div
          ref={tableContainerRef}
          className="overflow-y-auto rounded-md border table-container"
          data-testid="data-table"
          aria-label="Data table"
          onKeyDown={tableConfig.enableKeyboardNavigation ? handleKeyDown : undefined}
          style={tableConfig.enableRowVirtualization ? {
            height: virtualizationOptions.containerHeight || 400,
          } : undefined}
        >
          {tableConfig.enableRowVirtualization && virtualRows.length > 0 ? (
            // Virtualized layout
            <div
              style={{
                height: `${totalSize}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <Table className={tableConfig.enableColumnResizing ? "resizable-table" : ""}>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          className="p-2 relative text-left group/th"
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
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
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
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                        }}
                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <TableCell
                            className="p-2 truncate text-left"
                            key={cell.id}
                            data-cell-index={cellIndex}
                            style={{
                              width: cell.column.getSize() + 5,
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Regular layout (non-virtualized)
            <Table className={tableConfig.enableColumnResizing ? "resizable-table" : ""}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        className="p-2 relative text-left group/th"
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
                          className="p-2 truncate text-left"
                          key={cell.id}
                          id={`cell-${rowIndex}-${cellIndex}`}
                          data-cell-index={cellIndex}
                          style={{
                            width: cell.column.getSize() + 5,
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
          )}
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

