import type { ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import cn from "@/lib/utils";

import { ExpandAllButton } from "../../components/buttons/expand-all-button";
import { ExpandButton } from "../../components/buttons/expand-button";
import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";

export const getRowExpandColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    const {
        defaultColumn,
        enableExpandAll,
        groupedColumnMode,
        positionExpandColumn,
        renderDetailPanel,
        state: { grouping },
    } = tableOptions;

    const alignProps
        = positionExpandColumn === "last"
            ? ({
                align: "right",
            } as const)
            : undefined;

    return {
        Cell: ({ cell, column, row, staticRowIndex, table }) => {
            const expandButtonProps = { row, staticRowIndex, table };
            const subRowsLength = row.subRows?.length;

            if (groupedColumnMode === "remove" && row.groupingColumnId) {
                return (
                    <div className={cn("flex items-center gap-1")}>
                        <ExpandButton {...expandButtonProps} />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>{row.groupingValue as ReactNode}</span>
                            </TooltipTrigger>
                            <TooltipContent>{table.getColumn(row.groupingColumnId).columnDef.header}</TooltipContent>
                        </Tooltip>
                        {!!subRowsLength && <span>({subRowsLength})</span>}
                    </div>
                );
            }

            return (
                <>
                    <ExpandButton {...expandButtonProps} />
                    {column.columnDef.GroupedCell?.({ cell, column, row, table })}
                </>
            );
        },
        Header: enableExpandAll
            ? ({ table }) => (
                  <>
                      <ExpandAllButton table={table} />
                      {groupedColumnMode === "remove" && grouping?.map((groupedColumnId) => table.getColumn(groupedColumnId).columnDef.header)?.join(", ")}
                  </>
            )
            : undefined,
        tableBodyCellProps: alignProps,
        tableHeadCellProps: alignProps,
        ...defaultDisplayColumnProps({
            header: "expand",
            id: "ano-row-expand",
            size: groupedColumnMode === "remove" ? defaultColumn?.size ?? 180 : renderDetailPanel ? enableExpandAll ? 60 : 70 : 100,
            tableOptions,
        }),
    };
};
