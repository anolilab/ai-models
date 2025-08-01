import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import type { Column } from "@tanstack/react-table";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn("font-medium uppercase", className)}>{title}</div>;
    }

    // Get the current sort direction for this column
    const currentDirection = column.getIsSorted();

    const [open, setOpen] = useState(false);

    // Handle sorting with proper TanStack Table API
    const handleSort = (direction: "asc" | "desc" | false) => {
        if (direction === false) {
            // Clear sorting
            column.clearSorting();
        } else {
            // Clear any existing sorting first, then set the new sort
            column.toggleSorting(direction === "desc", true);
        }

        // Close the dropdown after sorting
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("data-[state=open]:bg-accent font-mono-id h-8 focus-visible:ring-0 focus-visible:ring-offset-0", className)}
                >
                    <span className="font-medium uppercase">{title}</span>
                    {currentDirection === "desc" ? (
                        <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ) : currentDirection === "asc" ? (
                        <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleSort("asc")}>
                    <ArrowUpIcon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                    Asc
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("desc")}>
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
    );
}
