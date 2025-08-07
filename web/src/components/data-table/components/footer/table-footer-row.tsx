import clsx from "clsx";

import { TableRow as ShadcnTableRow } from "@/components/ui/table";

import type { ColumnVirtualizer, Header, RowData, TableInstance, VirtualItem } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { TableFooterCell } from "./table-footer-cell";

interface Props<TData extends RowData> {
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    footerGroup: any;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableFooterRow = <TData extends RowData>({ className, columnVirtualizer, footerGroup, style, table, ...rest }: Props<TData>) => {
    const {
        options,
    } = table;
    
    // Handle missing properties with defaults
    const {
        layoutMode = 'table',
        mantineTableFooterRowProps = {},
    } = (options as any) || {};

    const { virtualColumns, virtualPaddingLeft, virtualPaddingRight } = columnVirtualizer ?? {};

    // if no content in row, skip row
    if (
        !footerGroup.headers?.some(
            (header: any) => {
                const column = header?.column;
                const columnDef = column?.columnDef;
                return (typeof columnDef?.footer === "string" && !!columnDef.footer) || columnDef?.Footer;
            },
        )
    ) {
        return null;
    }

    const tableRowProps = {
        ...parseFromValuesOrFunc(mantineTableFooterRowProps, {
            footerGroup,
            table,
        }),
        ...rest,
    };

    return (
        <ShadcnTableRow
            className={clsx(
                "table-row w-full border-t border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900",
                layoutMode?.startsWith("grid") && "flex",
                className,
            )}
            style={style}
            {...tableRowProps}
        >
            {virtualPaddingLeft ? <th style={{ display: "flex", width: virtualPaddingLeft }} /> : null}
            {(virtualColumns ?? footerGroup.headers).map((footerOrVirtualFooter: any, renderedColumnIndex: number) => {
                let footer = footerOrVirtualFooter as Header<TData>;

                if (columnVirtualizer) {
                    renderedColumnIndex = (footerOrVirtualFooter as VirtualItem).index;
                    footer = footerGroup.headers[renderedColumnIndex];
                }

                return <TableFooterCell footer={footer} key={footer.id} renderedColumnIndex={renderedColumnIndex} table={table} />;
            })}
            {virtualPaddingRight ? <th style={{ display: "flex", width: virtualPaddingRight }} /> : null}
        </ShadcnTableRow>
    );
};
