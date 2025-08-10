import {
    aggregationFns as aggregationFnsDefault,
    getCoreRowModel,
    getExpandedRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getGroupedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
} from "@tanstack/react-table";
import { useId, useMemo } from "react";

// Placeholder imports for missing dependencies
import type { DefinedTableOptions, RowData, TableOptions } from "../types";

// Placeholder values for missing dependencies
const DefaultIcons = {};
const LocalizationEN = {
    actions: "Actions",
    and: "and",
    cancel: "Cancel",
    changeFilterMode: "Change filter mode",
    changeSearchMode: "Change search mode",
    clearFilter: "Clear filter",
    clearSearch: "Clear search",
    clearSelection: "Clear selection",
    clearSort: "Clear sort",
    clickToCopy: "Click to copy",
    copy: "Copy",
    collapse: "Collapse",
    collapseAll: "Collapse all",
    columnActions: "Column Actions",
    copiedToClipboard: "Copied to clipboard",
    dropToGroupBy: "Drop to group by {column}",
    edit: "Edit",
    expand: "Expand",
    expandAll: "Expand all",
    filterArrIncludes: "Includes",
    filterArrIncludesAll: "Includes all",
    filterArrIncludesSome: "Includes",
    filterBetween: "Between",
    filterBetweenInclusive: "Between Inclusive",
    filterByColumn: "Filter by {column}",
    filterContains: "Contains",
    filterEmpty: "Empty",
    filterEndsWith: "Ends With",
    filterEquals: "Equals",
    filterEqualsString: "Equals",
    filterFuzzy: "Fuzzy",
    filterGreaterThan: "Greater Than",
    filterGreaterThanOrEqualTo: "Greater Than Or Equal To",
    filterInNumberRange: "Between",
    filterIncludesString: "Contains",
    filterIncludesStringSensitive: "Contains",
    filterLessThan: "Less Than",
    filterLessThanOrEqualTo: "Less Than Or Equal To",
    filterMode: "Filter Mode: {filterType}",
    filterNotEmpty: "Not Empty",
    filterNotEquals: "Not Equals",
    filterStartsWith: "Starts With",
    filterWeakEquals: "Equals",
    filteringByColumn: "Filtering by {column} - {filterType} {filterValue}",
    goToFirstPage: "Go to first page",
    goToLastPage: "Go to last page",
    goToNextPage: "Go to next page",
    goToPreviousPage: "Go to previous page",
    grab: "Grab",
    groupByColumn: "Group by {column}",
    groupedBy: "Grouped by ",
    hideAll: "Hide all",
    hideColumn: "Hide {column} column",
    // language key is used for Intl number formatting elsewhere
    language: "en",
    max: "Max",
    min: "Min",
    move: "Move",
    noRecordsToDisplay: "No records to display",
    noResultsFound: "No results found",
    of: "of",
    or: "or",
    pin: "Pin",
    pinToLeft: "Pin to left",
    pinToRight: "Pin to right",
    resetColumnSize: "Reset column size",
    resetOrder: "Reset order",
    resetPins: "Reset pins",
    rowActions: "Row Actions",
    rowNumber: "#",
    rowNumbers: "Row Numbers",
    rowsPerPage: "Rows per page",
    save: "Save",
    search: "Search",
    select: "Select",
    selectedCountOfRowCountRowsSelected: "{selectedCount} of {rowCount} row(s) selected",
    showAll: "Show all",
    showAllColumns: "Show all columns",
    showHideColumns: "Show/Hide columns",
    showHideFilters: "Show/Hide filters",
    showHideSearch: "Show/Hide search",
    sortByColumnAsc: "Sort by {column} ascending",
    sortByColumnDesc: "Sort by {column} descending",
    sortedByColumnAsc: "Sorted by {column} ascending",
    sortedByColumnDesc: "Sorted by {column} descending",
    thenBy: ", then by ",
    toggleDensity: "Toggle density",
    toggleFullScreen: "Toggle full screen",
    toggleSelectAll: "Toggle select all",
    toggleSelectRow: "Toggle select row",
    toggleVisibility: "Toggle visibility",
    ungroupByColumn: "Ungroup by {column}",
    unpin: "Unpin",
    unpinAll: "Unpin all",
};
const FilterFns = {};
const SortingFns = {};

export const DefaultColumn = {
    filterVariant: "text",
    maxSize: 1000,
    minSize: 40,
    size: 180,
} as const;

export const DefaultDisplayColumn = {
    columnDefType: "display",
    enableClickToCopy: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableColumnFilter: false,
    enableColumnOrdering: false,
    enableEditing: false,
    enableGlobalFilter: false,
    enableGrouping: false,
    enableHiding: false,
    enableResizing: false,
    enableSorting: false,
} as const;

export const useTableOptions: <TData extends RowData>(tableOptions: TableOptions<TData>) => DefinedTableOptions<TData> = <TData extends RowData>({
    aggregationFns,
    autoResetExpanded = false,
    columnFilterDisplayMode = "subheader",
    columnResizeDirection,
    columnResizeMode = "onChange",
    createDisplayMode = "modal",
    defaultColumn,
    defaultDisplayColumn,
    editDisplayMode = "modal",
    enableBatchRowSelection = true,
    enableBottomToolbar = true,
    enableColumnActions = true,
    enableColumnFilters = true,
    enableColumnOrdering = false,
    enableColumnPinning = false,
    enableColumnResetPins = false,
    enableColumnResizing = false,
    enableColumnUnpinAll = true,
    enableColumnVirtualization,
    enableDensityToggle = true,
    enableExpandAll = true,
    enableExpanding,
    enableFacetedValues = false,
    enableFilterMatchHighlighting = true,
    enableFilters = true,
    enableFullScreenToggle = true,
    enableGlobalFilter = true,
    enableGlobalFilterRankedResults = true,
    enableGrouping = false,
    enableHiding = true,
    enableKeyboardShortcuts = true,
    enableMultiRowSelection = true,
    enableMultiSort = true,
    enablePagination = true,
    enableRowPinning = false,
    enableRowSelection = false,
    enableRowVirtualization,
    enableSelectAll = true,
    enableSorting = true,
    enableStickyHeader = false,
    enableTableFooter = true,
    enableTableHead = true,
    enableToolbarInternalActions = true,
    enableTopToolbar = true,
    filterFns,
    // icons prop not part of TableOptions in our types; keep internal DefaultIcons
    id = useId(),
    layoutMode,
    localization,
    manualFiltering,
    manualGrouping,
    manualPagination,
    manualSorting,
    paginationDisplayMode = "default",
    positionActionsColumn = "first",
    positionCreatingRow = "top",
    positionExpandColumn = "first",
    positionGlobalFilter = "right",
    positionPagination = "bottom",
    positionToolbarAlertBanner = "top",
    positionToolbarDropZone = "top",
    rowNumberDisplayMode = "static",
    rowPinningDisplayMode = "sticky",
    selectAllMode = "page",
    sortingFns,
    ...rest
}: TableOptions<TData>) => {
    const iconsMerged = useMemo(() => {
        return { ...DefaultIcons };
    }, []);
    localization = useMemo(() => {
        return {
            ...LocalizationEN,
            ...localization,
        };
    }, [localization]);
    aggregationFns = useMemo(() => {
        return { ...aggregationFnsDefault, ...aggregationFns };
    }, []);
    filterFns = useMemo(() => {
        return { ...FilterFns, ...filterFns };
    }, []);
    sortingFns = useMemo(() => {
        return { ...SortingFns, ...sortingFns };
    }, []);
    defaultColumn = useMemo(() => {
        return { ...DefaultColumn, ...defaultColumn };
    }, [defaultColumn]);
    defaultDisplayColumn = useMemo(() => {
        return {
            ...DefaultDisplayColumn,
            ...defaultDisplayColumn,
        };
    }, [defaultDisplayColumn]);
    // cannot be changed after initialization
    [enableColumnVirtualization, enableRowVirtualization] = useMemo(() => [enableColumnVirtualization, enableRowVirtualization], []);

    if (!columnResizeDirection) {
        columnResizeDirection = "ltr";
    }

    layoutMode = layoutMode || (enableColumnResizing ? "grid-no-grow" : "semantic");

    if (layoutMode === "semantic" && (enableRowVirtualization || enableColumnVirtualization)) {
        layoutMode = "grid";
    }

    if (enableRowVirtualization) {
        enableStickyHeader = true;
    }

    if (enablePagination === false && manualPagination === undefined) {
        manualPagination = true;
    }

    if (!rest.data?.length) {
        manualFiltering = true;
        manualGrouping = true;
        manualPagination = true;
        manualSorting = true;
    }

    return {
        aggregationFns,
        autoResetExpanded,
        columnFilterDisplayMode,
        columnResizeDirection,
        columnResizeMode,
        createDisplayMode,
        defaultColumn,
        defaultDisplayColumn,
        editDisplayMode,
        enableBatchRowSelection,
        enableBottomToolbar,
        enableColumnActions,
        enableColumnFilters,
        enableColumnOrdering,
        enableColumnPinning,
        enableColumnResetPins,
        enableColumnResizing,
        enableColumnUnpinAll,
        enableColumnVirtualization,
        enableDensityToggle,
        enableExpandAll,
        enableExpanding,
        enableFacetedValues,
        enableFilterMatchHighlighting,
        enableFilters,
        enableFullScreenToggle,
        enableGlobalFilter,
        enableGlobalFilterRankedResults,
        enableGrouping,
        enableHiding,
        enableKeyboardShortcuts,
        enableMultiRowSelection,
        enableMultiSort,
        enablePagination,
        enableRowPinning,
        enableRowSelection,
        enableRowVirtualization,
        enableSelectAll,
        enableSorting,
        enableStickyHeader,
        enableTableFooter,
        enableTableHead,
        enableToolbarInternalActions,
        enableTopToolbar,
        filterFns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: enableExpanding || enableGrouping ? getExpandedRowModel() : undefined,
        getFacetedMinMaxValues: enableFacetedValues ? getFacetedMinMaxValues() : undefined,
        getFacetedRowModel: enableFacetedValues ? getFacetedRowModel() : undefined,
        getFacetedUniqueValues: enableFacetedValues ? getFacetedUniqueValues() : undefined,
        getFilteredRowModel: (enableColumnFilters || enableGlobalFilter || enableFilters) && !manualFiltering ? getFilteredRowModel() : undefined,
        getGroupedRowModel: enableGrouping && !manualGrouping ? getGroupedRowModel() : undefined,
        getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
        getSortedRowModel: enableSorting && !manualSorting ? getSortedRowModel() : undefined,
        getSubRows: (row: any) => row?.subRows,
        icons: iconsMerged,
        id,
        layoutMode,
        localization,
        manualFiltering,
        manualGrouping,
        manualPagination,
        manualSorting,
        paginationDisplayMode,
        positionActionsColumn,
        positionCreatingRow,
        positionExpandColumn,
        positionGlobalFilter,
        positionPagination,
        positionToolbarAlertBanner,
        positionToolbarDropZone,
        rowNumberDisplayMode,
        rowPinningDisplayMode,
        selectAllMode,
        sortingFns,
        ...rest,
    } as DefinedTableOptions<TData>;
};
