import clsx from "clsx";
import { Edit, MoreHorizontal } from "lucide-react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Row, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    handleEdit: (event: MouseEvent) => void;
    row: Row<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const RowActionMenu = <TData extends RowData>({ className, handleEdit, row, style, table, ...rest }: Props<TData>) => {
    const {
        options: { editDisplayMode, enableEditing, localization, positionActionsColumn, renderRowActionMenuItems },
    } = table;

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            aria-label={localization.rowActions}
                            className={clsx("h-8 w-8 p-0", className)}
                            onClick={(event) => event.stopPropagation()}
                            style={style}
                            variant="ghost"
                            {...rest}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{localization.rowActions}</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
                align={positionActionsColumn === "first" ? "start" : positionActionsColumn === "last" ? "end" : "center"}
                onClick={(event) => event.stopPropagation()}
            >
                {enableEditing && editDisplayMode !== "table" && (
                    <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        {localization.edit}
                    </DropdownMenuItem>
                )}
                {renderRowActionMenuItems?.({
                    row,
                    table,
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
