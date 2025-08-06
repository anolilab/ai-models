import type { RowPinningPosition } from "@tanstack/react-table";
import clsx from "clsx";
import { Pin, X } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Row, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    pinningPosition: RowPinningPosition;
    row: Row<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const RowPinButton = <TData extends RowData>({ className, pinningPosition, row, style, table, ...rest }: Props<TData>) => {
    const {
        options: { localization, rowPinningDisplayMode },
    } = table;

    const isPinned = row.getIsPinned();

    const [tooltipOpened, setTooltipOpened] = useState(false);

    const handleTogglePin = (event: MouseEvent<HTMLButtonElement>) => {
        setTooltipOpened(false);
        event.stopPropagation();
        row.pin(isPinned ? false : pinningPosition);
    };

    return (
        <Tooltip onOpenChange={setTooltipOpened} open={tooltipOpened}>
            <TooltipTrigger asChild>
                <Button
                    aria-label={localization.pin}
                    className={clsx("h-6 w-6 p-0", className)}
                    onClick={handleTogglePin}
                    style={{
                        height: "24px",
                        width: "24px",
                        ...style,
                    }}
                    variant="ghost"
                    {...rest}
                >
                    {isPinned
                        ? (
                        <X className="h-3 w-3" />
                        )
                        : (
                        <Pin
                            className="h-3 w-3"
                            style={{
                                transform: `rotate(${rowPinningDisplayMode === "sticky" ? 135 : pinningPosition === "top" ? 180 : 0}deg)`,
                            }}
                        />
                        )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isPinned ? localization.unpin : localization.pin}</p>
            </TooltipContent>
        </Tooltip>
    );
};
