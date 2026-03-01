import { BarChart3, Download } from "lucide-react";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SelectionMode } from "@/hooks/use-table";
import cn from "@/lib/utils";

interface SelectionModeToggleProps {
    currentMode: SelectionMode;
    onModeChange: (mode: SelectionMode) => void;
}

const SelectionModeToggle: FC<SelectionModeToggleProps> = ({ currentMode, onModeChange }) => {
    const isComparisonMode = currentMode === "comparison";

    return (
        <TooltipProvider>
            <div className="flex items-center rounded-full border bg-muted/50 p-0.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className={cn(
                                "h-7 rounded-full px-3 text-xs font-medium transition-all duration-150",
                                isComparisonMode
                                    ? "bg-background text-foreground shadow-sm"
                                    : "bg-transparent text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => onModeChange("comparison")}
                            variant="ghost"
                        >
                            <BarChart3 className="mr-1.5 h-3 w-3" />
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
                            className={cn(
                                "h-7 rounded-full px-3 text-xs font-medium transition-all duration-150",
                                !isComparisonMode
                                    ? "bg-background text-foreground shadow-sm"
                                    : "bg-transparent text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => onModeChange("export")}
                            variant="ghost"
                        >
                            <Download className="mr-1.5 h-3 w-3" />
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
