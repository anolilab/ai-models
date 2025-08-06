import clsx from "clsx";

import { TableHead as ShadcnTableHead, TableHeader as ShadcnTableHeader, TableRow as ShadcnTableRow } from "@/components/ui/table";

import type { ColumnVirtualizer, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { ToolbarAlertBanner } from "../toolbar/toolbar-alert-banner";
import { TableHeadRow } from "./table-head-row";

interface Props<TData extends RowData> {
    className?: string;
    columnVirtualizer?: ColumnVirtualizer;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableHead = <TData extends RowData>({ className, columnVirtualizer, style, table, ...rest }: Props<TData>) => {
    const {
        getHeaderGroups,
        getSelectedRowModel,
        getState,
        options: { enableStickyHeader, layoutMode, mantineTableHeadProps, positionToolbarAlertBanner },
        refs: { tableHeadRef },
    } = table;
    const { isFullScreen, showAlertBanner } = getState();

    const tableHeadProps = {
        ...parseFromValuesOrFunc(mantineTableHeadProps, {
            table,
        }),
        ...rest,
    };

    const stickyHeader = enableStickyHeader || isFullScreen;

    return (
        <ShadcnTableHeader
            className={clsx(
                "relative bg-white opacity-97 dark:bg-gray-900",
                layoutMode?.startsWith("grid") ? "grid" : "table-row-group",
                stickyHeader && "sticky top-0 z-30",
                className,
            )}
            ref={(ref: HTMLTableSectionElement) => {
                tableHeadRef.current = ref;

                if (tableHeadProps?.ref) {
                    // @ts-ignore
                    tableHeadProps.ref.current = ref;
                }
            }}
            style={{
                position: stickyHeader && layoutMode?.startsWith("grid") ? "sticky" : "relative",
                ...style,
            }}
        >
            {positionToolbarAlertBanner === "head-overlay" && (showAlertBanner || getSelectedRowModel().rows.length > 0)
                ? (
                <ShadcnTableRow className={clsx("table-row", layoutMode?.startsWith("grid") && "grid")}>
                    <ShadcnTableHead
                        className={clsx("table-cell p-0", layoutMode?.startsWith("grid") && "grid")}
                        colSpan={table.getVisibleLeafColumns().length}
                    >
                        <ToolbarAlertBanner table={table} />
                    </ShadcnTableHead>
                </ShadcnTableRow>
                )
                : getHeaderGroups().map((headerGroup) => (
                    <TableHeadRow columnVirtualizer={columnVirtualizer} headerGroup={headerGroup as any} key={headerGroup.id} table={table} />
                ))
            }
        </ShadcnTableHeader>
    );
};
