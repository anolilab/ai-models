import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";

export const getRowNumbersColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    const { localization, rowNumberDisplayMode } = tableOptions;
    const {
        pagination: { pageIndex, pageSize },
    } = tableOptions.state;

    return {
        Cell: ({ row, staticRowIndex }) =>
            ((rowNumberDisplayMode === "static" ? (staticRowIndex || 0) + (pageSize || 0) * (pageIndex || 0) : row.index) ?? 0) + 1,
        grow: false,
        Header: () => localization.rowNumber,
        ...defaultDisplayColumnProps({
            header: "rowNumbers",
            id: "ano-row-numbers",
            size: 50,
            tableOptions,
        }),
    };
};
