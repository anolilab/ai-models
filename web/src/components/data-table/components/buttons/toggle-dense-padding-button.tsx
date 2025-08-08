import { Minus, Plus, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ComponentPropsWithoutRef } from "react";
import type { DensityState, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> extends ComponentPropsWithoutRef<"button"> {
    className?: string;
    table: TableInstance<TData>;
    title?: string;
}

type TogglableDensityState = Extract<DensityState, "xs" | "md" | "xl">;

const next: Record<TogglableDensityState, TogglableDensityState> = {
    xs: "xl",
    md: "xs",
    xl: "md",
};

export const ToggleDensePaddingButton = <TData extends RowData>({
    className,
    table: {
        getState,
        options: { localization },
        setDensity,
    },
    title,
    ...rest
}: Props<TData>) => {
    const { density } = getState();

    const tooltipText = title ?? localization?.toggleDensity ?? "Toggle density";

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
                    {density === ("xs" as DensityState) ? <Minus className="h-4 w-4" /> : density === ("md" as DensityState) ? <Square className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};
