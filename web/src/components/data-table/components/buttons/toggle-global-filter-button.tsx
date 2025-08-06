import { Search, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { HTMLPropsRef, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> extends HTMLPropsRef<HTMLButtonElement> {
    className?: string;
    table: TableInstance<TData>;
    title?: string;
}

export const ToggleGlobalFilterButton = <TData extends RowData>({
    className,
    table: {
        getState,
        options: {
            localization: { showHideSearch },
        },
        refs: { searchInputRef },
        setShowGlobalFilter,
    },
    title,
    ...rest
}: Props<TData>) => {
    const { globalFilter, showGlobalFilter } = getState();

    const handleToggleSearch = () => {
        setShowGlobalFilter(!showGlobalFilter);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const tooltipText = title ?? showHideSearch;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label={tooltipText}
                    className={className}
                    disabled={!!globalFilter}
                    onClick={handleToggleSearch}
                    size="sm"
                    variant="ghost"
                    {...rest}
                >
                    {showGlobalFilter ? <SearchX className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};
