import { Minus, Plus, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DensityState, HTMLPropsRef, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> extends HTMLPropsRef<HTMLButtonElement> {
    className?: string;
    table: TableInstance<TData>;
    title?: string;
}

type TogglableDensityState = Exclude<DensityState, "lg" | "sm">;

const next: Record<TogglableDensityState, TogglableDensityState> = {
    md: "xs",
    xl: "md",
    xs: "xl",
};

export const ToggleDensePaddingButton = <TData extends RowData>({
    className,
    table: {
        getState,
        options: {
            localization: { toggleDensity },
        },
        setDensity,
    },
    title,
    ...rest
}: Props<TData>) => {
    const { density } = getState();

    const tooltipText = title ?? toggleDensity;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label={tooltipText}
                    className={className}
                    onClick={() => setDensity((current) => next[current as TogglableDensityState])}
                    size="sm"
                    variant="ghost"
                    {...rest}
                >
                    {density === "xs" ? <Minus className="h-4 w-4" /> : density === "md" ? <Square className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};
