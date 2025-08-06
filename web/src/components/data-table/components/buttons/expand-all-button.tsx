import clsx from "clsx";
import { ChevronsDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const ExpandAllButton = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        getCanSomeRowsExpand,
        getIsAllRowsExpanded,
        getIsSomeRowsExpanded,
        getState,
        options: { localization, mantineExpandAllButtonProps, renderDetailPanel },
        toggleAllRowsExpanded,
    } = table;
    const { density, isLoading } = getState();

    const actionIconProps = {
        ...parseFromValuesOrFunc(mantineExpandAllButtonProps, {
            table,
        }),
        ...rest,
    };

    const isAllRowsExpanded = getIsAllRowsExpanded();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label={localization.expandAll}
                    className={clsx(
                        "ano-expand-all-button ml-1.5 h-8 w-8 p-0 opacity-80 hover:opacity-100 disabled:border-none disabled:bg-transparent md:ml-0 xl:-ml-1.5",
                        actionIconProps?.className,
                        density,
                        className,
                    )}
                    disabled={isLoading || (!renderDetailPanel && !getCanSomeRowsExpand())}
                    onClick={() => toggleAllRowsExpanded(!isAllRowsExpanded)}
                    style={style}
                    variant="ghost"
                    {...actionIconProps}
                >
                    {actionIconProps?.children ?? (
                        <ChevronsDown
                            className={clsx(
                                "h-4 w-4 transition-transform duration-150",
                                isAllRowsExpanded ? "-rotate-180" : getIsSomeRowsExpanded() ? "-rotate-90" : undefined,
                            )}
                        />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{actionIconProps?.title ?? isAllRowsExpanded ? localization.collapseAll : localization.expandAll}</p>
            </TooltipContent>
        </Tooltip>
    );
};
