import { Maximize, Minimize } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ComponentPropsWithoutRef } from "react";
import type { RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> extends ComponentPropsWithoutRef<"button"> {
    className?: string;
    table: TableInstance<TData>;
    title?: string;
}

export const ToggleFullScreenButton = <TData extends RowData>({
    className,
    table: {
        getState,
        options: { localization },
        setIsFullScreen,
    },
    title,
    ...rest
}: Props<TData>) => {
    const { isFullScreen } = getState();
    const [tooltipOpened, setTooltipOpened] = useState(false);

    const handleToggleFullScreen = () => {
        setTooltipOpened(false);
        setIsFullScreen((current) => !current);
    };

    const tooltipText = title ?? localization?.toggleFullScreen ?? "Toggle full screen";

    return (
        <Tooltip onOpenChange={setTooltipOpened} open={tooltipOpened}>
            <TooltipTrigger asChild>
                <Button aria-label={tooltipText} className={className} onClick={handleToggleFullScreen} size="sm" variant="ghost" {...rest}>
                    {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};
