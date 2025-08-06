import clsx from "clsx";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenuContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import type { Column, RowData, TableInstance } from "../../types";
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
        options: { enableColumnOrdering, enableColumnPinning, enableHiding, localization },
    } = table;
    const { columnOrder, columnPinning } = getState();

    const handleToggleAllColumns = (value?: boolean) => {
        getAllLeafColumns()
            .filter((col) => col.columnDef.enableHiding !== false)
            .forEach((col) => col.toggleVisibility(value));
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
                        {localization.hideAll}
                    </Button>
                )}
                {enableColumnOrdering && (
                    <Button onClick={() => table.setColumnOrder(getDefaultColumnOrderIds(table.options as any, true))} variant="ghost">
                        {localization.resetOrder}
                    </Button>
                )}
                {enableColumnPinning && (
                    <Button disabled={!getIsSomeColumnsPinned()} onClick={() => table.resetColumnPinning(true)} variant="ghost">
                        {localization.unpinAll}
                    </Button>
                )}
                {enableHiding && (
                    <Button disabled={getIsAllColumnsVisible()} onClick={() => handleToggleAllColumns(true)} variant="ghost">
                        {localization.showAll}
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
