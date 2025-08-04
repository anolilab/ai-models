"use client";

import { Download, FileJson, FileText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DataExportProps {
    className?: string;
    data: any[];
    disabled?: boolean;
    filename?: string;
    size?: "default" | "sm" | "lg" | "icon";
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

const DataExport = ({ className = "", data, disabled = false, filename = "export", size = "default", variant = "outline" }: DataExportProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const exportToCSV = () => {
        if (!data || data.length === 0)
            return;

        setIsExporting(true);

        try {
            // Get headers from first object
            const headers = Object.keys(data[0]);

            // Create CSV content
            const csvContent = [
                headers.join(","), // Header row
                ...data.map((row) =>
                    headers
                        .map((header) => {
                            const value = row[header];

                            // Handle values that need quotes (contain commas, quotes, or newlines)
                            if (typeof value === "string" && (value.includes(",") || value.includes("\"") || value.includes("\n"))) {
                                return `"${value.replace(/"/g, "\"\"")}"`;
                            }

                            return value || "";
                        })
                        .join(","),
                ),
            ].join("\n");

            // Create and download file
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting CSV:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const exportToJSON = () => {
        if (!data || data.length === 0)
            return;

        setIsExporting(true);

        try {
            // Create JSON content
            const jsonContent = JSON.stringify(data, null, 2);

            // Create and download file
            const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.json`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting JSON:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className={className} disabled={disabled || isExporting || !data || data.length === 0} size={size} variant={variant}>
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={isExporting} onClick={exportToCSV}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isExporting} onClick={exportToJSON}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DataExport;
