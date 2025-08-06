import clsx from "clsx";
import type { RefObject } from "react";

import { TableCell as ShadcnTableCell, TableRow as ShadcnTableRow } from "@/components/ui/table";

import type { Row, RowData, RowVirtualizer, TableInstance, VirtualItem } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { EditCellTextInput } from "../inputs/edit-cell-text-input";

interface Props<TData extends RowData> {
    className?: string;
    parentRowRef: RefObject<HTMLTableRowElement>;
    renderedRowIndex?: number;
    row: Row<TData>;
    rowVirtualizer?: RowVirtualizer;
    striped?: false | string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
    virtualRow?: VirtualItem;
}

export const TableDetailPanel = <TData extends RowData>({
    className,
    parentRowRef,
    renderedRowIndex = 0,
    row,
    rowVirtualizer,
    striped,
    style,
    table,
    virtualRow,
    ...rest
}: Props<TData>) => {
    const {
        getState,
        getVisibleLeafColumns,
        options: { layoutMode, mantineDetailPanelProps, mantineTableBodyRowProps, renderDetailPanel },
    } = table;
    const { isLoading } = getState();

    const tableRowProps = parseFromValuesOrFunc(mantineTableBodyRowProps, {
        isDetailPanel: true,
        row,
        table,
    });

    const tableCellProps = {
        ...parseFromValuesOrFunc(mantineDetailPanelProps, {
            row,
            table,
        }),
        ...rest,
    };

    const internalEditComponents = row
        .getAllCells()
        .filter((cell) => cell.column.columnDef.columnDefType === "data")
        .map((cell) => <EditCellTextInput cell={cell} key={cell.id} table={table} />);

    const DetailPanel = !isLoading && row.getIsExpanded() && renderDetailPanel?.({ internalEditComponents, row, table });

    const parentRowHeight = virtualRow ? `${parentRowRef.current?.getBoundingClientRect()?.height}px` : undefined;
    const virtualRowStart = virtualRow ? `${virtualRow.start}px` : undefined;

    return (
        <ShadcnTableRow
            className={clsx(
                "mantine-Table-tr-detail-panel table-row w-full bg-white dark:bg-gray-900",
                layoutMode?.startsWith("grid") && "flex",
                virtualRow && "absolute top-[var(--ano-parent-row-height)] z-10 translate-y-[var(--ano-virtual-row-start)] transition-none",
                tableRowProps?.className,
                className,
            )}
            data-index={renderDetailPanel ? renderedRowIndex * 2 + 1 : renderedRowIndex}
            data-striped={striped}
            ref={(node: HTMLTableRowElement) => {
                if (node) {
                    rowVirtualizer?.measureElement?.(node);
                }
            }}
            style={
                {
                    "--ano-parent-row-height": parentRowHeight,
                    "--ano-virtual-row-start": virtualRowStart,
                    ...tableRowProps?.style,
                    ...style,
                } as React.CSSProperties
            }
        >
            <ShadcnTableCell
                className={clsx(
                    "mantine-Table-td-detail-panel table-cell w-[var(--ano-inner-width)] transition-all duration-150 ease-in-out",
                    layoutMode?.startsWith("grid") && "flex",
                    row.getIsExpanded() && "border-b border-gray-300 dark:border-gray-700",
                    virtualRow && "transition-none",
                    tableCellProps?.className,
                )}
                colSpan={getVisibleLeafColumns().length}
                style={
                    {
                        "--ano-inner-width": `${table.getTotalSize()}px`,
                        ...tableCellProps?.style,
                    } as React.CSSProperties
                }
            >
                {rowVirtualizer ? row.getIsExpanded() && DetailPanel : row.getIsExpanded() && DetailPanel}
            </ShadcnTableCell>
        </ShadcnTableRow>
    );
};
