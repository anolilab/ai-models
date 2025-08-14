import clsx from "clsx";
import { useMemo } from "react";

import { Table as ShadcnTable } from "@/components/ui/table";

import { useColumnVirtualizer } from "../../hooks/use-column-virtualizer";
import type { RowData, TableInstance } from "../../types";
import { parseCSSVarId } from "../../utils/utils";
import { Memo_TableBody } from "../body/table-body";
import { TableFooter } from "../footer/table-footer";
import { TableHead } from "../head/table-head";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const Table = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        getFlatHeaders,
        getState,
        options: { columns, enableTableFooter, enableTableHead, layoutMode, memoMode },
    } = table;
    const { columnSizing, columnSizingInfo, columnVisibility, density } = getState();

    const tableProps = {
        highlightOnHover: true,
        horizontalSpacing: density,
        verticalSpacing: density,
        ...rest,
    } as any;

    const columnSizeVars = useMemo(() => {
        const headers = getFlatHeaders();
        const colSizes: { [key: string]: number } = {};

        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const colSize = header.getSize();

            colSizes[`--header-${parseCSSVarId(header.id)}-size`] = colSize;
            colSizes[`--col-${parseCSSVarId(header.column.id)}-size`] = colSize;
        }

        return colSizes;
    }, [columns, columnSizing, columnSizingInfo, columnVisibility]);

    const columnVirtualizer = useColumnVirtualizer(table);
    const totalColumnWidth = columnVirtualizer?.getTotalSize?.();

    const commonTableGroupProps = {
        columnVirtualizer,
        table,
    };

    const { stripedColor } = tableProps;

    const tableElementProps = {
        className: clsx("ano-table bg-white dark:bg-gray-900", layoutMode?.startsWith("grid") && "grid", className),
        style: {
            ...columnSizeVars,
            ["--ano-striped-row-background-color" as any]: stripedColor,
            minWidth: totalColumnWidth ? `${totalColumnWidth}px` : undefined,
            ...style,
        },
    } as any;

    return (
        <ShadcnTable {...tableElementProps}>
            {enableTableHead && <TableHead {...commonTableGroupProps} />}
            <Memo_TableBody
                {...commonTableGroupProps}
                columnVirtualizer={columnVirtualizer}
                skipMemoization={!(memoMode === "table-body" || columnSizingInfo.isResizingColumn)}
            />
            {enableTableFooter && <TableFooter {...commonTableGroupProps} />}
        </ShadcnTable>
    );
};
