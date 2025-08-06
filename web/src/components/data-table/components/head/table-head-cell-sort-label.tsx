import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Header, RowData, TableInstance } from "../../types";
import { dataVariable } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHeadCellSortLabel = <TData extends RowData>({ className, header, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { localization },
    } = table;
    const { column } = header;
    const { columnDef } = column;
    const { sorting } = getState();
    const sorted = column.getIsSorted();
    const sortIndex = column.getSortIndex();

    const sortTooltip = sorted
        ? sorted === "desc"
            ? localization.sortedByColumnDesc.replace("{column}", columnDef.header)
            : localization.sortedByColumnAsc.replace("{column}", columnDef.header)
        : column.getNextSortingOrder() === "desc"
            ? localization.sortByColumnDesc.replace("{column}", columnDef.header)
            : localization.sortByColumnAsc.replace("{column}", columnDef.header);

    const SortActionButton = (
        <Button
            aria-label={sortTooltip}
            className={clsx(
                "ano-table-head-sort-button ml-0.5 h-6 w-6 p-0 text-gray-600 transition-all duration-150 ease-in-out hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                sorted && "text-blue-600 dark:text-blue-400",
                className,
            )}
            style={style}
            variant="ghost"
            {...dataVariable("sorted", sorted)}
            {...rest}
        >
            {sorted === "desc" ? <ArrowDown className="h-4 w-4" /> : sorted === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
        </Button>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {sorting.length < 2 || sortIndex === -1
                    ? SortActionButton
                    : (
                    <div className="relative">
                        {SortActionButton}
                        <div
                            className={clsx(
                                "ano-table-head-multi-sort-indicator absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white",
                            )}
                        >
                            {sortIndex + 1}
                        </div>
                    </div>
                    )}
            </TooltipTrigger>
            <TooltipContent>
                <p>{sortTooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
};
