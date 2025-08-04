import { toast } from "sonner";

// Generic type for exportable data - should have string keys and values that can be converted to string
export type ExportableData = Record<string, string | number | boolean | null | undefined>;

// Type for transformation function that developers can provide
export type DataTransformFunction<T extends ExportableData> = (row: T) => ExportableData;

/**
 * Convert array of objects to CSV string
 */
function convertToCSV<T extends ExportableData>(data: T[], headers: string[], columnMapping?: Record<string, string>): string {
    if (data.length === 0) {
        throw new Error("No data to export");
    }

    // Create CSV header row with column mapping if provided
    let csvContent = "";

    if (columnMapping) {
        // Use column mapping for header names
        const headerRow = headers.map((header) => {
            const mappedHeader = columnMapping[header] || header;

            // Escape quotes and wrap in quotes if contains comma
            return mappedHeader.includes(",") || mappedHeader.includes("\"") ? `"${mappedHeader.replace(/"/g, "\"\"")}"` : mappedHeader;
        });

        csvContent = `${headerRow.join(",")}\n`;
    } else {
        // Use original headers
        csvContent = `${headers.join(",")}\n`;
    }

    // Add data rows
    for (const item of data) {
        const row = headers.map((header) => {
            // Get the value for this header from the item
            const value = item[header];

            // Convert all values to string and properly escape for CSV
            const cellValue = value === null || value === undefined ? "" : String(value);
            // Escape quotes and wrap in quotes if contains comma
            const escapedValue = cellValue.includes(",") || cellValue.includes("\"") ? `"${cellValue.replace(/"/g, "\"\"")}"` : cellValue;

            return escapedValue;
        });

        csvContent += `${row.join(",")}\n`;
    }

    return csvContent;
}

/**
 * Download blob as file
 */
function downloadFile(blob: Blob, filename: string) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends ExportableData>(
    data: T[],
    filename: string,
    headers: string[] = Object.keys(data[0] || {}),
    columnMapping?: Record<string, string>,
    transformFunction?: DataTransformFunction<T>,
): boolean {
    if (data.length === 0) {
        console.error("No data to export");

        return false;
    }

    try {
        // Apply transformation function first if provided, then filter data to only include specified headers
        const processedData = data.map((item) => {
            // Apply transformation function if provided
            const transformedItem = transformFunction ? transformFunction(item) : item;

            // Filter to only include specified headers
            const filteredItem: ExportableData = {};

            for (const header of headers) {
                if (header in transformedItem) {
                    filteredItem[header] = transformedItem[header];
                }
            }

            return filteredItem;
        });

        const csvContent = convertToCSV(processedData, headers, columnMapping);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        downloadFile(blob, `${filename}.csv`);

        return true;
    } catch (error) {
        console.error("Error creating CSV:", error);

        return false;
    }
}

/**
 * Export data to JSON file
 */
export function exportToJSON<T extends ExportableData>(data: T[], filename: string, transformFunction?: DataTransformFunction<T>): boolean {
    if (data.length === 0) {
        console.error("No data to export");

        return false;
    }

    try {
        // Apply transformation function if provided
        const processedData = data.map((item) => (transformFunction ? transformFunction(item) : item));

        // Convert to JSON string with pretty formatting
        const jsonContent = JSON.stringify(processedData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonContent], { type: "application/json" });

        downloadFile(blob, `${filename}.json`);

        return true;
    } catch (error) {
        console.error("Error exporting to JSON:", error);

        return false;
    }
}

/**
 * Unified export function that handles loading states and error handling
 */
export async function exportData<T extends ExportableData>(
    type: "csv" | "json",
    getData: () => Promise<T[]>,
    onLoadingStart?: () => void,
    onLoadingEnd?: () => void,
    options?: {
        columnMapping?: Record<string, string>;
        columnWidths?: { wch: number }[];
        entityName?: string;
        headers?: string[];
        transformFunction?: DataTransformFunction<T>;
    },
): Promise<boolean> {
    // Use a consistent toast ID to ensure only one toast is shown at a time
    const TOAST_ID = "export-data-toast";

    try {
        // Start loading
        if (onLoadingStart)
            onLoadingStart();

        // Show toast for long operations using consistent ID
        toast.loading("Preparing export...", {
            description: "Fetching data for export...",
            id: TOAST_ID,
        });

        // Get the data
        const exportData = await getData();

        // Update the same toast for processing
        toast.loading("Processing data...", {
            description: "Generating export file...",
            id: TOAST_ID,
        });

        if (exportData.length === 0) {
            toast.error("Export failed", {
                description: "No data available to export.",
                id: TOAST_ID,
            });

            return false;
        }

        // Get entity name for display in notifications
        const entityName = options?.entityName || "items";

        // Generate timestamp for filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${entityName}-export-${timestamp}`;

        // Export based on type
        let success = false;

        if (type === "csv") {
            success = exportToCSV(exportData, filename, options?.headers, options?.columnMapping, options?.transformFunction);

            if (success) {
                toast.success("Export successful", {
                    description: `Exported ${exportData.length} ${entityName} to CSV.`,
                    id: TOAST_ID,
                });
            }
        } else {
            success = exportToJSON(exportData, filename, options?.transformFunction);

            if (success) {
                toast.success("Export successful", {
                    description: `Exported ${exportData.length} ${entityName} to JSON.`,
                    id: TOAST_ID,
                });
            }
        }

        return success;
    } catch (error) {
        console.error("Error exporting data:", error);

        toast.error("Export failed", {
            description: "There was a problem exporting the data. Please try again.",
            id: TOAST_ID,
        });

        return false;
    } finally {
        // End loading regardless of result
        if (onLoadingEnd)
            onLoadingEnd();
    }
}
