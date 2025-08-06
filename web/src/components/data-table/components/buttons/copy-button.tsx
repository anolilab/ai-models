import clsx from "clsx";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Cell, CellValue, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData, TValue = CellValue> {
    cell: Cell<TData, TValue>;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    table: TableInstance<TData>;
}

export const CopyButton = <TData extends RowData>({ cell, children, className, onClick, table, ...rest }: Props<TData>) => {
    const [copied, setCopied] = useState(false);

    const {
        options: {
            localization: { clickToCopy, copiedToClipboard },
            mantineCopyButtonProps,
        },
    } = table;
    const { column, row } = cell;
    const { columnDef } = column;

    const arg = { cell, column, row, table };
    const buttonProps = {
        ...parseFromValuesOrFunc(mantineCopyButtonProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineCopyButtonProps, arg),
        ...rest,
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(cell.getValue<string>());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    };

    const tooltipText = buttonProps?.title ?? (copied ? copiedToClipboard : clickToCopy);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    {...buttonProps}
                    className={clsx(
                        "ano-copy-button font-inherit font-inherit font-weight-inherit justify-inherit letter-spacing-inherit min-w-unset text-transform-inherit -m-1 cursor-copy rounded border-none bg-transparent p-1 text-inherit hover:bg-blue-50 active:translate-y-px",
                        className,
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                        onClick?.();
                    }}
                    role="presentation"
                    size="sm"
                    variant="ghost"
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};
