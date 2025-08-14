"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import cn from "@/lib/utils";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({ align = "center", className, sideOffset = 4, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                align={align}
                className={cn(
                    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=closed]:slide-out-to-top-1/2 data-[state=closed]:slide-out-to-bottom-1/2 data-[side=bottom]:slide-out-to-top-1/2 data-[side=left]:slide-out-to-right-1/2 data-[side=right]:slide-out-to-left-1/2 data-[side=top]:slide-out-to-bottom-1/2 (radix-popover-content-transform-origin) z-50 w-72 border p-4 shadow-md outline-hidden",
                    className,
                )}
                data-slot="popover-content"
                sideOffset={sideOffset}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
    return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
