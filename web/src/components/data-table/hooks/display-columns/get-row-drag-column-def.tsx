import type { RefObject } from "react";

import { TableBodyRowGrabHandle } from "../../components/body/table-body-row-grab-handle";
import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";

export const getRowDragColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    return {
        Cell: ({ row, rowRef, table }) => <TableBodyRowGrabHandle row={row} rowRef={rowRef as RefObject<HTMLTableRowElement | null>} table={table} />,
        grow: false,
        ...defaultDisplayColumnProps({
            header: "move",
            id: "ano-row-drag",
            size: 60,
            tableOptions,
        }),
    };
};
