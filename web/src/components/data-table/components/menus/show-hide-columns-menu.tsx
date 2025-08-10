import clsx from "clsx";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenuContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import type { Column, RowData, TableInstance, VisibilityState } from "../../types";
import { getDefaultColumnOrderIds } from "../../utils/display-column-utils";
import { ShowHideColumnsMenuItems } from "./show-hide-columns-menu-items";

interface Props<TData extends RowData> {
    table: TableInstance<TData>;
}

export const ShowHideColumnsMenu = <TData extends RowData>({ table }: Props<TData>) => {
    const {
        getAllColumns,
        getAllLeafColumns,
        getCenterLeafColumns,
        getIsAllColumnsVisible,
        getIsSomeColumnsPinned,
        getIsSomeColumnsVisible,
        getLeftLeafColumns,
        getRightLeafColumns,
        getState,
        options: { enableColumnOrdering, enableColumnPinning, enableColumnUnpinAll, enableColumnResetPins, enableHiding, localization },
    } = table;
    const { columnOrder, columnPinning } = getState();

    const handleToggleAllColumns = (value?: boolean) => {
        const updates =
          getAllLeafColumns()
            .filter((column) => column.columnDef.enableHiding !== false)
            .reduce((acc, column) => {
              acc[column.id] = value ?? !column.getIsVisible()
              return acc;
            }, {} as VisibilityState);
    
        table.setColumnVisibility((old) => ({ ...old, ...updates }));
      };

    const allColumns = useMemo(() => {
        const columns = getAllColumns();

        if (columnOrder.length > 0 && !columns.some((col) => col.columnDef.columnDefType === "group")) {
            return [
                ...getLeftLeafColumns(),
                ...Array.from(new Set(columnOrder)).map((colId) => getCenterLeafColumns().find((col) => col?.id === colId)),
                ...getRightLeafColumns(),
            ].filter(Boolean);
        }

        return columns;
    }, [columnOrder, columnPinning, getAllColumns(), getCenterLeafColumns(), getLeftLeafColumns(), getRightLeafColumns()]) as Column<TData>[];

    const [hoveredColumn, setHoveredColumn] = useState<Column<TData> | null>(null);

    return (
        <DropdownMenuContent className={clsx("ano-show-hide-columns-menu max-h-[calc(80vh-100px)] overflow-y-auto")}>
            <div className="justify-between gap-2 pt-1 pb-1">
                {enableHiding && (
                    <Button disabled={!getIsSomeColumnsVisible()} onClick={() => handleToggleAllColumns(false)} variant="ghost">
                        {localization?.hideAll ?? "Hide all"}
                    </Button>
                )}
                {enableColumnOrdering && (
                    <Button onClick={() => table.setColumnOrder(getDefaultColumnOrderIds(table.options as any, true))} variant="ghost">
                        {localization?.resetOrder ?? "Reset order"}
                    </Button>
                )}
                {enableColumnPinning && enableColumnUnpinAll && (
                    <Button disabled={!getIsSomeColumnsPinned()} onClick={() => table.resetColumnPinning(true)} variant="ghost">
                        {localization?.unpinAll ?? "Unpin all"}
                    </Button>
                )}
                {enableColumnPinning && enableColumnResetPins && (
                    <Button
                        onClick={() => table.resetColumnPinning()}
                    >
                        {localization?.resetPins ?? "Reset pins"}
                    </Button>
                    )}
                {enableHiding && (
                    <Button disabled={getIsAllColumnsVisible()} onClick={() => handleToggleAllColumns(true)} variant="ghost">
                        {localization?.showAll ?? "Show all"}
                    </Button>
                )}
            </div>
            <DropdownMenuSeparator />
            {allColumns.map((column, index) => (
                <ShowHideColumnsMenuItems
                    allColumns={allColumns}
                    column={column}
                    hoveredColumn={hoveredColumn}
                    key={`${index}-${column.id}`}
                    setHoveredColumn={setHoveredColumn}
                    table={table}
                />
            ))}
        </DropdownMenuContent>
    );
};
