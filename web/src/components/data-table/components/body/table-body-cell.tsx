import clsx from "clsx";
import type { CSSProperties, DragEvent, MouseEvent, RefObject } from "react";
import { memo, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { TableCell as ShadcnTableCell } from "@/components/ui/table";

import type { Cell, CellValue, RowData, TableInstance, VirtualItem } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { CopyButton } from "../buttons/copy-button";
import { EditCellTextInput } from "../inputs/edit-cell-text-input";
import TableBodyCellValue from "./table-body-cell-value";

interface Props<TData extends RowData, TValue = CellValue> {
    cell: Cell<TData, TValue>;
    className?: string;
    numRows?: number;
    renderedColumnIndex?: number;
    renderedRowIndex?: number;
    rowRef: RefObject<HTMLTableRowElement>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
    virtualCell?: VirtualItem;
}

export const TableBodyCell = <TData extends RowData>({
    cell,
    className,
    numRows = 1,
    renderedColumnIndex = 0,
    renderedRowIndex = 0,
    rowRef,
    style,
    table,
    virtualCell,
    ...rest
}: Props<TData>) => {
    const {
        getState,
        options: {
            columnResizeDirection,
            columnResizeMode,
            createDisplayMode,
            editDisplayMode,
            enableClickToCopy,
            enableColumnOrdering,
            enableColumnPinning,
            enableEditing,
            enableGrouping,
            layoutMode,
            mantineSkeletonProps,
            mantineTableBodyCellProps,
        },
        refs: { editInputRefs },
        setEditingCell,
        setHoveredColumn,
    } = table;
    const { columnSizingInfo, creatingRow, density, draggingColumn, editingCell, editingRow, hoveredColumn, isLoading, showSkeletons } = getState();
    const { column, row } = cell;
    const { columnDef } = column;
    const { columnDefType } = columnDef;

    const args = {
        cell,
        column,
        renderedColumnIndex,
        renderedRowIndex,
        row,
        table,
    };
    const tableCellProps = {
        ...parseFromValuesOrFunc(mantineTableBodyCellProps, args),
        ...parseFromValuesOrFunc(columnDef.mantineTableBodyCellProps, args),
        ...rest,
    };

    const skeletonProps = parseFromValuesOrFunc(mantineSkeletonProps, args);

    const [skeletonWidth, setSkeletonWidth] = useState(100);

    useEffect(() => {
        if ((!isLoading && !showSkeletons) || skeletonWidth !== 100)
            return;

        const size = column.getSize();

        setSkeletonWidth(columnDefType === "display" ? size / 2 : Math.round(Math.random() * (size - size / 3) + size / 3));
    }, [isLoading, showSkeletons]);

    const widthStyles: CSSProperties = {
        minWidth: `${columnDef.minSize ?? 30}px`,
        width: "auto",
    };

    if (layoutMode === "grid") {
        widthStyles.flex = `${[0, false].includes(columnDef.grow!) ? 0 : 1} 0 auto`;
    } else if (layoutMode === "grid-no-grow") {
        widthStyles.flex = `${+(columnDef.grow || 0)} 0 auto`;
    }

    const isDraggingColumn = draggingColumn?.id === column.id;
    const isHoveredColumn = hoveredColumn?.id === column.id;
    const isColumnPinned = enableColumnPinning && columnDef.columnDefType !== "group" && column.getIsPinned();

    const isEditable = !cell.getIsPlaceholder() && parseFromValuesOrFunc(enableEditing, row) && parseFromValuesOrFunc(columnDef.enableEditing, row) !== false;

    const isEditing = isEditable && (editDisplayMode === "cell" || editDisplayMode === "table") && editingCell?.id === cell.id;

    const isCreating = creatingRow?.id === row.id;

    const cellHoverRevealDivRef = useRef<HTMLDivElement>(null);
    const [isCellContentOverflowing, setIsCellContentOverflowing] = useState(false);

    useEffect(() => {
        if (!columnDef.enableCellHoverReveal || !cellHoverRevealDivRef.current)
            return;

        const { clientWidth, scrollWidth } = cellHoverRevealDivRef.current;

        setIsCellContentOverflowing(scrollWidth > clientWidth);
    }, [cell.getValue(), columnDef.enableCellHoverReveal]);

    const handleDoubleClick = (event: MouseEvent<HTMLTableCellElement>) => {
        if (isEditable && editDisplayMode === "cell") {
            event.stopPropagation();
            setEditingCell(cell);
        }

        tableCellProps?.onDoubleClick?.(event);
    };

    const handleDragEnter = (event: DragEvent<HTMLTableCellElement>) => {
        if (enableColumnOrdering && draggingColumn) {
            setHoveredColumn(column);
        }

        tableCellProps?.onDragEnter?.(event);
    };

    const onMouseEnter = (event: MouseEvent<HTMLTableCellElement>) => {
        tableCellProps?.onMouseEnter?.(event);
    };

    const onMouseLeave = (event: MouseEvent<HTMLTableCellElement>) => {
        tableCellProps?.onMouseLeave?.(event);
    };

    const renderCellContent = () => {
        if (isLoading || showSkeletons) {
            return <Skeleton className="h-4" style={{ width: skeletonWidth }} {...skeletonProps} />;
        }

        if (isEditing) {
            return <EditCellTextInput cell={cell} table={table} />;
        }

        const cellValueProps = {
            cell,
            renderedColumnIndex,
            renderedRowIndex,
            rowRef,
            table,
        };

        if (enableClickToCopy && columnDef.enableClickToCopy !== false) {
            return (
                <CopyButton cell={cell} table={table}>
                    <TableBodyCellValue {...cellValueProps} />
                </CopyButton>
            );
        }

        return <TableBodyCellValue {...cellValueProps} />;
    };

    return (
        <ShadcnTableCell
            data-column-pinned={isColumnPinned || undefined}
            data-dragging-column={isDraggingColumn || undefined}
            data-first-right-pinned={(isColumnPinned === "right" && column.getIsFirstColumn(isColumnPinned)) || undefined}
            data-hovered-column-target={isHoveredColumn || undefined}
            data-index={renderedColumnIndex}
            data-last-left-pinned={(isColumnPinned === "left" && column.getIsLastColumn(isColumnPinned)) || undefined}
            data-last-row={renderedRowIndex === numRows - 1 || undefined}
            data-resizing={(columnResizeMode === "onChange" && columnSizingInfo?.isResizingColumn === column.id && columnResizeDirection) || undefined}
            {...tableCellProps}
            className={clsx(
                "transition-padding relative overflow-hidden bg-clip-padding text-left duration-150 ease-in-out",
                layoutMode?.startsWith("grid") && "flex items-center justify-start",
                virtualCell && "transition-none",
                isEditable && editDisplayMode === "cell" && "cursor-pointer",
                isEditable
                && ["cell", "table"].includes(editDisplayMode ?? "")
                && columnDefType !== "display"
                && "hover:outline hover:outline-gray-300",
                columnDefType === "data" && "text-ellipsis",
                density === "xs" && "whitespace-nowrap",
                columnDef.enableCellHoverReveal && "overflow-visible",
                className,
            )}
            onDoubleClick={handleDoubleClick}
            onDragEnter={handleDragEnter}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                ...widthStyles,
                "--ano-cell-align": tableCellProps.align ?? "left",
                "--ano-table-cell-left": isColumnPinned === "left" ? `${column.getStart(isColumnPinned)}` : undefined,
                "--ano-table-cell-right": isColumnPinned === "right" ? `${column.getAfter(isColumnPinned)}` : undefined,
                ...style,
            }}
        >
            <>
                {tableCellProps.children
                    ?? (columnDef.enableCellHoverReveal
                        ? (
                        <div
                            className={clsx(
                                columnDef.enableCellHoverReveal && !(isCreating || isEditing) && "overflow-hidden text-left text-ellipsis whitespace-nowrap",
                                isCellContentOverflowing
                                && "text-indent-[-1px] absolute top-0 left-0 z-20 flex h-full w-max items-center justify-center overflow-visible border border-blue-500 bg-white p-2 whitespace-normal shadow-sm",
                            )}
                            ref={cellHoverRevealDivRef}
                        >
                            {renderCellContent()}
                            {cell.getIsGrouped() && !columnDef.GroupedCell && <> ({row.subRows?.length})</>}
                        </div>
                        )
                        : (
                        <>
                            {renderCellContent()}
                            {cell.getIsGrouped() && !columnDef.GroupedCell && <> ({row.subRows?.length})</>}
                        </>
                        ))}
            </>
        </ShadcnTableCell>
    );
};

export const Memo_TableBodyCell = memo(TableBodyCell, (prev, next) => next.cell === prev.cell) as typeof TableBodyCell;
