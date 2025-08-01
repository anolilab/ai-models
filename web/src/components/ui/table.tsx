import * as React from "react";

import cn from "@/lib/utils";

const Table = React.forwardRef<
    HTMLDivElement,
    Omit<React.ComponentProps<"table">, "className"> & {
        classNames?: {
            container?: string;
            table?: string;
        };
    }
>(({ classNames, ...props }, ref) => (
    <div className={cn("relative h-full w-full", classNames?.container)} data-slot="table-container" ref={ref}>
        <table className={cn("w-full caption-bottom text-sm", classNames?.table)} data-slot="table" {...props} />
    </div>
));

Table.displayName = "Table";

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
    return <thead className={cn("[&_tr]:border-b", className)} data-slot="table-header" {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} data-slot="table-body" {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
    return <tfoot className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)} data-slot="table-footer" {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
    return <tr className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)} data-slot="table-row" {...props} />;
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
    return (
        <th
            className={cn(
                "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className,
            )}
            data-slot="table-head"
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
    return (
        <td
            className={cn("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
            data-slot="table-cell"
            {...props}
        />
    );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
    return <caption className={cn("text-muted-foreground mt-4 text-sm", className)} data-slot="table-caption" {...props} />;
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
