import clsx from "clsx";
import { Pin, PinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Column, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    column: Column<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const ColumnPinningButtons = <TData extends RowData>({ className, column, style, table }: Props<TData>) => {
    const {
        options: { localization },
    } = table;

    return (
        <div className={clsx("ano-column-pinning-buttons flex min-w-[70px] items-center justify-center gap-1", className)} style={style}>
            {column.getIsPinned()
                ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button className="h-8 w-8 p-0" onClick={() => column.pin(false)} size="sm" variant="ghost">
                            <PinOff className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{localization.unpin}</p>
                    </TooltipContent>
                </Tooltip>
                )
                : (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className="h-8 w-8 p-0" onClick={() => column.pin("left")} size="sm" variant="ghost">
                                <Pin className="h-4 w-4 rotate-90" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{localization.pinToLeft}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className="h-8 w-8 p-0" onClick={() => column.pin("right")} size="sm" variant="ghost">
                                <Pin className="h-4 w-4 -rotate-90" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{localization.pinToRight}</p>
                        </TooltipContent>
                    </Tooltip>
                </>
                )}
        </div>
    );
};
