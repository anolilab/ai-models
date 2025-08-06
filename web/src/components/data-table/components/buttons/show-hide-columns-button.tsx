import clsx from "clsx";
import { Columns } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { HTMLPropsRef, RowData, TableInstance } from "../../types";
import { ShowHideColumnsMenu } from "../menus/show-hide-columns-menu";

interface Props<TData extends RowData> extends HTMLPropsRef<HTMLButtonElement> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
    title?: string;
}

export const ShowHideColumnsButton = <TData extends RowData>({ className, style, table, title, ...rest }: Props<TData>) => {
    const {
        localization: { showHideColumns },
    } = table.options;

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button aria-label={title ?? showHideColumns} className={clsx("h-10 w-10 p-0", className)} style={style} variant="ghost" {...rest}>
                            <Columns className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{title ?? showHideColumns}</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
                <ShowHideColumnsMenu table={table} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
