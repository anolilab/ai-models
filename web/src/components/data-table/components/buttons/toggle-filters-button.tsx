import { FilterX, FunnelX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ComponentPropsWithoutRef } from "react";
import type { RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> extends ComponentPropsWithoutRef<"button"> {
    className?: string;
    table: TableInstance<TData>;
    title?: string;
}

export const ToggleFiltersButton = <TData extends RowData>({
    className,
    table: {
        getState,
        options: { localization },
        setShowColumnFilters,
    },
    title,
    ...rest
}: Props<TData>) => {
    const { showColumnFilters } = getState();

    const tooltipText = title ?? localization?.showHideFilters ?? "Show/Hide Filters";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label={tooltipText}
                    className={className}
                    onClick={() => setShowColumnFilters((current) => !current)}
                    size="sm"
                    variant="ghost"
                    {...rest}
                >
                    {showColumnFilters ? <FunnelX className="h-4 w-4" /> : <FilterX className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};
