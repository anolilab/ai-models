import { Edit } from "lucide-react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Cell, CellValue, Row, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { RowActionMenu } from "../menus/row-action-menu";
import { EditActionButtons } from "./edit-action-buttons";

interface Props<TData extends RowData, TValue = CellValue> {
    cell: Cell<TData, TValue>;
    row: Row<TData>;
    table: TableInstance<TData>;
}

export const ToggleRowActionMenuButton = <TData extends RowData>({ cell, row, table }: Props<TData>) => {
    const {
        getState,
        options: {
            createDisplayMode,
            editDisplayMode,
            enableEditing,
            localization: { edit },
            renderRowActionMenuItems,
            renderRowActions,
        },
        setEditingRow,
    } = table;

    const { creatingRow, editingRow } = getState();

    const isCreating = creatingRow?.id === row.id;
    const isEditing = editingRow?.id === row.id;

    const handleStartEditMode = (event: MouseEvent) => {
        event.stopPropagation();
        setEditingRow({ ...row });
    };

    const showEditActionButtons = (isCreating && createDisplayMode === "row") || (isEditing && editDisplayMode === "row");

    return (
        <>
            {renderRowActions && !showEditActionButtons
                ? renderRowActions({ cell, row, table })
                : showEditActionButtons
                    ? (
                <EditActionButtons row={row} table={table} />
                    )
                    : !renderRowActionMenuItems && parseFromValuesOrFunc(enableEditing, row)
                        ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button aria-label={edit} disabled={!!editingRow && editingRow.id !== row.id} onClick={handleStartEditMode} size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{edit}</p>
                    </TooltipContent>
                </Tooltip>
                        )
                        : renderRowActionMenuItems
                            ? (
                <RowActionMenu handleEdit={handleStartEditMode} row={row} table={table} />
                            )
                            : null}
        </>
    );
};
