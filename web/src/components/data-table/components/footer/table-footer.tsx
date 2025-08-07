import clsx from "clsx";

import { TableFooter as ShadcnTableFooter } from "@/components/ui/table";

import type { ColumnVirtualizer, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { TableFooterRow } from "./table-footer-row";

interface Props<TData extends RowData> {
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableFooter = <TData extends RowData>({ className, columnVirtualizer, style, table, ...rest }: Props<TData>) => {
    const {
        getFooterGroups,
        getState,
        options,
        refs,
    } = table;
    
    // Handle missing properties with defaults
    const {
        enableStickyFooter = false,
        layoutMode = 'table',
        mantineTableFooterProps = {},
    } = (options as any) || {};
    
    const { tableFooterRef } = refs || {};
    
    // Handle missing getState method
    const state = getState ? getState() : { isFullScreen: false };
    const { isFullScreen = false } = (state as any) || {};

    const tableFooterProps = {
        ...parseFromValuesOrFunc(mantineTableFooterProps, {
            table,
        }),
        ...rest,
    };

    const stickFooter = (isFullScreen || enableStickyFooter) && enableStickyFooter !== false;

    return (
        <ShadcnTableFooter
            className={clsx(
                "table-row-group bg-white",
                className,
                stickFooter && "sticky bottom-0 z-10 opacity-97 outline outline-1 outline-gray-300 dark:outline-gray-700",
                layoutMode?.startsWith("grid") && "grid",
            )}
            ref={(ref: HTMLTableSectionElement) => {
                if (tableFooterRef?.current !== undefined) {
                    tableFooterRef.current = ref;
                }

                if (tableFooterProps?.ref) {
                    // @ts-ignore
                    tableFooterProps.ref.current = ref;
                }
            }}
            style={style}
        >
            {(getFooterGroups ? getFooterGroups() || [] : []).map((footerGroup) => (
                <TableFooterRow columnVirtualizer={columnVirtualizer} footerGroup={footerGroup as any} key={footerGroup.id} table={table} />
            ))}
        </ShadcnTableFooter>
    );
};
