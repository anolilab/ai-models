import clsx from "clsx";
import { GripHorizontal } from "lucide-react";
import type { DragEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { HTMLPropsRef, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    actionIconProps?: HTMLPropsRef<HTMLButtonElement>;
    onDragEnd: DragEventHandler<HTMLButtonElement>;
    onDragStart: DragEventHandler<HTMLButtonElement>;
    table: TableInstance<TData>;
}

export const GrabHandleButton = <TData extends RowData>({
    actionIconProps,
    onDragEnd,
    onDragStart,
    table: {
        options: {
            localization: { move },
        },
    },
}: Props<TData>) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                aria-label={actionIconProps?.title ?? move}
                draggable
                {...actionIconProps}
                className={clsx("ano-grab-handle-button h-8 w-8 cursor-grab p-0 active:cursor-grabbing", actionIconProps?.className)}
                onClick={(e) => {
                    e.stopPropagation();
                    actionIconProps?.onClick?.(e);
                }}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
                title={undefined}
                variant="ghost"
            >
                <GripHorizontal className="h-4 w-4" />
            </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{actionIconProps?.title ?? move}</p>
        </TooltipContent>
    </Tooltip>
);
