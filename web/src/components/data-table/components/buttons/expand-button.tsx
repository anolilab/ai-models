import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Row, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { EditCellTextInput } from "../inputs/edit-cell-text-input";

interface Props<TData extends RowData> {
    className?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    row: Row<TData>;
    table: TableInstance<TData>;
}

export const ExpandButton = <TData extends RowData>({ className, disabled, onClick, row, table, ...rest }: Props<TData>) => {
    const {
        options: { localization, mantineExpandButtonProps, positionExpandColumn, renderDetailPanel },
    } = table;

    const actionIconProps = {
        ...parseFromValuesOrFunc(mantineExpandButtonProps, {
            row,
            table,
        }),
        ...rest,
    };

    const internalEditComponents = row
        .getAllCells()
        .filter((cell) => cell.column.columnDef.columnDefType === "data")
        .map((cell) => <EditCellTextInput cell={cell} key={cell.id} table={table} />);

    const canExpand = row.getCanExpand();
    const isExpanded = row.getIsExpanded();

    const DetailPanel = !!renderDetailPanel?.({
        internalEditComponents,
        row,
        table,
    });

    const handleToggleExpand = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        row.toggleExpanded();
        onClick?.(event);
        actionIconProps?.onClick?.(event);
    };

    const rtl = positionExpandColumn === "last";

    const isDisabled = disabled || (!canExpand && !DetailPanel);
    const tooltipText = actionIconProps?.title ?? (isExpanded ? localization.collapse : localization.expand);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label={localization.expand}
                    disabled={isDisabled}
                    size="sm"
                    variant="ghost"
                    {...actionIconProps}
                    className={clsx(
                        "ano-expand-button opacity-80 hover:opacity-100 disabled:border-none disabled:bg-transparent disabled:opacity-30",
                        rtl ? "mr-[calc(calc(var(--ano-row-depth,0))*16px)]" : "ml-[calc(calc(var(--ano-row-depth,0))*16px)]",
                        className,
                    )}
                    onClick={handleToggleExpand}
                    style={{
                        "--ano-row-depth": `${row.depth}`,
                    }}
                >
                    {actionIconProps?.children ?? (
                        <ChevronDown
                            className={clsx(
                                "ano-expand-button-chevron transition-transform duration-200",
                                !canExpand && !renderDetailPanel
                                    ? rtl
                                        ? "-rotate-[270deg]"
                                        : "rotate-[270deg]"
                                    : isExpanded
                                        ? rtl
                                            ? "rotate-180"
                                            : "-rotate-180"
                                        : undefined,
                            )}
                        />
                    )}
                </Button>
            </TooltipTrigger>
            {!isDisabled && (
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            )}
        </Tooltip>
    );
};
