import clsx from "clsx";
import type { CSSProperties, DragEventHandler, MutableRefObject } from "react";
import { useMemo, useState } from "react";

import { TableHead as ShadcnTableHead } from "@/components/ui/table";

import type { ColumnVirtualizer, Header, RowData, TableInstance } from "../../types";
// parseCSSVarId removed - no longer needed with Tailwind CSS
import { parseFromValuesOrFunc } from "../../utils/utils";
import { ColumnActionMenu } from "../menus/column-action-menu";
import { TableHeadCellFilterContainer } from "./table-head-cell-filter-container";
import { TableHeadCellFilterLabel } from "./table-head-cell-filter-label";
import { TableHeadCellGrabHandle } from "./table-head-cell-grab-handle";
import { TableHeadCellResizeHandle } from "./table-head-cell-resize-handle";
import { TableHeadCellSortLabel } from "./table-head-cell-sort-label";

interface Props<TData extends RowData> {
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    header: Header<TData>;
    renderedHeaderIndex?: number;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHeadCell = <TData extends RowData>({
    className,
    columnVirtualizer,
    header,
    renderedHeaderIndex = 0,
    style,
    table,
    ...rest
}: Props<TData>) => {
    const {
        getState,
        options,
        refs,
        setHoveredColumn,
    } = table;
    
    // Handle missing properties with defaults
    const {
        columnFilterDisplayMode = 'subheader',
        columnResizeDirection = 'ltr',
        columnResizeMode = 'onChange',
        enableColumnActions = false,
        enableColumnDragging = false,
        enableColumnOrdering = false,
        enableColumnPinning = false,
        enableGrouping = false,
        enableHeaderActionsHoverReveal = false,
        enableMultiSort = false,
        layoutMode = 'table',
        mantineTableHeadCellProps = {},
    } = (options as any) || {};
    
    const { tableHeadCellRefs } = refs || {};
    
    // Handle missing getState method
    const state = getState ? getState() : { columnSizingInfo: {}, draggingColumn: null, grouping: [], hoveredColumn: null };
    const { columnSizingInfo = {}, draggingColumn = null, grouping = [], hoveredColumn = null } = (state as any) || {};
    const { column } = header;
    const { columnDef } = column;
    const { columnDefType } = columnDef;

    const arg = { column, table };
    const tableCellProps = {
        ...parseFromValuesOrFunc(mantineTableHeadCellProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineTableHeadCellProps, arg),
        ...rest,
    };

    const widthStyles: CSSProperties = {
        minWidth: `${columnDef.minSize ?? 30}px`,
        width: "auto",
    };

    if (layoutMode === "grid") {
        widthStyles.flex = `${[0, false].includes(columnDef.grow!) ? 0 : 1} 0 auto`;
    } else if (layoutMode === "grid-no-grow") {
        widthStyles.flex = `${+(columnDef.grow || 0)} 0 auto`;
    }

    const isColumnPinned = enableColumnPinning && columnDef.columnDefType !== "group" && column.getIsPinned();

    const isDraggingColumn = draggingColumn?.id === column.id;
    const isHoveredColumn = hoveredColumn?.id === column.id;

    const [isHoveredHeadCell, setIsHoveredHeadCell] = useState(false);

    const columnActionsEnabled = (enableColumnActions || columnDef.enableColumnActions) && columnDef.enableColumnActions !== false;

    const showColumnButtons = !enableHeaderActionsHoverReveal || (isHoveredHeadCell && !table.getVisibleFlatColumns().find((column) => column.getIsResizing()));

    const showDragHandle
        = enableColumnDragging !== false
            && columnDef.enableColumnDragging !== false
            && (enableColumnDragging
                || (enableColumnOrdering && columnDef.enableColumnOrdering !== false)
                || (enableGrouping && columnDef.enableGrouping !== false && !grouping.includes(column.id)))
            && showColumnButtons;

    const headerPL = useMemo(() => {
        let pl = 0;

        if (column.getCanSort())
            pl++;

        // Only add padding for buttons if they will actually be displayed
        if (showColumnButtons && (columnActionsEnabled || showDragHandle))
            pl += 1.75;

        if (showDragHandle)
            pl += 1.25;

        return pl;
    }, [showColumnButtons, showDragHandle, columnActionsEnabled]);

    const handleDragEnter: DragEventHandler<HTMLTableCellElement> = (_e) => {
        if (enableGrouping && hoveredColumn?.id === "drop-zone") {
            setHoveredColumn(null);
        }

        if (enableColumnOrdering && draggingColumn && columnDefType !== "group") {
            setHoveredColumn(columnDef.enableColumnOrdering !== false ? column : null);
        }
    };

    const headerElement
        = columnDef.Header?.({
            column,
            header,
            table,
        }) ?? (typeof columnDef.header === "string" ? columnDef.header : null);

    return (
        <ShadcnTableHead
            data-column-pinned={isColumnPinned || undefined}
            data-dragging-column={isDraggingColumn || undefined}
            data-first-right-pinned={(isColumnPinned === "right" && column.getIsFirstColumn(isColumnPinned)) || undefined}
            data-hovered-column-target={isHoveredColumn || undefined}
            data-index={renderedHeaderIndex}
            data-last-left-pinned={(isColumnPinned === "left" && column.getIsLastColumn(isColumnPinned)) || undefined}
            data-resizing={(columnResizeMode === "onChange" && columnSizingInfo?.isResizingColumn === column.id && columnResizeDirection) || undefined}
            {...tableCellProps}
            className={clsx(
                "transition-padding relative z-10 overflow-visible bg-white bg-clip-padding align-top font-bold duration-150 ease-in-out active:z-30 dark:bg-gray-900",
                layoutMode?.startsWith("grid") && "flex flex-col",
                isColumnPinned && "sticky z-40 bg-white opacity-97 dark:bg-gray-900",
                isColumnPinned === "left" && "left-[calc(var(--ano-table-cell-left,0)*1px)]",
                isColumnPinned === "right" && "right-[calc(var(--ano-table-cell-right,0)*1px)]",
                className,
            )}
            onDragEnter={handleDragEnter}
            onMouseEnter={() => setIsHoveredHeadCell(true)}
            onMouseLeave={() => setIsHoveredHeadCell(false)}
            ref={(node: HTMLTableCellElement) => {
                if (node) {
                    tableHeadCellRefs.current[column.id] = node;

                    if (tableCellProps?.ref) {
                        (tableCellProps.ref as MutableRefObject<HTMLTableCellElement>).current = node;
                    }
                }
            }}
            style={{
                ...widthStyles,
                ...style,
            }}
        >
            {header.isPlaceholder
                ? null
                : tableCellProps.children ?? (
                      <div
                          className={clsx(
                              "ano-table-head-cell-content relative flex h-full w-full items-center justify-start",
                              (columnDefType === "group" || tableCellProps?.align === "center") && "justify-center",
                              tableCellProps?.align === "right" && "flex-row-reverse",
                              column.getCanResize() && "justify-between",
                          )}
                      >
                          <div
                              className={clsx(
                                  "ano-table-head-cell-labels flex min-h-[22px] items-center gap-0.5",
                                  column.getCanSort() && columnDefType !== "group" && "cursor-pointer",
                                  tableCellProps?.align === "right"
                                      ? "flex-row-reverse"
                                      : tableCellProps?.align === "center" && "pl-[calc(var(--ano-table-head-cell-labels-padding-left)*1rem)]",
                                  columnDefType === "data" && "overflow-hidden",
                              )}
                              onClick={column.getToggleSortingHandler()}
                              style={{
                                  paddingLeft: `${headerPL}rem`,
                              }}
                          >
                              <div
                                  className={clsx(
                                      "ano-table-head-cell-content-wrapper text-ellipsis",
                                      columnDefType === "data" && "overflow-hidden",
                                      (columnDef.header?.length ?? 0) < 20 && "whitespace-nowrap",
                                  )}
                              >
                                  {headerElement}
                              </div>
                              {column.getCanFilter() && (column.getIsFiltered() || showColumnButtons) && (
                                  <TableHeadCellFilterLabel header={header} table={table} />
                              )}
                              {column.getCanSort() && (column.getIsSorted() || showColumnButtons) && <TableHeadCellSortLabel header={header} table={table} />}
                          </div>
                          {columnDefType !== "group" && (
                              <div className={clsx("ano-table-head-cell-content-actions ml-0.5 flex items-center gap-0.5 self-center whitespace-nowrap")}>
                                  {showDragHandle && (
                                      <TableHeadCellGrabHandle
                                          column={column}
                                          table={table}
                                          tableHeadCellRef={{
                                              current: tableHeadCellRefs.current[column.id],
                                          }}
                                      />
                                  )}
                                  {columnActionsEnabled && showColumnButtons && <ColumnActionMenu header={header} table={table} />}
                              </div>
                          )}
                          {column.getCanResize() && <TableHeadCellResizeHandle header={header} table={table} />}
                      </div>
                )}
            {columnFilterDisplayMode === "subheader" && column.getCanFilter() && <TableHeadCellFilterContainer header={header} table={table} />}
        </ShadcnTableHead>
    );
};
