import type { TableInstance, RowData, TableOptions } from './types';

/**
 * Creates a mock table instance for testing
 */
export const createTestTableInstance = <TData extends RowData>(
    overrides: Partial<TableInstance<TData>> = {}
): TableInstance<TData> => {
    const defaultTableInstance: TableInstance<TData> = {
        // Core table methods
        getState: () => ({
            isFullScreen: false,
            showColumnFilters: false,
            showGlobalFilter: false,
            globalFilter: '',
            pagination: { pageIndex: 0, pageSize: 10 },
            rowSelection: {},
            sorting: [],
            columnOrder: [],
            columnFilters: [],
            columnVisibility: {},
            expanded: {},
            grouping: [],
            rowPinning: { top: [], bottom: [] },
            density: 'md',
            creatingRow: null,
            editingRow: null,
            editingCell: null,
            actionCell: null,
            hoveredColumn: null,
            hoveredRow: null,
            draggingColumn: null,
            draggingRow: null,
            showSkeletons: false,
            isLoading: false,
            isSaving: false,
            showAlertBanner: false,
            showProgressBars: false,
            columnFilterFns: {},
            globalFilterFn: 'fuzzy',
        }),
        
        // State setters
        setIsFullScreen: () => {},
        setShowColumnFilters: () => {},
        setShowGlobalFilter: () => {},
        setGlobalFilter: () => {},
        setPagination: () => {},
        setRowSelection: () => {},
        setSorting: () => {},
        setColumnOrder: () => {},
        setColumnFilters: () => {},
        setColumnVisibility: () => {},
        setExpanded: () => {},
        setGrouping: () => {},
        setRowPinning: () => {},
        setDensity: () => {},
        setCreatingRow: () => {},
        setEditingRow: () => {},
        setEditingCell: () => {},
        setActionCell: () => {},
        setHoveredColumn: () => {},
        setHoveredRow: () => {},
        setDraggingColumn: () => {},
        setDraggingRow: () => {},
        setShowSkeletons: () => {},
        setIsLoading: () => {},
        setIsSaving: () => {},
        setShowAlertBanner: () => {},
        setShowProgressBars: () => {},
        setColumnFilterFns: () => {},
        setGlobalFilterFn: () => {},

        // Data methods
        getRowModel: () => ({ rows: [] }),
        getTopRows: () => [],
        getBottomRows: () => [],
        getCoreRowModel: () => ({ rows: [] }),
        getFilteredRowModel: () => ({ rows: [] }),
        getSortedRowModel: () => ({ rows: [] }),
        getGroupedRowModel: () => ({ rows: [] }),
        getExpandedRowModel: () => ({ rows: [] }),
        getPaginationRowModel: () => ({ rows: [] }),
        
        // Column methods
        getAllColumns: () => [],
        getAllLeafColumns: () => [],
        getVisibleLeafColumns: () => [],
        getLeftLeafColumns: () => [],
        getCenterLeafColumns: () => [],
        getRightLeafColumns: () => [],
        
        // Header methods
        getHeaderGroups: () => [],
        getLeftHeaderGroups: () => [],
        getCenterHeaderGroups: () => [],
        getRightHeaderGroups: () => [],
        getFooterGroups: () => [],
        getLeftFooterGroups: () => [],
        getCenterFooterGroups: () => [],
        getRightFooterGroups: () => [],
        
        // Selection methods
        getIsAllRowsSelected: () => false,
        getIsSomeRowsSelected: () => false,
        getToggleAllRowsSelectedHandler: () => () => {},
        
        // Pagination methods
        getCanPreviousPage: () => false,
        getCanNextPage: () => false,
        previousPage: () => {},
        nextPage: () => {},
        firstPage: () => {},
        lastPage: () => {},
        setPageIndex: () => {},
        setPageSize: () => {},
        getPageCount: () => 1,
        
        // Sorting methods
        resetSorting: () => {},
        
        // Filtering methods
        resetColumnFilters: () => {},
        resetGlobalFilter: () => {},
        
        // Grouping methods
        resetGrouping: () => {},
        
        // Expansion methods
        resetExpanded: () => {},
        toggleAllRowsExpanded: () => {},
        
        // Pinning methods
        getIsSomeRowsPinned: () => false,
        resetRowPinning: () => {},
        
        // Column ordering methods
        resetColumnOrder: () => {},
        
        // Column visibility methods
        resetColumnVisibility: () => {},
        toggleAllColumnsVisible: () => {},
        
        // Options and refs
        options: {
            data: [],
            columns: [],
            enableBottomToolbar: true,
            enableTopToolbar: true,
            mantinePaperProps: undefined,
            renderBottomToolbar: undefined,
            renderTopToolbar: undefined,
            localization: {
                toggleFullScreen: 'Toggle Fullscreen',
                showHideFilters: 'Show/Hide Filters',
                showHideSearch: 'Show/Hide Search',
                toggleDensity: 'Toggle Density',
            },
        },
        
        refs: {
            tablePaperRef: { current: null },
            tableContainerRef: { current: null },
            tableHeadRef: { current: null },
            tableFooterRef: { current: null },
            topToolbarRef: { current: null },
            bottomToolbarRef: { current: null },
            searchInputRef: { current: null },
            actionCellRef: { current: null },
            editInputRefs: { current: {} },
            filterInputRefs: { current: {} },
            tableHeadCellRefs: { current: {} },
            lastSelectedRowId: { current: null },
        },
        
        // Override with provided values
        ...overrides,
    };

    return defaultTableInstance;
};

/**
 * Creates test data for table testing
 */
export const createTestData = <TData extends RowData>(count: number = 5): TData[] => {
    return Array.from({ length: count }, (_, index) => ({
        id: `row-${index}`,
        name: `Test Item ${index + 1}`,
        status: index % 2 === 0 ? 'active' : 'inactive',
        value: Math.floor(Math.random() * 100),
        createdAt: new Date().toISOString(),
    })) as TData[];
};

/**
 * Creates test columns for table testing
 */
export const createTestColumns = () => [
    {
        id: 'name',
        accessorKey: 'name',
        header: 'Name',
    },
    {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
    },
    {
        id: 'value',
        accessorKey: 'value',
        header: 'Value',
    },
    {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Created At',
    },
];

/**
 * Creates a complete test table configuration
 */
export const createTestTableOptions = <TData extends RowData>(
    overrides: Partial<TableOptions<TData>> = {}
): TableOptions<TData> => {
    return {
        data: createTestData<TData>(),
        columns: createTestColumns(),
        enableBottomToolbar: true,
        enableTopToolbar: true,
        enableFullScreenToggle: true,
        enableColumnFilters: true,
        enableGlobalFilter: true,
        enableSorting: true,
        enablePagination: true,
        ...overrides,
    } as TableOptions<TData>;
};