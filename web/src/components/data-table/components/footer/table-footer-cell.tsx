import clsx from "clsx";
import type { CSSProperties } from "react";

import { TableCell as ShadcnTableCell } from "@/components/ui/table";

import type { Header, RowData, TableInstance } from "../../types";
import { parseCSSVarId, parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    footer: Header<TData>;
    renderedColumnIndex?: number;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableFooterCell = <TData extends RowData>({ className, footer, renderedColumnIndex, style, table, ...rest }: Props<TData>) => {
    const {
        options: { enableColumnPinning, layoutMode, mantineTableFooterCellProps },
    } = table;
    const { column } = footer;
    const { columnDef } = column;
    const { columnDefType } = columnDef;

    const isColumnPinned = enableColumnPinning && columnDef.columnDefType !== "group" && column.getIsPinned();

    const args = { column, table };
    const tableCellProps = {
        ...parseFromValuesOrFunc(mantineTableFooterCellProps, args),
        ...parseFromValuesOrFunc(columnDef.mantineTableFooterCellProps, args),
        ...rest,
    };

    const widthStyles: CSSProperties = {
        minWidth: `max(calc(var(--header-${parseCSSVarId(footer?.id)}-size) * 1px), ${columnDef.minSize ?? 30}px)`,
        width: `calc(var(--header-${parseCSSVarId(footer.id)}-size) * 1px)`,
    };

    if (layoutMode === "grid") {
        widthStyles.flex = `${[0, false].includes(columnDef.grow!) ? 0 : `var(--header-${parseCSSVarId(footer.id)}-size)`} 0 auto`;
    } else if (layoutMode === "grid-no-grow") {
        widthStyles.flex = `${+(columnDef.grow || 0)} 0 auto`;
    }

    return (
        <ShadcnTableCell
            colSpan={footer.colSpan}
            data-column-pinned={isColumnPinned || undefined}
            data-first-right-pinned={(isColumnPinned === "right" && column.getIsFirstColumn(isColumnPinned)) || undefined}
            data-index={renderedColumnIndex}
            data-last-left-pinned={(isColumnPinned === "left" && column.getIsLastColumn(isColumnPinned)) || undefined}
            {...tableCellProps}
            className={clsx(
                "z-10 bg-white p-4 text-left align-top text-sm font-bold dark:bg-gray-900",
                layoutMode?.startsWith("grid") && "flex justify-start",
                columnDefType === "group" && "justify-center text-center",
                isColumnPinned && "sticky",
                isColumnPinned === "left" && "left-0",
                isColumnPinned === "right" && "right-0",
                className,
            )}
            style={{
                ...widthStyles,
                ...style,
            }}
        >
            {tableCellProps.children
                ?? (footer.isPlaceholder
                    ? null
                    : parseFromValuesOrFunc(columnDef.Footer, {
                        column,
                        footer,
                        table,
                    })
                    ?? columnDef.footer
                    ?? null)}
        </ShadcnTableCell>
    );
};
