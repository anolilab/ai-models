import { ToggleRowActionMenuButton } from "../../components/buttons/toggle-row-action-menu-button";
import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";

export const getRowActionsColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    return {
        Cell: ({ cell, row, staticRowIndex, table }) => <ToggleRowActionMenuButton cell={cell} row={row} staticRowIndex={staticRowIndex} table={table} />,
        ...defaultDisplayColumnProps({
            header: "actions",
            id: "ano-row-actions",
            size: 70,
            tableOptions,
        }),
    };
};
