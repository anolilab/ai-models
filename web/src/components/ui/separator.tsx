import { Separator as SeparatorPrimitive } from "radix-ui";
import * as React from "react";

import cn from "@/lib/utils";

function Separator({ className, decorative = true, orientation = "horizontal", ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
    return (
        <SeparatorPrimitive.Root
            className={cn(
                "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
                className,
            )}
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            {...props}
        />
    );
}

export { Separator };
