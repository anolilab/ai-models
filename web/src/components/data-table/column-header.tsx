import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import type { Column } from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import cn from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

const DataTableColumnHeader = <TData, TValue>({ className, column, title }: DataTableColumnHeaderProps<TData, TValue>) => {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="data-[state=open]:bg-accent -ml-3 h-8" size="sm" variant="ghost">
                        <span>{title}</span>
                        {column.getIsSorted() === "desc"
                            ? (
                            <ArrowDownIcon className="ml-2 h-4 w-4" />
                            )
                            : column.getIsSorted() === "asc"
                                ? (
                            <ArrowUpIcon className="ml-2 h-4 w-4" />
                                )
                                : (
                            <CaretSortIcon className="ml-2 h-4 w-4" />
                                )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                        <ArrowUpIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                        <ArrowDownIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                        Desc
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                        <EyeNoneIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                        Hide
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default DataTableColumnHeader;
