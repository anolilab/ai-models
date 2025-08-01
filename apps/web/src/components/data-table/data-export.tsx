"use client";

import type { Table } from "@tanstack/react-table";
import { DownloadIcon, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { DataTransformFunction, ExportableData } from "./utils/export-utils";
import { exportData, exportToCSV, exportToExcel, exportToJSON } from "./utils/export-utils";
import type { TableConfig } from "./utils/table-config";

interface DataTableExportProps<TData extends ExportableData> {
    columnMapping?: Record<string, string>;
    columnWidths?: { wch: number }[];
    config?: TableConfig;
    data: TData[];
    entityName?: string;
    getAllItems?: () => Promise<TData[]>;
    getSelectedItems?: () => Promise<TData[]>;
    headers?: string[];
    selectedData?: TData[];
    size?: "sm" | "default" | "lg";
    table: Table<TData>;
    transformFunction?: DataTransformFunction<TData>;
}

export function DataTableExport<TData extends ExportableData>({
    columnMapping,
    columnWidths,
    config,
    data,
    entityName = "items",
    getAllItems,
    getSelectedItems,
    headers,
    selectedData,
    size = "default",
    table,
    transformFunction,
}: DataTableExportProps<TData>): JSX.Element {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async (type: "csv" | "excel" | "json") => {
        if (isLoading)
            return; // Prevent multiple export requests

        // Create a data fetching function based on the current state
        const fetchExportData = async (): Promise<TData[]> => {
            // If we have selected items and a function to get their complete data
            if (getSelectedItems && selectedData && selectedData.length > 0) {
                // Check if data is on current page or needs to be fetched
                if (selectedData.some((item) => Object.keys(item).length === 0)) {
                    // We have placeholder data, need to fetch complete data
                    toast.loading("Preparing export...", {
                        description: `Fetching complete data for selected ${entityName}.`,
                        id: "export-data-toast",
                    });
                }

                // Fetch complete data for selected items
                const selectedItems = await getSelectedItems();

                if (selectedItems.length === 0) {
                    throw new Error(`Failed to retrieve complete data for selected ${entityName}`);
                }

                // Order the items according to the current sorting in the table
                // This preserves the table's page order in the exported data
                const sortedItems = [...selectedItems];
                const { sorting } = table.getState();

                if (sorting.length > 0) {
                    const { desc: isDescending, id: sortField } = sorting[0];

                    // Validate that sortField exists in data before sorting
                    const sampleItem = sortedItems[0];

                    if (sampleItem && !(sortField in sampleItem)) {
                        console.warn(`Sort field "${sortField}" not found in data. Skipping sort.`);

                        return sortedItems;
                    }

                    sortedItems.sort((a, b) => {
                        try {
                            const valueA = a[sortField as keyof TData];
                            const valueB = b[sortField as keyof TData];

                            if (valueA === valueB)
                                return 0;

                            if (valueA === null || valueA === undefined)
                                return isDescending ? 1 : -1;

                            if (valueB === null || valueB === undefined)
                                return isDescending ? -1 : 1;

                            if (typeof valueA === "string" && typeof valueB === "string") {
                                return isDescending ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
                            }

                            // For numeric and other comparable types
                            return isDescending ? valueB > valueA ? 1 : -1 : valueA > valueB ? 1 : -1;
                        } catch (sortError) {
                            console.error("Error during sorting:", sortError);

                            return 0; // Maintain original order on error
                        }
                    });
                }

                return sortedItems;
            }

            if (getAllItems && !selectedData?.length) {
                // If we're exporting all data and have a method to get it with proper ordering
                toast.loading("Preparing export...", {
                    description: `Fetching all ${entityName} with current sorting...`,
                    id: "export-data-toast",
                });

                // Fetch all data with server-side sorting applied
                const allItems = await getAllItems();

                if (allItems.length === 0) {
                    throw new Error(`No ${entityName} available to export`);
                }

                return allItems;
            }

            if (!data || data.length === 0) {
                throw new Error("No data available for export");
            }

            return selectedData && selectedData.length > 0 ? selectedData : data;
        };

        try {
            // Get visible columns from the table
            const visibleColumns = table
                .getAllColumns()
                .filter((column) => column.getIsVisible())
                .filter((column) => column.id !== "actions" && column.id !== "select");

            // Generate export options based on visible columns and respect column order
            const { columnOrder } = table.getState();
            const orderedVisibleColumns
                = columnOrder.length > 0
                    ? [...visibleColumns].sort((a, b) => {
                        const aIndex = columnOrder.indexOf(a.id);
                        const bIndex = columnOrder.indexOf(b.id);

                        // If column isn't in the order array, put it at the end
                        if (aIndex === -1)
                            return 1;

                        if (bIndex === -1)
                            return -1;

                        return aIndex - bIndex;
                    })
                    : visibleColumns;

            // Generate export headers - always start with visible columns only
            const visibleColumnIds = orderedVisibleColumns.map((column) => column.id);
            // Get all table column IDs (visible + hidden) to identify what's a table column vs transform column
            const allTableColumnIds = table
                .getAllColumns()
                .filter((column) => column.id !== "actions" && column.id !== "select")
                .map((column) => column.id);

            let exportHeaders: string[];

            if (config?.allowExportNewColumns === false) {
                // Only export visible columns - no new columns from transform
                exportHeaders = headers && headers.length > 0 ? headers.filter((header) => visibleColumnIds.includes(header)) : visibleColumnIds;
            } else {
                // Allow new columns from transform function, but still filter existing columns by visibility
                if (headers && headers.length > 0) {
                    // Split headers into existing table columns (must be visible) and new transform columns (allowed)
                    const existingHeaders = headers.filter((header) => allTableColumnIds.includes(header) && visibleColumnIds.includes(header));
                    const newHeaders = headers.filter((header) => !allTableColumnIds.includes(header));

                    exportHeaders = [...existingHeaders, ...newHeaders];
                } else {
                    exportHeaders = visibleColumnIds;
                }
            }

            // Auto-generate column mapping from table headers if not provided
            const exportColumnMapping
                = columnMapping
                    || (() => {
                        const mapping: Record<string, string> = {};

                        orderedVisibleColumns.forEach((column) => {
                        // Try to get header text if available
                            const headerText = column.columnDef.header as string;

                            if (headerText && typeof headerText === "string") {
                                mapping[column.id] = headerText;
                            } else {
                            // Fallback to formatted column ID
                                mapping[column.id] = column.id
                                    .split(/(?=[A-Z])|_/)
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(" ");
                            }
                        });

                        return mapping;
                    })();

            // Filter column widths to match export headers
            const exportColumnWidths = columnWidths
                ? exportHeaders.map((_, index) => columnWidths[index] || { wch: 15 })
                : exportHeaders.map(() => { return { wch: 15 }; });

            // Use the generic export function with proper options
            await exportData(
                type,
                fetchExportData,
                () => setIsLoading(true),
                () => setIsLoading(false),
                {
                    columnMapping: exportColumnMapping,
                    columnWidths: exportColumnWidths,
                    entityName,
                    headers: exportHeaders,
                    transformFunction,
                },
            );
        } catch (error) {
            console.error("Error exporting data:", error);
            toast.error("Export failed", {
                description: "There was a problem exporting. Please try again.",
                id: "export-data-toast",
            });
            setIsLoading(false);
        }
    };

    const exportAllPages = async (type: "csv" | "excel" | "json") => {
        if (isLoading || !getAllItems)
            return;

        setIsLoading(true);

        try {
            // Show toast for long operations
            toast.loading("Preparing export...", {
                description: `Fetching all ${entityName}...`,
                id: "export-data-toast",
            });

            // Use the table's filtered data instead of all data
            // This respects any filters, column visibility, and other table state
            const filteredRows = table.getFilteredRowModel().rows;

            if (filteredRows.length === 0) {
                toast.error("Export failed", {
                    description: "No data available to export.",
                    id: "export-data-toast",
                });

                return;
            }

            // Extract the original data from the filtered rows
            const allData = filteredRows.map((row) => row.original);

            // Get visible columns and apply export
            const visibleColumns = table
                .getAllColumns()
                .filter((column) => column.getIsVisible())
                .filter((column) => column.id !== "actions" && column.id !== "select");

            // Generate export headers - always start with visible columns only
            const visibleColumnIds = visibleColumns.map((column) => column.id);
            // Get all table column IDs (visible + hidden) to identify what's a table column vs transform column
            const allTableColumnIds = table
                .getAllColumns()
                .filter((column) => column.id !== "actions" && column.id !== "select")
                .map((column) => column.id);

            let exportHeaders: string[];

            if (config?.allowExportNewColumns === false) {
                // Only export visible columns - no new columns from transform
                exportHeaders = headers && headers.length > 0 ? headers.filter((header) => visibleColumnIds.includes(header)) : visibleColumnIds;
            } else {
                // Allow new columns from transform function, but still filter existing columns by visibility
                if (headers && headers.length > 0) {
                    // Split headers into existing table columns (must be visible) and new transform columns (allowed)
                    const existingHeaders = headers.filter((header) => allTableColumnIds.includes(header) && visibleColumnIds.includes(header));
                    const newHeaders = headers.filter((header) => !allTableColumnIds.includes(header));

                    exportHeaders = [...existingHeaders, ...newHeaders];
                } else {
                    exportHeaders = visibleColumnIds;
                }
            }

            const exportColumnMapping
                = columnMapping
                    || (() => {
                        const mapping: Record<string, string> = {};

                        // If we have custom headers, generate mapping for them
                        if (headers && headers.length > 0) {
                            headers.forEach((header) => {
                                mapping[header] = header
                                    .split(/(?=[A-Z])|_/)
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(" ");
                            });
                        } else {
                        // Otherwise use visible columns
                            visibleColumns.forEach((column) => {
                                const headerText = column.columnDef.header as string;

                                if (headerText && typeof headerText === "string") {
                                    mapping[column.id] = headerText;
                                } else {
                                    mapping[column.id] = column.id
                                        .split(/(?=[A-Z])|_/)
                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                        .join(" ");
                                }
                            });
                        }

                        return mapping;
                    })();

            const exportColumnWidths = columnWidths
                ? exportHeaders.map((_, index) => columnWidths[index] || { wch: 15 })
                : exportHeaders.map(() => { return { wch: 15 }; });

            // Update toast for processing
            toast.loading("Processing data...", {
                description: "Generating export file...",
                id: "export-data-toast",
            });

            // Generate timestamp for filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `${entityName}-all-pages-export-${timestamp}`;

            // Export based on type
            let success = false;

            if (type === "csv") {
                success = exportToCSV(allData, filename, exportHeaders, exportColumnMapping, transformFunction);
            } else if (type === "json") {
                success = exportToJSON(allData, filename, transformFunction);
            } else {
                success = exportToExcel(allData, filename, exportColumnMapping, exportColumnWidths, exportHeaders, transformFunction);
            }

            if (success) {
                toast.success("Export successful", {
                    description: `Exported all ${allData.length} ${entityName} to ${type.toUpperCase()}.`,
                    id: "export-data-toast",
                });
            }
        } catch (error) {
            console.error("Error exporting all pages:", error);
            toast.error("Export failed", {
                description: "There was a problem exporting all pages. Please try again.",
                id: "export-data-toast",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Check if any rows are selected
    const hasSelection = selectedData && selectedData.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isLoading} size={size} variant="outline">
                    {isLoading
                        ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                        )
                        : (
                        <>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Export
                            {hasSelection && <span className="ml-1">({selectedData?.length})</span>}
                        </>
                        )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {hasSelection
                    ? (
                    <>
                        <DropdownMenuItem disabled={isLoading} onClick={() => handleExport("csv")}>
                            Export Selected as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isLoading} onClick={() => handleExport("excel")}>
                            Export Selected as XLS
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isLoading} onClick={() => handleExport("json")}>
                            Export Selected as JSON
                        </DropdownMenuItem>
                    </>
                    )
                    : (
                    <>
                        <DropdownMenuItem disabled={isLoading} onClick={() => handleExport("csv")}>
                            Export Current Page as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isLoading} onClick={() => handleExport("excel")}>
                            Export Current Page as XLS
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isLoading} onClick={() => handleExport("json")}>
                            Export Current Page as JSON
                        </DropdownMenuItem>
                        {getAllItems && (
                            <>
                                <DropdownMenuItem disabled={isLoading} onClick={() => exportAllPages("csv")}>
                                    Export All Pages as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={isLoading} onClick={() => exportAllPages("excel")}>
                                    Export All Pages as XLS
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={isLoading} onClick={() => exportAllPages("json")}>
                                    Export All Pages as JSON
                                </DropdownMenuItem>
                            </>
                        )}
                    </>
                    )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
