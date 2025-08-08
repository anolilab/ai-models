/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable sonarjs/redundant-type-aliases */

import type { AccessorFn, AggregationFn, Cell as TanStackCell, Column as TanStackColumn, ColumnDef as TanStackColumnDef, DeepKeys, DeepValue, FilterFn, Header as TanStackHeader, HeaderGroup as TanStackHeaderGroup, OnChangeFn, Row as TanStackRow, SortingFn, Table, TableOptions as TanStackTableOptions, TableState as TanStackTableState } from "@tanstack/react-table";
import type { VirtualItem as TanStackVirtualItem, Virtualizer, VirtualizerOptions } from "@tanstack/react-virtual";
import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";

export type LiteralUnion<T extends U, U = string>
  = | T
      | (Record<never, never> & U);

export type Prettify<T> = unknown & { [K in keyof T]: T[K] };

export type Xor<A, B>
  = | Prettify<A & { [k in keyof B]?: never }>
      | Prettify<B & { [k in keyof A]?: never }>;

export type DropdownOption
  = | {
      label?: string;
      value: any;
  }
  | string;

export type DensityState = "comfortable" | "compact" | "spacious";

export type ColumnFilterFnsState = Record<string, FilterOption>;

export type RowData = Record<string, any>;

export type { ColumnFiltersState, ColumnOrderState, ColumnPinningState, ColumnSizingInfoState, ColumnSizingState, ExpandedState, GroupingState, PaginationState, RowSelectionState, SortingState, Updater, VisibilityState } from "@tanstack/react-table";
export type VirtualItem = TanStackVirtualItem;

export type ColumnVirtualizer<
    TScrollElement extends Element | Window = HTMLDivElement,
    TItemElement extends Element = HTMLTableCellElement,
> = Virtualizer<TScrollElement, TItemElement> & {
    virtualColumns: VirtualItem[];
    virtualPaddingLeft?: number;
    virtualPaddingRight?: number;
};

export type RowVirtualizer<
    TScrollElement extends Element | Window = HTMLDivElement,
    TItemElement extends Element = HTMLTableRowElement,
> = Virtualizer<TScrollElement, TItemElement> & {
    virtualRows: VirtualItem[];
};

export type ColumnHelper<TData extends RowData> = {
    accessor: <
        TAccessor extends AccessorFn<TData> | DeepKeys<TData>,
        TValue extends TAccessor extends AccessorFn<TData, infer TReturn>
            ? TReturn
            : TAccessor extends DeepKeys<TData>
                ? DeepValue<TData, TAccessor>
                : never,
    >(
        accessor: TAccessor,
        column: DisplayColumnDef<TData, TValue>,
    ) => ColumnDef<TData, TValue>;
    display: (column: DisplayColumnDef<TData>) => ColumnDef<TData>;
    group: (column: GroupColumnDef<TData>) => ColumnDef<TData>;
};

export interface Localization {
    actions: string;
    and: string;
    cancel: string;
    changeFilterMode: string;
    changeSearchMode: string;
    clearFilter: string;
    clearSearch: string;
    clearSelection: string;
    clearSort: string;
    clickToCopy: string;
    collapse: string;
    collapseAll: string;
    columnActions: string;
    copiedToClipboard: string;
    copy: string;
    dropToGroupBy: string;
    edit: string;
    expand: string;
    expandAll: string;
    filterArrIncludes: string;
    filterArrIncludesAll: string;
    filterArrIncludesSome: string;
    filterBetween: string;
    filterBetweenInclusive: string;
    filterByColumn: string;
    filterContains: string;
    filterEmpty: string;
    filterEndsWith: string;
    filterEquals: string;
    filterEqualsString: string;
    filterFuzzy: string;
    filterGreaterThan: string;
    filterGreaterThanOrEqualTo: string;
    filterIncludesString: string;
    filterIncludesStringSensitive: string;
    filteringByColumn: string;
    filterInNumberRange: string;
    filterLessThan: string;
    filterLessThanOrEqualTo: string;
    filterMode: string;
    filterNotEmpty: string;
    filterNotEquals: string;
    filterStartsWith: string;
    filterWeakEquals: string;
    goToFirstPage: string;
    goToLastPage: string;
    goToNextPage: string;
    goToPreviousPage: string;
    grab: string;
    groupByColumn: string;
    groupedBy: string;
    hideAll: string;
    hideColumn: string;
    showColumn: string;
    // language of the localization as BCP 47 language tag for number formatting
    language: string;
    max: string;
    min: string;
    move: string;
    noRecordsToDisplay: string;
    noResultsFound: string;
    of: string;
    or: string;
    pin: string;
    pinToLeft: string;
    pinToRight: string;
    resetColumnSize: string;
    resetOrder: string;
    rowActions: string;
    rowNumber: string;
    rowNumbers: string;
    rowsPerPage: string;
    save: string;
    search: string;
    select: string;
    selectedCountOfRowCountRowsSelected: string;
    showAll: string;
    showAllColumns: string;
    showHideColumns: string;
    showHideFilters: string;
    showHideSearch: string;
    sortByColumnAsc: string;
    sortByColumnDesc: string;
    sortedByColumnAsc: string;
    sortedByColumnDesc: string;
    thenBy: string;
    toggleDensity: string;
    toggleFullScreen: string;
    toggleSelectAll: string;
    toggleSelectRow: string;
    toggleVisibility: string;
    ungroupByColumn: string;
    unpin: string;
    unpinAll: string;
}

export interface Theme {
    baseBackgroundColor: string;
    cellNavigationOutlineColor: string;
    draggingBorderColor: string;
    matchHighlightColor: string;
    menuBackgroundColor: string;
    pinnedRowBackgroundColor: string;
    selectedRowBackgroundColor: string;
}

export interface RowModel<TData extends RowData> {
    flatRows: Row<TData>[];
    rows: Row<TData>[];
    rowsById: { [key: string]: Row<TData> };
}

export type TableInstance<TData extends RowData> = Omit<
    Table<TData>,
    | "getAllColumns"
    | "getAllFlatColumns"
    | "getAllLeafColumns"
    | "getBottomRows"
    | "getCenterLeafColumns"
    | "getCenterRows"
    | "getColumn"
    | "getExpandedRowModel"
    | "getFlatHeaders"
    | "getFooterGroups"
    | "getHeaderGroups"
    | "getLeafHeaders"
    | "getLeftLeafColumns"
    | "getPaginationRowModel"
    | "getPreFilteredRowModel"
    | "getPrePaginationRowModel"
    | "getRightLeafColumns"
    | "getRowModel"
    | "getSelectedRowModel"
    | "getState"
    | "getTopRows"
    | "options"
> & {
    getAllColumns: () => Column<TData>[];
    getAllFlatColumns: () => Column<TData>[];
    getAllLeafColumns: () => Column<TData>[];
    getBottomRows: () => Row<TData>[];
    getCenterLeafColumns: () => Column<TData>[];
    getCenterRows: () => Row<TData>[];
    getColumn: (columnId: string) => Column<TData>;
    getExpandedRowModel: () => RowModel<TData>;
    getFlatHeaders: () => Header<TData>[];
    getFooterGroups: () => HeaderGroup<TData>[];
    getHeaderGroups: () => HeaderGroup<TData>[];
    getLeafHeaders: () => Header<TData>[];
    getLeftLeafColumns: () => Column<TData>[];
    getPaginationRowModel: () => RowModel<TData>;
    getPreFilteredRowModel: () => RowModel<TData>;
    getPrePaginationRowModel: () => RowModel<TData>;
    getRightLeafColumns: () => Column<TData>[];
    getRowModel: () => RowModel<TData>;
    getSelectedRowModel: () => RowModel<TData>;
    getState: () => TableState<TData>;
    getTopRows: () => Row<TData>[];
    options: StatefulTableOptions<TData>;
    refs: {
        actionCellRef: RefObject<HTMLTableCellElement | null>;
        bottomToolbarRef: RefObject<HTMLDivElement | null>;
        editInputRefs: RefObject<Record<string, HTMLInputElement> | null>;
        filterInputRefs: RefObject<Record<string, HTMLInputElement> | null>;
        lastSelectedRowId: RefObject<null | string>;
        searchInputRef: RefObject<HTMLInputElement | null>;
        tableContainerRef: RefObject<HTMLDivElement | null>;
        tableFooterRef: RefObject<HTMLTableSectionElement | null>;
        tableHeadCellRefs: RefObject<Record<string, HTMLTableCellElement> | null>;
        tableHeadRef: RefObject<HTMLTableSectionElement | null>;
        tablePaperRef: RefObject<HTMLDivElement | null>;
        topToolbarRef: RefObject<HTMLDivElement | null>;
    };
    setActionCell: Dispatch<SetStateAction<Cell<TData> | null>>;
    setColumnFilterFns: Dispatch<SetStateAction<ColumnFilterFnsState>>;
    setCreatingRow: Dispatch<SetStateAction<Row<TData> | null | true>>;
    setDensity: Dispatch<SetStateAction<DensityState>>;
    setDraggingColumn: Dispatch<SetStateAction<Column<TData> | null>>;
    setDraggingRow: Dispatch<SetStateAction<Row<TData> | null>>;
    setEditingCell: Dispatch<SetStateAction<Cell<TData> | null>>;
    setEditingRow: Dispatch<SetStateAction<Row<TData> | null>>;
    setGlobalFilterFn: Dispatch<SetStateAction<FilterOption>>;
    setHoveredColumn: Dispatch<SetStateAction<Partial<Column<TData>> | null>>;
    setHoveredRow: Dispatch<SetStateAction<Partial<Row<TData>> | null>>;
    setIsFullScreen: Dispatch<SetStateAction<boolean>>;
    setShowAlertBanner: Dispatch<SetStateAction<boolean>>;
    setShowColumnFilters: Dispatch<SetStateAction<boolean>>;
    setShowGlobalFilter: Dispatch<SetStateAction<boolean>>;
    setShowToolbarDropZone: Dispatch<SetStateAction<boolean>>;
};

export type DefinedTableOptions<TData extends RowData> = TableOptions<TData>;

export type StatefulTableOptions<TData extends RowData>
    = DefinedTableOptions<TData> & {
        state: Pick<
            TableState<TData>,
            | "columnFilterFns"
            | "columnOrder"
            | "columnSizingInfo"
            | "creatingRow"
            | "density"
            | "draggingColumn"
            | "draggingRow"
            | "editingCell"
            | "editingRow"
            | "globalFilterFn"
            | "grouping"
            | "hoveredColumn"
            | "hoveredRow"
            | "isFullScreen"
            | "pagination"
            | "showAlertBanner"
            | "showColumnFilters"
            | "showGlobalFilter"
            | "showToolbarDropZone"
        >;
    };

export interface TableState<TData extends RowData> extends TanStackTableState {
    actionCell?: Cell<TData> | null;
    columnFilterFns: ColumnFilterFnsState;
    creatingRow: Row<TData> | null;
    density: DensityState;
    draggingColumn: Column<TData> | null;
    draggingRow: Row<TData> | null;
    editingCell: Cell<TData> | null;
    editingRow: Row<TData> | null;
    globalFilterFn: FilterOption;
    hoveredColumn: Partial<Column<TData>> | null;
    hoveredRow: Partial<Row<TData>> | null;
    isFullScreen: boolean;
    isLoading: boolean;
    isSaving: boolean;
    showAlertBanner: boolean;
    showColumnFilters: boolean;
    showGlobalFilter: boolean;
    showLoadingOverlay: boolean;
    showProgressBars: boolean;
    showSkeletons: boolean;
    showToolbarDropZone: boolean;
}

export interface ColumnDef<TData extends RowData, TValue = unknown>
    extends Omit<
        TanStackColumnDef<TData, TValue>,
        | "accessorKey"
        | "aggregatedCell"
        | "aggregationFn"
        | "cell"
        | "columns"
        | "filterFn"
        | "footer"
        | "header"
        | "id"
        | "sortingFn"
    > {
    accessorFn?: (originalRow: TData) => TValue;
    accessorKey?: DeepKeys<TData> | (string & {});
    AggregatedCell?: (props: {
        cell: Cell<TData, TValue>;
        column: Column<TData, TValue>;
        row: Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode;
    aggregationFn?: CustomAggregationFn<TData>[] | CustomAggregationFn<TData>;
    Cell?: (props: {
        cell: Cell<TData, TValue>;
        column: Column<TData, TValue>;
        renderedCellValue: ReactNode;
        row: Row<TData>;
        rowRef?: RefObject<HTMLTableRowElement | null>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode;
    columnDefType?: "data" | "display" | "group";
    columnFilterModeOptions?: LiteralUnion<FilterOption & string>[] | null;
    columns?: ColumnDef<TData, TValue>[];
    Edit?: (props: {
        cell: Cell<TData, TValue>;
        column: Column<TData, TValue>;
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => ReactNode;
    editSelectOptions?:
    | ((props: {
        cell: Cell<TData, TValue>;
        column: Column<TData>;
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => DropdownOption[])
    | DropdownOption[];
    editVariant?: "select" | "text";
    enableClickToCopy?:
        | "context-menu"
        | ((cell: Cell<TData>) => "context-menu" | boolean)
        | boolean;
    enableColumnActions?: boolean;
    enableColumnDragging?: boolean;
    enableColumnFilterModes?: boolean;
    enableColumnOrdering?: boolean;
    enableEditing?: ((row: Row<TData>) => boolean) | boolean;
    enableFilterMatchHighlighting?: boolean;
    Filter?: (props: {
        column: Column<TData, TValue>;
        header: Header<TData>;
        rangeFilterIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode;
    filterFn?: CustomFilterFn<TData>;
    filterSelectOptions?: DropdownOption[];
    filterVariant?:
        | "autocomplete"
        | "checkbox"
        | "date"
        | "date-range"
        | "datetime"
        | "datetime-range"
        | "multi-select"
        | "range"
        | "range-slider"
        | "select"
        | "text"
        | "time"
        | "time-range";
    footer?: string;
    Footer?:
    | ((props: {
        column: Column<TData, TValue>;
        footer: Header<TData>;
        table: TableInstance<TData>;
    }) => ReactNode)
    | ReactNode;
    GroupedCell?: (props: {
        cell: Cell<TData, TValue>;
        column: Column<TData, TValue>;
        row: Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode;
    grow?: boolean | number;
    header: string;
    Header?:
    | ((props: {
        column: Column<TData, TValue>;
        header: Header<TData>;
        table: TableInstance<TData>;
    }) => ReactNode)
    | ReactNode;
    id?: LiteralUnion<keyof TData & string>;
    PlaceholderCell?: (props: {
        cell: Cell<TData, TValue>;
        column: Column<TData, TValue>;
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => ReactNode;
    renderCellActionMenuItems?: (props: {
        cell: Cell<TData>;
        closeMenu: () => void;
        column: Column<TData>;
        internalMenuItems: ReactNode[];
        row: Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode[];
    renderColumnActionsMenuItems?: (props: {
        closeMenu: () => void;
        column: Column<TData>;
        internalColumnMenuItems: ReactNode[];
        table: TableInstance<TData>;
    }) => ReactNode[];
    renderColumnFilterModeMenuItems?: (props: {
        column: Column<TData>;
        internalFilterOptions: InternalFilterOption[];
        onSelectFilterMode: (filterMode: FilterOption) => void;
        table: TableInstance<TData>;
    }) => ReactNode[];
    sortingFn?: CustomSortingFn<TData>;
    visibleInShowHideMenu?: boolean;
}

export type DisplayColumnDef<
    TData extends RowData,
    TValue = unknown,
> = Omit<ColumnDef<TData, TValue>, "accessorFn" | "accessorKey">;

export type GroupColumnDef<TData extends RowData>
    = DisplayColumnDef<TData, any> & {
        columns: ColumnDef<TData>[];
    };

export type DefinedColumnDef<
    TData extends RowData,
    TValue = unknown,
> = Omit<ColumnDef<TData, TValue>, "defaultDisplayColumn" | "id"> & {
    _filterFn: FilterOption;
    defaultDisplayColumn: Partial<ColumnDef<TData, TValue>>;
    id: string;
};

export type Column<TData extends RowData, TValue = unknown> = Omit<
    TanStackColumn<TData, TValue>,
  "columnDef" | "columns" | "filterFn" | "footer" | "header"
> & {
    columnDef: DefinedColumnDef<TData, TValue>;
    columns?: Column<TData, TValue>[];
    filterFn?: CustomFilterFn<TData>;
    footer: string;
    header: string;
};

export type Header<TData extends RowData> = Omit<
    TanStackHeader<TData, unknown>,
    "column"
> & {
    column: Column<TData>;
};

export type HeaderGroup<TData extends RowData> = Omit<
    TanStackHeaderGroup<TData>,
    "headers"
> & {
    headers: Header<TData>[];
};

export type Row<TData extends RowData> = Omit<
    TanStackRow<TData>,
    | "_valuesCache"
    | "getAllCells"
    | "getParentRow"
    | "getParentRows"
    | "getRow"
    | "getVisibleCells"
    | "subRows"
> & {
    _valuesCache: Record<LiteralUnion<DeepKeys<TData> & string>, any>;
    getAllCells: () => Cell<TData>[];
    getParentRow: () => Row<TData> | null;
    getParentRows: () => Row<TData>[];
    getRow: () => Row<TData>;
    getVisibleCells: () => Cell<TData>[];
    subRows?: Row<TData>[];
};

export type Cell<TData extends RowData, TValue = unknown> = Omit<
    TanStackCell<TData, TValue>,
  "column" | "row"
> & {
    column: Column<TData, TValue>;
    row: Row<TData>;
};

export type AggregationOption = string;

export type CustomAggregationFn<TData extends RowData>
  = | AggregationFn<TData>
      | AggregationOption;

export type SortingOption = LiteralUnion<string>;

export type CustomSortingFn<TData extends RowData>
  = | SortingOption
      | SortingFn<TData>;

export type FilterOption = LiteralUnion<string>;

export type CustomFilterFn<TData extends RowData>
  = | FilterFn<TData>
      | FilterOption;

export type InternalFilterOption = {
    divider: boolean;
    label: string;
    option: string;
    symbol: string;
};

export type DisplayColumnIds
  = | "mrt-row-actions"
      | "mrt-row-drag"
      | "mrt-row-expand"
      | "mrt-row-numbers"
      | "mrt-row-pin"
      | "mrt-row-select"
      | "mrt-row-spacer";

export interface TableOptions<TData extends RowData>
    extends Omit<
        Partial<TanStackTableOptions<TData>>,
        | "columns"
        | "data"
        | "defaultColumn"
        | "enableRowSelection"
        | "expandRowsFn"
        | "getRowId"
        | "globalFilterFn"
        | "initialState"
        | "onStateChange"
        | "state"
    > {
    columnFilterDisplayMode?: "custom" | "popover" | "subheader";
    columnFilterModeOptions?: LiteralUnion<FilterOption & string>[] | null;
    columns: ColumnDef<TData, any>[];
    columnVirtualizerInstanceRef?: RefObject<ColumnVirtualizer | null>;
    columnVirtualizerOptions?:
    | ((props: {
        table: TableInstance<TData>;
    }) => Partial<VirtualizerOptions<HTMLDivElement, HTMLTableCellElement>>)
    | Partial<VirtualizerOptions<HTMLDivElement, HTMLTableCellElement>>;
    createDisplayMode?: "custom" | "modal" | "row";
    data: TData[];
    defaultColumn?: Partial<ColumnDef<TData>>;
    defaultDisplayColumn?: Partial<DisplayColumnDef<TData>>;
    displayColumnDefOptions?: Partial<{
        [key in DisplayColumnIds]: Partial<DisplayColumnDef<TData>>;
    }>;
    editDisplayMode?: "cell" | "custom" | "modal" | "row" | "table";
    enableBatchRowSelection?: boolean;
    enableBottomToolbar?: boolean;
    enableCellActions?: ((cell: Cell<TData>) => boolean) | boolean;
    enableClickToCopy?:
        | "context-menu"
        | ((cell: Cell<TData>) => "context-menu" | boolean)
        | boolean;
    enableColumnActions?: boolean;
    enableColumnDragging?: boolean;
    enableColumnFilterModes?: boolean;
    enableColumnOrdering?: boolean;
    enableColumnVirtualization?: boolean;
    enableDensityToggle?: boolean;
    enableEditing?: ((row: Row<TData>) => boolean) | boolean;
    enableExpandAll?: boolean;
    enableFacetedValues?: boolean;
    enableFilterMatchHighlighting?: boolean;
    enableFullScreenToggle?: boolean;
    enableGlobalFilterModes?: boolean;
    enableGlobalFilterRankedResults?: boolean;
    enableKeyboardShortcuts?: boolean;
    enablePagination?: boolean;
    enableRowActions?: boolean;
    enableRowDragging?: boolean;
    enableRowNumbers?: boolean;
    enableRowOrdering?: boolean;
    enableRowSelection?: ((row: Row<TData>) => boolean) | boolean;
    enableRowVirtualization?: boolean;
    enableSelectAll?: boolean;
    enableStickyFooter?: boolean;
    enableStickyHeader?: boolean;
    enableTableFooter?: boolean;
    enableTableHead?: boolean;
    enableToolbarInternalActions?: boolean;
    enableTopToolbar?: boolean;
    expandRowsFn?: (dataRow: TData) => TData[];
    getRowId?: (
        originalRow: TData,
        index: number,
        parentRow: Row<TData>,
    ) => string;
    globalFilterFn?: FilterOption;
    globalFilterModeOptions?: FilterOption[] | null;
    id?: string;
    initialState?: Partial<TableState<TData>>;
    layoutMode?: "grid" | "grid-no-grow" | "semantic";
    localization?: Partial<Localization>;
    memoMode?: "cells" | "rows" | "table-body";
    onActionCellChange?: OnChangeFn<Cell<TData> | null>;
    onColumnFilterFnsChange?: OnChangeFn<{ [key: string]: FilterOption }>;
    onCreatingRowCancel?: (props: {
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => void;
    onCreatingRowChange?: OnChangeFn<Row<TData> | null>;
    onCreatingRowSave?: (props: {
        exitCreatingMode: () => void;
        row: Row<TData>;
        table: TableInstance<TData>;
        values: Record<LiteralUnion<DeepKeys<TData> & string>, any>;
    }) => Promise<void> | void;
    onDensityChange?: OnChangeFn<DensityState>;
    onDraggingColumnChange?: OnChangeFn<Column<TData> | null>;
    onDraggingRowChange?: OnChangeFn<Row<TData> | null>;
    onEditingCellChange?: OnChangeFn<Cell<TData> | null>;
    onEditingRowCancel?: (props: {
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => void;
    onEditingRowChange?: OnChangeFn<Row<TData> | null>;
    onEditingRowSave?: (props: {
        exitEditingMode: () => void;
        row: Row<TData>;
        table: TableInstance<TData>;
        values: Record<LiteralUnion<DeepKeys<TData> & string>, any>;
    }) => Promise<void> | void;
    onGlobalFilterFnChange?: OnChangeFn<FilterOption>;
    onHoveredColumnChange?: OnChangeFn<Partial<Column<TData>> | null>;
    onHoveredRowChange?: OnChangeFn<Partial<Row<TData>> | null>;
    onIsFullScreenChange?: OnChangeFn<boolean>;
    onShowAlertBannerChange?: OnChangeFn<boolean>;
    onShowColumnFiltersChange?: OnChangeFn<boolean>;
    onShowGlobalFilterChange?: OnChangeFn<boolean>;
    onShowToolbarDropZoneChange?: OnChangeFn<boolean>;
    paginationDisplayMode?: "custom" | "default" | "pages";
    positionActionsColumn?: "first" | "last";
    positionCreatingRow?: "bottom" | "top" | number;
    positionExpandColumn?: "first" | "last";
    positionGlobalFilter?: "left" | "none" | "right";
    positionPagination?: "both" | "bottom" | "none" | "top";
    positionToolbarAlertBanner?: "bottom" | "head-overlay" | "none" | "top";
    positionToolbarDropZone?: "both" | "bottom" | "none" | "top";
    renderBottomToolbar?:
    | ((props: { table: TableInstance<TData> }) => ReactNode)
    | ReactNode;
    renderBottomToolbarCustomActions?: (props: {
        table: TableInstance<TData>;
    }) => ReactNode;
    renderCaption?:
    | ((props: { table: TableInstance<TData> }) => ReactNode)
    | ReactNode;
    renderCellActionMenuItems?: (props: {
        cell: Cell<TData>;
        closeMenu: () => void;
        column: Column<TData>;
        internalMenuItems: ReactNode[];
        row: Row<TData>;
        staticColumnIndex?: number;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode[];
    renderColumnActionsMenuItems?: (props: {
        closeMenu: () => void;
        column: Column<TData>;
        internalColumnMenuItems: ReactNode[];
        table: TableInstance<TData>;
    }) => ReactNode[];
    renderColumnFilterModeMenuItems?: (props: {
        column: Column<TData>;
        internalFilterOptions: InternalFilterOption[];
        onSelectFilterMode: (filterMode: FilterOption) => void;
        table: TableInstance<TData>;
    }) => ReactNode[];
    renderCreateRowDialogContent?: (props: {
        internalEditComponents: ReactNode[];
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => ReactNode;
    renderDetailPanel?: (props: {
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => ReactNode;
    renderEditRowDialogContent?: (props: {
        internalEditComponents: ReactNode[];
        row: Row<TData>;
        table: TableInstance<TData>;
    }) => ReactNode;
    renderEmptyRowsFallback?: (props: {
        table: TableInstance<TData>;
    }) => ReactNode;
    renderGlobalFilterModeMenuItems?: (props: {
        internalFilterOptions: InternalFilterOption[];
        onSelectFilterMode: (filterMode: FilterOption) => void;
        table: TableInstance<TData>;
    }) => ReactNode[];
    renderRowActionMenuItems?: (props: {
        closeMenu: () => void;
        row: Row<TData>;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode[] | undefined;
    renderRowActions?: (props: {
        cell: Cell<TData>;
        row: Row<TData>;
        staticRowIndex?: number;
        table: TableInstance<TData>;
    }) => ReactNode;
    renderToolbarAlertBannerContent?: (props: {
        groupedAlert: ReactNode | null;
        selectedAlert: ReactNode | null;
        table: TableInstance<TData>;
    }) => ReactNode;
    renderToolbarInternalActions?: (props: {
        table: TableInstance<TData>;
    }) => ReactNode;
    renderTopToolbar?:
    | ((props: { table: TableInstance<TData> }) => ReactNode)
    | ReactNode;
    renderTopToolbarCustomActions?: (props: {
        table: TableInstance<TData>;
    }) => ReactNode;
    rowNumberDisplayMode?: "original" | "static";
    rowPinningDisplayMode?:
        | "bottom"
        | "select-bottom"
        | "select-sticky"
        | "select-top"
        | "sticky"
        | "top"
        | "top-and-bottom";
    rowVirtualizerInstanceRef?: RefObject<RowVirtualizer | null>;
    rowVirtualizerOptions?:
    | ((props: {
        table: TableInstance<TData>;
    }) => Partial<VirtualizerOptions<HTMLDivElement, HTMLTableRowElement>>)
    | Partial<VirtualizerOptions<HTMLDivElement, HTMLTableRowElement>>;
    selectAllMode?: "all" | "page";
    state?: Partial<TableState<TData>>;
}

// Re-export types for convenience
export type CellValue = unknown;
