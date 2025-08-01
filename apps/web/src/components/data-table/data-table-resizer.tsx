"use client";

import { GripVertical } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Simplified resizer component without complex types
export function DataTableResizer({ header }: { header: any }) {
    const isResizing = header.column.getIsResizing();

    return (
        <div
            aria-hidden="true"
            className={cn(
                "absolute top-0 right-0 flex h-full w-4 cursor-col-resize touch-none items-center justify-center select-none",
                "z-10 opacity-0 group-hover/th:opacity-100",
                isResizing && "opacity-100",
            )}
            data-resizing={isResizing ? "true" : undefined}
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
        >
            <div className="flex h-4/5 items-center justify-center">
                <Separator
                    className={cn("h-4/5 w-0.5 transition-colors duration-200", isResizing ? "bg-primary" : "bg-border")}
                    decorative={false}
                    orientation="vertical"
                />

                {/* Use the GripVertical icon for better visual indication */}
                <GripVertical
                    className={cn("text-muted-foreground/70 absolute h-4 w-4", isResizing ? "text-primary" : "text-muted-foreground/70")}
                    strokeWidth={1.5}
                />
            </div>
        </div>
    );
}
