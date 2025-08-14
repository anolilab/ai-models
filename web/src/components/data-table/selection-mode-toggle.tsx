import { BarChart3, Download } from "lucide-react";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SelectionMode } from "@/hooks/use-table";

interface SelectionModeToggleProps {
    currentMode: SelectionMode;
    onModeChange: (mode: SelectionMode) => void;
}

const SelectionModeToggle: FC<SelectionModeToggleProps> = ({ currentMode, onModeChange }) => {
    const isComparisonMode = currentMode === "comparison";

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1 border p-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className={`h-8 px-3 ${isComparisonMode ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                            onClick={() => onModeChange("comparison")}
                            variant={isComparisonMode ? "default" : "ghost"}
                        >
                            <BarChart3 className="mr-1 h-4 w-4" />
                            Compare
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Compare up to 10 models side-by-side</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className={`h-8 px-3 ${!isComparisonMode ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                            onClick={() => onModeChange("export")}
                            variant={!isComparisonMode ? "default" : "ghost"}
                        >
                            <Download className="mr-1 h-4 w-4" />
                            Export
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Export unlimited models for data analysis</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default SelectionModeToggle;
