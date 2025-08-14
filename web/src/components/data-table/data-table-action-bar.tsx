"use client";

import type { Table } from "@tanstack/react-table";
import { Loader, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import cn from "@/lib/utils";

interface DataTableActionBarProps<TData> extends ComponentProps<typeof motion.div> {
    container?: Element | DocumentFragment | null;
    table: Table<TData>;
    visible?: boolean;
}

const DataTableActionBar = <TData,>({
    children,
    className,
    container: containerProp,
    table,
    visible: visibleProp,
    ...props
}: DataTableActionBarProps<TData>) => {
    const [mounted, setMounted] = useState(false);

    useLayoutEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                table.toggleAllRowsSelected(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [table]);

    const container = containerProp ?? (mounted ? globalThis.document?.body : null);

    if (!container)
        return null;

    const visible = visibleProp ?? table.getFilteredSelectedRowModel().rows.length > 0;

    return createPortal(
        <AnimatePresence>
            {visible && (
                <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    aria-orientation="horizontal"
                    className={cn(
                        "bg-background text-foreground fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-md border p-2 shadow-sm",
                        className,
                    )}
                    exit={{ opacity: 0, y: 20 }}
                    initial={{ opacity: 0, y: 20 }}
                    role="toolbar"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    {...props}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        container,
    );
};

interface DataTableActionBarActionProps extends ComponentProps<typeof Button> {
    isPending?: boolean;
    tooltip?: string;
}

const DataTableActionBarAction = ({ children, className, disabled, isPending, size = "sm", tooltip, ...props }: DataTableActionBarActionProps) => {
    const trigger = (
        <Button
            className={cn(
                "border-secondary bg-secondary/50 hover:bg-secondary/70 gap-1.5 border [&>svg]:size-3.5",
                size === "icon" ? "size-7" : "h-7",
                className,
            )}
            disabled={disabled || isPending}
            size={size}
            variant="secondary"
            {...props}
        >
            {isPending ? <Loader className="animate-spin" /> : children}
        </Button>
    );

    if (!tooltip)
        return trigger;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent className="bg-accent text-foreground border font-semibold dark:bg-zinc-900 [&>span]:hidden" sideOffset={6}>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
};

interface DataTableActionBarSelectionProps<TData> {
    table: Table<TData>;
}

const DataTableActionBarSelection = <TData,>({ table }: DataTableActionBarSelectionProps<TData>) => {
    const onClearSelection = useCallback(() => {
        table.toggleAllRowsSelected(false);
    }, [table]);

    return (
        <div className="flex h-7 items-center rounded-md border pr-1 pl-2.5">
            <span className="text-xs whitespace-nowrap">{table.getFilteredSelectedRowModel().rows.length} selected</span>
            <Separator className="mr-1 ml-2 data-[orientation=vertical]:h-4" orientation="vertical" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className="size-5" onClick={onClearSelection} size="icon" variant="ghost">
                        <X className="size-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent
                    className="bg-accent text-foreground flex items-center gap-2 border px-2 py-1 font-semibold dark:bg-zinc-900 [&>span]:hidden"
                    sideOffset={10}
                >
                    <p>Clear selection</p>
                    <kbd className="bg-background text-foreground rounded border px-1.5 py-px font-mono text-[0.7rem] font-normal shadow-xs select-none">
                        <abbr className="no-underline" title="Escape">
                            Esc
                        </abbr>
                    </kbd>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export { DataTableActionBar, DataTableActionBarAction, DataTableActionBarSelection };
