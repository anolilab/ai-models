import { SelectCheckbox } from "../../components/inputs/select-checkbox";
import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";

export const getRowSelectColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    const { enableMultiRowSelection, enableSelectAll } = tableOptions;

    return {
        Cell: ({ row, staticRowIndex, table }) => <SelectCheckbox row={row} staticRowIndex={staticRowIndex} table={table} />,
        grow: false,
        Header: enableSelectAll && enableMultiRowSelection ? ({ table }) => <SelectCheckbox table={table} /> : undefined,
        ...defaultDisplayColumnProps({
            header: "select",
            id: "ano-row-select",
            size: enableSelectAll ? 60 : 70,
            tableOptions,
        }),
    };
};
