import { createRow, useReactTable } from "@tanstack/react-table";
import { useMemo, useRef, useState } from "react";

import type {
    Cell,
    Column,
    ColumnDef,
    ColumnFilterFnsState,
    ColumnOrderState,
    ColumnSizingInfoState,
    DefinedTableOptions,
    DensityState,
    FilterOption,
    GroupingState,
    PaginationState,
    Row,
    RowData,
    StatefulTableOptions,
    TableInstance,
    TableState,
    Updater,
} from "../types";
import { getAllLeafColumnDefs, getColumnId, getDefaultColumnFilterFn, prepareColumns } from "../utils/column-utils";
import {
    getDefaultColumnOrderIds,
    showRowActionsColumn,
    showRowDragColumn,
    showRowExpandColumn,
    showRowNumbersColumn,
    showRowPinningColumn,
    showRowSelectionColumn,
    showRowSpacerColumn,
} from "../utils/display-column-utils";
import { getRowActionsColumnDef } from "./display-columns/get-row-actions-column-def";
import { getRowDragColumnDef } from "./display-columns/get-row-drag-column-def";
import { getRowExpandColumnDef } from "./display-columns/get-row-expand-column-def";
import { getRowNumbersColumnDef } from "./display-columns/get-row-numbers-column-def";
import { getRowPinningColumnDef } from "./display-columns/get-row-pinning-column-def";
import { getRowSelectColumnDef } from "./display-columns/get-row-select-column-def";
import { getRowSpacerColumnDef } from "./display-columns/get-row-spacer-column-def";
import { useEffects } from "./use-effects";

/**
 * The table hook that wraps the TanStack useReactTable hook and adds additional functionality.
 * @param definedTableOptions table options with proper defaults set
 * @returns the table instance
 */
export default function useTableInstance<TData extends RowData>(definedTableOptions: DefinedTableOptions<TData>): TableInstance<TData> {
    const lastSelectedRowId = useRef<null | string>(null);
    const actionCellRef = useRef<HTMLTableCellElement>(null);
    const bottomToolbarRef = useRef<HTMLDivElement>(null);
    const editInputRefs = useRef<Record<string, HTMLInputElement>>({});
    const filterInputRefs = useRef<Record<string, HTMLInputElement>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const tableHeadCellRefs = useRef<Record<string, HTMLTableCellElement>>({});
    const tablePaperRef = useRef<HTMLDivElement>(null);
    const topToolbarRef = useRef<HTMLDivElement>(null);
    const tableHeadRef = useRef<HTMLTableSectionElement>(null);
    const tableFooterRef = useRef<HTMLTableSectionElement>(null);

    // Transform initial state with proper column order
    const initialState: Partial<TableState> = useMemo(() => {
        const initState = definedTableOptions.initialState ?? {};

        initState.columnOrder
            = initState.columnOrder
                ?? getDefaultColumnOrderIds({
                    ...definedTableOptions,
                    state: {
                        ...definedTableOptions.initialState,
                        ...definedTableOptions.state,
                    },
                } as StatefulTableOptions<TData>);
        initState.globalFilterFn = definedTableOptions.globalFilterFn ?? "fuzzy";

        return initState;
    }, []);

    definedTableOptions.initialState = initialState;

    const [actionCell, setActionCell] = useState<Cell<TData> | null>(initialState.actionCell ?? null);
    const [creatingRow, _setCreatingRow] = useState<Row<TData> | null>(initialState.creatingRow ?? null);
    const [columnFilterFns, setColumnFilterFns] = useState<ColumnFilterFnsState>(() =>
        Object.assign(
            {},
            ...getAllLeafColumnDefs(definedTableOptions.columns as ColumnDef<TData>[]).map((col) => {
                return {
                    [getColumnId(col)]:
                    col.filterFn instanceof Function
                        ? col.filterFn.name ?? "custom"
                        : col.filterFn ?? initialState?.columnFilterFns?.[getColumnId(col)] ?? getDefaultColumnFilterFn(col),
                };
            }),
        ),
    );
    const [columnOrder, onColumnOrderChange] = useState<ColumnOrderState>(initialState.columnOrder ?? []);
    const [columnSizingInfo, onColumnSizingInfoChange] = useState<ColumnSizingInfoState>(initialState.columnSizingInfo ?? ({} as ColumnSizingInfoState));
    const [density, setDensity] = useState<DensityState>(initialState?.density ?? "comfortable");
    const [draggingColumn, setDraggingColumn] = useState<Column<TData> | null>(initialState.draggingColumn ?? null);
    const [draggingRow, setDraggingRow] = useState<Row<TData> | null>(initialState.draggingRow ?? null);
    const [editingCell, setEditingCell] = useState<Cell<TData> | null>(initialState.editingCell ?? null);
    const [editingRow, setEditingRow] = useState<Row<TData> | null>(initialState.editingRow ?? null);
    const [globalFilterFn, setGlobalFilterFn] = useState<FilterOption>(initialState.globalFilterFn ?? "fuzzy");
    const [grouping, onGroupingChange] = useState<GroupingState>(initialState.grouping ?? []);
    const [hoveredColumn, setHoveredColumn] = useState<Partial<Column<TData>> | null>(initialState.hoveredColumn ?? null);
    const [hoveredRow, setHoveredRow] = useState<Partial<Row<TData>> | null>(initialState.hoveredRow ?? null);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(initialState?.isFullScreen ?? false);
    const [pagination, onPaginationChange] = useState<PaginationState>(initialState?.pagination ?? { pageIndex: 0, pageSize: 10 });
    const [showAlertBanner, setShowAlertBanner] = useState<boolean>(initialState?.showAlertBanner ?? false);
    const [showColumnFilters, setShowColumnFilters] = useState<boolean>(initialState?.showColumnFilters ?? false);
    const [showGlobalFilter, setShowGlobalFilter] = useState<boolean>(initialState?.showGlobalFilter ?? false);
    const [showToolbarDropZone, setShowToolbarDropZone] = useState<boolean>(initialState?.showToolbarDropZone ?? false);

    definedTableOptions.state = {
        actionCell,
        columnFilterFns,
        columnOrder,
        columnSizingInfo,
        creatingRow,
        density,
        draggingColumn,
        draggingRow,
        editingCell,
        editingRow,
        globalFilterFn,
        grouping,
        hoveredColumn,
        hoveredRow,
        isFullScreen,
        pagination,
        showAlertBanner,
        showColumnFilters,
        showGlobalFilter,
        showToolbarDropZone,
        ...definedTableOptions.state,
    };

    // The table options now include all state needed to help determine column visibility and order logic
    const statefulTableOptions = definedTableOptions as StatefulTableOptions<TData>;

    // Don't recompute columnDefs while resizing column or dragging column/row
    const columnDefsRef = useRef<ColumnDef<TData>[]>([]);

    statefulTableOptions.columns
        = statefulTableOptions.state.columnSizingInfo.isResizingColumn || statefulTableOptions.state.draggingColumn || statefulTableOptions.state.draggingRow
            ? columnDefsRef.current
            : prepareColumns({
                columnDefs: [
                    ...([
                        showRowPinningColumn(statefulTableOptions) && getRowPinningColumnDef(statefulTableOptions),
                        showRowDragColumn(statefulTableOptions) && getRowDragColumnDef(statefulTableOptions),
                        showRowActionsColumn(statefulTableOptions) && getRowActionsColumnDef(statefulTableOptions),
                        showRowExpandColumn(statefulTableOptions) && getRowExpandColumnDef(statefulTableOptions),
                        showRowSelectionColumn(statefulTableOptions) && getRowSelectColumnDef(statefulTableOptions),
                        showRowNumbersColumn(statefulTableOptions) && getRowNumbersColumnDef(statefulTableOptions),
                    ].filter(Boolean) as ColumnDef<TData>[]),
                    ...statefulTableOptions.columns,
                    ...([showRowSpacerColumn(statefulTableOptions) && getRowSpacerColumnDef(statefulTableOptions)].filter(Boolean) as ColumnDef<TData>[]),
                ],
                tableOptions: statefulTableOptions,
            });
    columnDefsRef.current = statefulTableOptions.columns;

    // If loading, generate blank rows to show skeleton loaders
    statefulTableOptions.data = useMemo(
        () =>
            ((statefulTableOptions.state.isLoading || statefulTableOptions.state.showSkeletons) && !statefulTableOptions.data.length
                ? [...Array(Math.min(statefulTableOptions.state.pagination.pageSize, 20)).fill(null)].map(() =>
                    Object.assign(
                        {},
                        ...getAllLeafColumnDefs(statefulTableOptions.columns).map((col) => {
                            return {
                                [getColumnId(col)]: null,
                            };
                        }),
                    ),
                )
                : statefulTableOptions.data),
        [statefulTableOptions.data, statefulTableOptions.state.isLoading, statefulTableOptions.state.showSkeletons],
    );

    // @ts-expect-error - TanStack table types don't match our extended types
    const table = useReactTable({
        onColumnOrderChange,
        onColumnSizingInfoChange,
        onGroupingChange,
        onPaginationChange,
        ...statefulTableOptions,
        globalFilterFn: statefulTableOptions.filterFns?.[globalFilterFn ?? "fuzzy"],
    }) as TableInstance<TData>;

    table.refs = {
        actionCellRef,
        bottomToolbarRef,
        editInputRefs,
        filterInputRefs,
        lastSelectedRowId,
        searchInputRef,
        tableContainerRef,
        tableFooterRef,
        tableHeadCellRefs,
        tableHeadRef,
        tablePaperRef,
        topToolbarRef,
    };

    table.setActionCell = statefulTableOptions.onActionCellChange ?? setActionCell;
    table.setCreatingRow = (row: Updater<Row<TData> | null | true>) => {
        let _row = row;

        if (row === true) {
            _row = createRow(table);
        }

        statefulTableOptions?.onCreatingRowChange?.(_row as Row<TData> | null) ?? _setCreatingRow(_row as Row<TData> | null);
    };
    table.setColumnFilterFns = statefulTableOptions.onColumnFilterFnsChange ?? setColumnFilterFns;
    table.setDensity = statefulTableOptions.onDensityChange ?? setDensity;
    table.setDraggingColumn = statefulTableOptions.onDraggingColumnChange ?? setDraggingColumn;
    table.setDraggingRow = statefulTableOptions.onDraggingRowChange ?? setDraggingRow;
    table.setEditingCell = statefulTableOptions.onEditingCellChange ?? setEditingCell;
    table.setEditingRow = statefulTableOptions.onEditingRowChange ?? setEditingRow;
    table.setGlobalFilterFn = statefulTableOptions.onGlobalFilterFnChange ?? setGlobalFilterFn;
    table.setHoveredColumn = statefulTableOptions.onHoveredColumnChange ?? setHoveredColumn;
    table.setHoveredRow = statefulTableOptions.onHoveredRowChange ?? setHoveredRow;
    table.setIsFullScreen = statefulTableOptions.onIsFullScreenChange ?? setIsFullScreen;
    table.setShowAlertBanner = statefulTableOptions.onShowAlertBannerChange ?? setShowAlertBanner;
    table.setShowColumnFilters = statefulTableOptions.onShowColumnFiltersChange ?? setShowColumnFilters;
    table.setShowGlobalFilter = statefulTableOptions.onShowGlobalFilterChange ?? setShowGlobalFilter;
    table.setShowToolbarDropZone = statefulTableOptions.onShowToolbarDropZoneChange ?? setShowToolbarDropZone;

    useEffects(table);

    return table;
}
