"use client";

import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getButtonSizeClass = (size: "sm" | "default" | "lg") => {
    switch (size) {
        case "lg":
            return "h-11 w-11 p-0";
        case "sm":
            return "h-7 w-7 p-0";
        default:
            return "h-8 w-8 p-0";
    }
};

interface DataTablePaginationProps<TData> {
    pageSizeOptions?: number[]; // Custom page size options
    size?: "sm" | "default" | "lg"; // Size prop for components
    table: Table<TData>;
    totalItems?: number; // Total number of items from API
    totalSelectedItems?: number; // Total selected items across all pages
}

export function DataTablePagination<TData>({
    pageSizeOptions = [10, 20, 30, 40, 50], // Default options if none provided
    size = "default",
    table,
    totalItems = 0,
    totalSelectedItems = 0,
}: DataTablePaginationProps<TData>) {
    // Convert 'lg' size to 'default' for SelectTrigger since it only accepts 'sm' | 'default'
    const selectSize = size === "lg" ? "default" : size;

    return (
        <div className="flex w-full flex-col items-center justify-between gap-4 overflow-auto px-2 py-1 sm:flex-row sm:gap-8">
            <div className="text-muted-foreground flex-1 text-sm">
                {totalSelectedItems} of {totalItems} row(s) selected.
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
                    <Select
                        onValueChange={(value) => {
                            // Validate the input value
                            const numericValue = parseInt(value, 10);

                            if (isNaN(numericValue) || numericValue <= 0) {
                                console.error(`Invalid page size value: ${value}`);

                                return;
                            }

                            // Use the table's pagination change handler to update table state
                            table.setPagination({
                                pageIndex: 0, // Reset to first page
                                pageSize: numericValue,
                            });
                        }}
                        value={`${table.getState().pagination.pageSize}`}
                    >
                        <SelectTrigger className="cursor-pointer" size={selectSize}>
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent className="cursor-pointer" side="top">
                            {pageSizeOptions.map((pageSize) => (
                                <SelectItem className="cursor-pointer" key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        aria-label="Go to first page"
                        className={`${getButtonSizeClass(size)} hidden cursor-pointer lg:flex`}
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.setPagination({ pageIndex: 0, pageSize: table.getState().pagination.pageSize })}
                        variant="outline"
                    >
                        <DoubleArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                        aria-label="Go to previous page"
                        className={`${getButtonSizeClass(size)} cursor-pointer`}
                        disabled={!table.getCanPreviousPage()}
                        onClick={() =>
                            table.setPagination({
                                pageIndex: table.getState().pagination.pageIndex - 1,
                                pageSize: table.getState().pagination.pageSize,
                            })
                        }
                        variant="outline"
                    >
                        <ChevronLeftIcon aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                        aria-label="Go to next page"
                        className={`${getButtonSizeClass(size)} cursor-pointer`}
                        disabled={!table.getCanNextPage()}
                        onClick={() =>
                            table.setPagination({
                                pageIndex: table.getState().pagination.pageIndex + 1,
                                pageSize: table.getState().pagination.pageSize,
                            })
                        }
                        variant="outline"
                    >
                        <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                        aria-label="Go to last page"
                        className={`${getButtonSizeClass(size)} hidden cursor-pointer lg:flex`}
                        disabled={!table.getCanNextPage()}
                        onClick={() =>
                            table.setPagination({
                                pageIndex: table.getPageCount() - 1,
                                pageSize: table.getState().pagination.pageSize,
                            })
                        }
                        variant="outline"
                    >
                        <DoubleArrowRightIcon aria-hidden="true" className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
