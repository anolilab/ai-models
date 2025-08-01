"use client";

import type { Column, Table } from "@tanstack/react-table";
import { Eye, EyeOff, GripVertical, RotateCcw, Settings2 } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import cn from "@/lib/utils";

interface DataTableViewOptionsProps<TData> {
    columnMapping?: Record<string, string>;
    size?: "sm" | "default" | "lg";
    table: Table<TData>;
}

export function DataTableViewOptions<TData>({ columnMapping, size = "default", table }: DataTableViewOptionsProps<TData>) {
    // Get columns that can be hidden
    const columns = React.useMemo(() => table.getAllColumns().filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide()), [table]);

    // State for drag and drop
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
    // State to force re-renders when visibility changes
    const [visibilityUpdateTrigger, setVisibilityUpdateTrigger] = useState(0);
    // State to force re-renders when column order changes
    const [orderUpdateTrigger, setOrderUpdateTrigger] = useState(0);

    // Order columns based on the current table column order
    const { columnOrder } = table.getState();
    const { columnVisibility } = table.getState();

    const orderedColumns = useMemo(() => {
        if (!columnOrder.length) {
            return columns;
        }

        // Create a new array with columns sorted according to the columnOrder
        return [...columns].sort((a, b) => {
            const aIndex = columnOrder.indexOf(a.id);
            const bIndex = columnOrder.indexOf(b.id);

            // If column isn't in the order array, put it at the end
            if (aIndex === -1)
                return 1;

            if (bIndex === -1)
                return -1;

            return aIndex - bIndex;
        });
    }, [columns, columnOrder]);

    // Memo for columns with visibility state to force re-renders
    const columnsWithVisibility = useMemo(
        () =>
            orderedColumns.map((column) => {
                return {
                    ...column,
                    isVisible: column.getIsVisible(),
                };
            }),
        [orderedColumns, columnVisibility, visibilityUpdateTrigger, orderUpdateTrigger],
    );

    // Handle column visibility toggle
    const handleColumnVisibilityToggle = useCallback(
        (columnId: string) => {
            const currentVisibility = table.getState().columnVisibility;
            const isCurrentlyVisible = currentVisibility[columnId] !== false;

            table.setColumnVisibility({
                ...currentVisibility,
                [columnId]: !isCurrentlyVisible,
            });

            // Force re-render by updating the trigger
            setVisibilityUpdateTrigger((prev) => prev + 1);
        },
        [table],
    );

    // Handle drag start
    const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
        setDraggedColumnId(columnId);
        e.dataTransfer.effectAllowed = "move";

        // This helps with dragging visuals
        if (e.dataTransfer.setDragImage && e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
        }
    }, []);

    // Handle drag over
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    // Handle drop
    const handleDrop = useCallback(
        (e: React.DragEvent, targetColumnId: string) => {
            e.preventDefault();

            if (!draggedColumnId || draggedColumnId === targetColumnId)
                return;

            // Get current column order
            const currentOrder = table.getState().columnOrder.length > 0 ? [...table.getState().columnOrder] : table.getAllLeafColumns().map((d) => d.id);

            // Find indices
            const draggedIndex = currentOrder.indexOf(draggedColumnId);
            const targetIndex = currentOrder.indexOf(targetColumnId);

            if (draggedIndex === -1 || targetIndex === -1)
                return;

            // Create new order by moving the dragged column
            const newOrder = [...currentOrder];

            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedColumnId);

            // Update table column order
            table.setColumnOrder(newOrder);

            // Force re-render for order changes
            setOrderUpdateTrigger((prev) => prev + 1);

            setDraggedColumnId(null);
        },
        [draggedColumnId, table],
    );

    // Reset column order
    const resetColumnOrder = useCallback(() => {
        // Clear order by setting empty array (table will use default order)
        table.setColumnOrder([]);

        // Force re-render for order changes
        setOrderUpdateTrigger((prev) => prev + 1);
    }, [table]);

    // Get column display label
    const getColumnLabel = useCallback(
        (column: Column<TData, unknown>) => {
            // First check if we have a mapping for this column
            if (columnMapping && column.id in columnMapping) {
                return columnMapping[column.id];
            }

            // Then check for meta label
            return (
                (column.columnDef.meta as { label?: string })?.label
                // Finally fall back to formatted column ID
                ?? column.id.replace(/_/g, " ")
            );
        },
        [columnMapping],
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button aria-label="Toggle columns" className="ml-auto hidden lg:flex" size={size} variant="outline">
                    <Settings2 className="mr-2 h-4 w-4" />
                    View
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[220px] p-0">
                <Command>
                    <CommandInput placeholder="Search columns..." />
                    <CommandList>
                        <CommandEmpty>No columns found.</CommandEmpty>
                        <CommandGroup>
                            {columnsWithVisibility.map((column) => (
                                <CommandItem
                                    className={cn("flex cursor-grab items-center", draggedColumnId === column.id && "bg-accent opacity-50")}
                                    draggable
                                    key={column.id}
                                    onDragOver={handleDragOver}
                                    onDragStart={(e) => handleDragStart(e, column.id)}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                    onSelect={() => handleColumnVisibilityToggle(column.id)}
                                >
                                    <GripVertical className="mr-2 h-4 w-4 cursor-grab" />
                                    <span className="flex-grow truncate capitalize">{getColumnLabel(column)}</span>
                                    {column.isVisible ? <Eye className="ml-auto h-4 w-4" /> : <EyeOff className="ml-auto h-4 w-4" />}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem className="cursor-pointer justify-center text-center" onSelect={resetColumnOrder}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset Column Order
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
