import clsx from "clsx";
import { ChevronDown, Eye, EyeOff, Filter, FilterX, MoreHorizontal, Pin, PinOff, RotateCcw, SortAsc, SortDesc, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Header, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    table: TableInstance<TData>;
}

export const ColumnActionMenu = <TData extends RowData>({ className, header, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: {
            columnFilterDisplayMode,
            enableColumnFilters,
            enableColumnPinning,
            enableColumnResizing,
            enableGrouping,
            enableHiding,
            enableSorting,
            enableSortingRemoval,
            localization,
            renderColumnActionsMenuItems,
        },
        refs: { filterInputRefs },
        setColumnOrder,
        setColumnSizingInfo,
        setShowColumnFilters,
        toggleAllColumnsVisible,
    } = table;
    const { column } = header;
    const { columnDef } = column;
    const { columnSizing, columnVisibility } = getState();

    const arg = { column, table } as const;
    const actionIconProps = {
        ...(parseFromValuesOrFunc((columnDef as any).columnActionsButtonProps, arg) ?? {}),
    } as Record<string, any>;

    const handleClearSort = () => {
        column.clearSorting();
    };

    const handleSortAsc = () => {
        column.toggleSorting(false);
    };

    const handleSortDesc = () => {
        column.toggleSorting(true);
    };

    const handleResetColumnSize = () => {
        setColumnSizingInfo((old) => {
            return { ...old, isResizingColumn: false };
        });
        column.resetSize();
    };

    const handleHideColumn = () => {
        column.toggleVisibility(false);
    };

    const handlePinColumn = (pinDirection: "left" | "right" | false) => {
        column.pin(pinDirection);
    };

    const handleGroupByColumn = () => {
        column.toggleGrouping();
        setColumnOrder((old: any) => ["ano-row-expand", ...old]);
    };

    const handleClearFilter = () => {
        column.setFilterValue("");
    };

    const handleFilterByColumn = () => {
        setShowColumnFilters(true);
        setTimeout(() => filterInputRefs?.current?.[`${column.id}-0`]?.focus(), 100);
    };

    const handleShowAllColumns = () => {
        toggleAllColumnsVisible(true);
    };

    const internalColumnMenuItems = (
        <>
            {enableSorting && column.getCanSort() && (
                <>
                    {enableSortingRemoval !== false && (
                        <DropdownMenuItem disabled={!column.getIsSorted()} onClick={handleClearSort}>
                            <X className="mr-2 h-4 w-4" />
                    {localization?.clearSort ?? "Clear sort"}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem disabled={column.getIsSorted() === "asc"} onClick={handleSortAsc}>
                        <SortAsc className="mr-2 h-4 w-4" />
                        {localization?.sortByColumnAsc?.replace("{column}", String(columnDef.header)) ?? "Sort asc"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={column.getIsSorted() === "desc"} onClick={handleSortDesc}>
                        <SortDesc className="mr-2 h-4 w-4" />
                        {localization?.sortByColumnDesc?.replace("{column}", String(columnDef.header)) ?? "Sort desc"}
                    </DropdownMenuItem>
                    {(enableColumnFilters || enableGrouping || enableHiding) && <DropdownMenuSeparator />}
                </>
            )}
            {enableColumnFilters && columnFilterDisplayMode !== "popover" && column.getCanFilter() && (
                <>
                    <DropdownMenuItem disabled={!column.getFilterValue()} onClick={handleClearFilter}>
                        <FilterX className="mr-2 h-4 w-4" />
                        {localization?.clearFilter ?? "Clear filter"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFilterByColumn}>
                        <Filter className="mr-2 h-4 w-4" />
                        {localization?.filterByColumn?.replace("{column}", String(columnDef.header)) ?? "Filter by column"}
                    </DropdownMenuItem>
                    {(enableGrouping || enableHiding) && <DropdownMenuSeparator />}
                </>
            )}
            {enableGrouping && column.getCanGroup() && (
                <>
                    <DropdownMenuItem onClick={handleGroupByColumn}>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        {(localization?.[column.getIsGrouped() ? "ungroupByColumn" : "groupByColumn"] as string | undefined)?.replace("{column}", String(columnDef.header)) ?? "Group"}
                    </DropdownMenuItem>
                    {enableColumnPinning && <DropdownMenuSeparator />}
                </>
            )}
            {enableColumnPinning && column.getCanPin() && (
                <>
                    <DropdownMenuItem disabled={column.getIsPinned() === "left" || !column.getCanPin()} onClick={() => handlePinColumn("left")}>
                        <Pin className="mr-2 h-4 w-4 rotate-90" />
                        {localization?.pinToLeft ?? "Pin left"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={column.getIsPinned() === "right" || !column.getCanPin()} onClick={() => handlePinColumn("right")}>
                        <Pin className="mr-2 h-4 w-4 -rotate-90" />
                        {localization?.pinToRight ?? "Pin right"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!column.getIsPinned()} onClick={() => handlePinColumn(false)}>
                        <PinOff className="mr-2 h-4 w-4" />
                        {localization?.unpin ?? "Unpin"}
                    </DropdownMenuItem>
                    {enableHiding && <DropdownMenuSeparator />}
                </>
            )}
            {enableColumnResizing && column.getCanResize() && (
                <DropdownMenuItem disabled={!columnSizing[column.id]} onClick={handleResetColumnSize}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {localization?.resetColumnSize ?? "Reset size"}
                </DropdownMenuItem>
            )}
            {enableHiding && (
                <>
                    <DropdownMenuItem disabled={!column.getCanHide()} onClick={handleHideColumn}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        {localization?.hideColumn?.replace("{column}", String(columnDef.header)) ?? "Hide column"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!Object.values(columnVisibility).filter((visible) => !visible).length} onClick={handleShowAllColumns}>
                        <Eye className="mr-2 h-4 w-4" />
                        {localization?.showAllColumns?.replace("{column}", String(columnDef.header)) ?? "Show all columns"}
                    </DropdownMenuItem>
                </>
            )}
        </>
    );

    const tooltipText = (actionIconProps as any)?.title ?? localization?.columnActions ?? "Column actions";

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button aria-label={localization?.columnActions ?? "Column actions"} className={clsx(className)} size="sm" variant="ghost" {...(actionIconProps as any)} {...rest}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
                {columnDef.renderColumnActionsMenuItems?.({
                    closeMenu: () => {},
                    column,
                    internalColumnMenuItems: [internalColumnMenuItems],
                    table,
                })
                ?? renderColumnActionsMenuItems?.({
                    closeMenu: () => {},
                    column,
                    internalColumnMenuItems: [internalColumnMenuItems],
                    table,
                })
                ?? internalColumnMenuItems}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
