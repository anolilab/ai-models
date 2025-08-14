import { memo } from "react";

import cn from "@/lib/utils";

const Skeleton = memo(({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("bg-muted animate-pulse rounded-md", className)} {...props} />
));

export { Skeleton };
