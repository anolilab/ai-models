"use client";

import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SelectionModeToggleProps {
    currentMode: "comparison" | "export";
    onModeChange: (mode: "comparison" | "export") => void;
    selectedCount: number;
    maxSelectionLimit: number;
    size?: "sm" | "default" | "lg";
}

const SelectionModeToggle = ({
    currentMode,
    onModeChange,
    selectedCount,
    maxSelectionLimit,
    size = "default",
}: SelectionModeToggleProps) => {
    const isComparisonMode = currentMode === "comparison";
    const isExportMode = currentMode === "export";

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                    variant={isComparisonMode ? "default" : "ghost"}
                    size={size}
                    onClick={() => onModeChange("comparison")}
                    className="flex items-center gap-2"
                >
                    <BarChart3 className="h-4 w-4" />
                    Compare
                    {isComparisonMode && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                            Max {maxSelectionLimit}
                        </Badge>
                    )}
                </Button>
                
                <Button
                    variant={isExportMode ? "default" : "ghost"}
                    size={size}
                    onClick={() => onModeChange("export")}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export
                    {isExportMode && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                            Unlimited
                        </Badge>
                    )}
                </Button>
            </div>
            
            {isComparisonMode && selectedCount > maxSelectionLimit && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>⚠️</span>
                    Switch to Export mode to select more items
                </div>
            )}
        </div>
    );
};

export default SelectionModeToggle;