import clsx from "clsx";

import { TableRow as ShadcnTableRow } from "@/components/ui/table";

import type { ColumnVirtualizer, Header, RowData, TableInstance, VirtualItem } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { TableHeadCell } from "./table-head-cell";

interface Props<TData extends RowData> {
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    headerGroup: any;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHeadRow = <TData extends RowData>(props: Props<TData>) => {
    const { className, columnVirtualizer, headerGroup, style, table, ...rest } = props;
    
    const {
        getState,
        options,
    } = table;
    
    // Handle missing properties with defaults
    const {
        enableStickyHeader = false,
        layoutMode = 'table',
        mantineTableHeadRowProps = {},
    } = (options as any) || {};
    
    // Handle missing getState method
    const state = getState ? getState() : { isFullScreen: false };
    const { isFullScreen = false } = (state as any) || {};

    const { virtualColumns, virtualPaddingLeft, virtualPaddingRight } = columnVirtualizer ?? {};

    const tableRowProps = {
        ...parseFromValuesOrFunc(mantineTableHeadRowProps, {
            headerGroup,
            table,
        }),
        ...rest,
    };

    return (
        <ShadcnTableRow
            {...tableRowProps}
            className={clsx(
                "table-row bg-white dark:bg-gray-900",
                layoutMode?.startsWith("grid") && "flex",
                (enableStickyHeader || isFullScreen) && "sticky top-0",
                className,
            )}
            style={style}
        >
            {virtualPaddingLeft ? <th style={{ display: "flex", width: virtualPaddingLeft }} /> : null}
            {((virtualColumns ?? headerGroup.headers) || []).map((headerOrVirtualHeader: any, renderedHeaderIndex: number) => {
                let header = headerOrVirtualHeader as Header<TData>;

                if (columnVirtualizer) {
                    renderedHeaderIndex = (headerOrVirtualHeader as VirtualItem).index;
                    header = headerGroup.headers?.[renderedHeaderIndex];
                }

                if (!header) return null;

                return (
                    <TableHeadCell
                        columnVirtualizer={columnVirtualizer}
                        header={header}
                        key={header.id || renderedHeaderIndex}
                        renderedHeaderIndex={renderedHeaderIndex}
                        table={table}
                    />
                );
            })}
            {virtualPaddingRight ? <th style={{ display: "flex", width: virtualPaddingRight }} /> : null}
        </ShadcnTableRow>
    );
};
