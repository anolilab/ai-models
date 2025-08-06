import type { Dispatch, DragEvent, SetStateAction } from "react";
import { useRef, useState } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { CellValue, Column, RowData, TableInstance } from "../../types";
import { reorderColumn } from "../../utils/column-utils";
import { dataVariable } from "../../utils/utils";
import { ColumnPinningButtons } from "../buttons/column-pinning-buttons";
import { GrabHandleButton } from "../buttons/grab-handle-button";

interface Props<TData extends RowData, TValue = CellValue> {
    allColumns: Column<TData>[];
    column: Column<TData, TValue>;
    hoveredColumn: Column<TData> | null;
    setHoveredColumn: Dispatch<SetStateAction<Column<TData> | null>>;
    table: TableInstance<TData>;
}

export const ShowHideColumnsMenuItems = <TData extends RowData>({ allColumns, column, hoveredColumn, setHoveredColumn, table }: Props<TData>) => {
    const {
        getState,
        options: { enableColumnOrdering, enableColumnPinning, enableHiding, localization },
        setColumnOrder,
    } = table;
    const { columnOrder } = getState();
    const { columnDef } = column;
    const { columnDefType } = columnDef;

    const switchChecked
        = (columnDefType !== "group" && column.getIsVisible()) || (columnDefType === "group" && column.getLeafColumns().some((col) => col.getIsVisible()));

    const handleToggleColumnHidden = (column: Column<TData>) => {
        if (columnDefType === "group") {
            column?.columns?.forEach?.((childColumn: Column<TData>) => {
                childColumn.toggleVisibility(!switchChecked);
            });
        } else {
            column.toggleVisibility();
        }
    };

    const menuItemRef = useRef<HTMLElement>(null);

    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
        setIsDragging(true);
        e.dataTransfer.setDragImage(menuItemRef.current as HTMLElement, 0, 0);
    };

    const handleDragEnd = (_e: DragEvent<HTMLButtonElement>) => {
        setIsDragging(false);
        setHoveredColumn(null);

        if (hoveredColumn) {
            setColumnOrder(reorderColumn(column, hoveredColumn, columnOrder));
        }
    };

    const handleDragEnter = (_e: DragEvent) => {
        if (!isDragging && columnDef.enableColumnOrdering !== false) {
            setHoveredColumn(column);
        }
    };

    if (!columnDef.header || columnDef.visibleInShowHideMenu === false) {
        return null;
    }

    return (
        <>
            <DropdownMenuItem
                className="flex cursor-default items-center justify-start pt-1.5 pb-1.5 pl-[calc(var(--_column-depth))] opacity-100 outline-none data-[dragging=true]:opacity-50 data-[dragging=true]:outline data-[dragging=true]:outline-1 data-[dragging=true]:outline-gray-700 data-[dragging=true]:outline-dashed data-[order-hovered=true]:data-[dragging=false]:outline-2 data-[order-hovered=true]:data-[dragging=false]:outline-blue-500 data-[order-hovered=true]:data-[dragging=false]:outline-dashed"
                onDragEnter={handleDragEnter}
                ref={menuItemRef as any}
                style={{
                    "--_column-depth": `${(column.depth + 0.5) * 2}rem`,
                }}
                {...dataVariable("dragging", isDragging)}
                {...dataVariable("order-hovered", hoveredColumn?.id === column.id)}
            >
                <div className="flex flex-nowrap items-center gap-2">
                    {columnDefType !== "group"
                        && enableColumnOrdering
                        && !allColumns.some((col) => col.columnDef.columnDefType === "group")
                        && (columnDef.enableColumnOrdering !== false
                            ? (
                            <GrabHandleButton onDragEnd={handleDragEnd} onDragStart={handleDragStart} table={table} />
                            )
                            : (
                            <div className="w-7" />
                            ))}
                    {enableColumnPinning && (column.getCanPin() ? <ColumnPinningButtons column={column} table={table} /> : <div className="w-[70px]" />)}
                    {enableHiding
                        ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={switchChecked}
                                        className="cursor-pointer"
                                        disabled={!column.getCanHide()}
                                        onCheckedChange={() => handleToggleColumnHidden(column)}
                                    />
                                    <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {columnDef.header}
                                    </label>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{localization.toggleVisibility}</p>
                            </TooltipContent>
                        </Tooltip>
                        )
                        : (
                        <span className="self-center">{columnDef.header}</span>
                        )}
                </div>
            </DropdownMenuItem>
            {column.columns?.map((c: Column<TData>, i) => (
                <ShowHideColumnsMenuItems
                    allColumns={allColumns}
                    column={c}
                    hoveredColumn={hoveredColumn}
                    key={`${i}-${c.id}`}
                    setHoveredColumn={setHoveredColumn}
                    table={table}
                />
            ))}
        </>
    );
};
