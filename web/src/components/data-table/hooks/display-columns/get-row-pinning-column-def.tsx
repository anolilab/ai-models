import { TableBodyRowPinButton } from "../../components/body/table-body-row-pin-button";
import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";

export const getRowPinningColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    return {
        Cell: ({ row, table }) => <TableBodyRowPinButton row={row} table={table} />,
        grow: false,
        ...defaultDisplayColumnProps({
            header: "pin",
            id: "ano-row-pin",
            size: 60,
            tableOptions,
        }),
    };
};
