import type { ColumnDef, RowData, StatefulTableOptions } from "../../types";
import defaultDisplayColumnProps from "../../utils/display-column-utils";
import { DefaultDisplayColumn } from "../use-table-options";

const blankColProps = {
    children: null,
    sx: {
        minWidth: 0,
        p: 0,
        width: 0,
    },
};

export const getRowSpacerColumnDef = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): ColumnDef<TData> => {
    return {
        ...defaultDisplayColumnProps({
            id: "ano-row-spacer",
            size: 0,
            tableOptions,
        }),
        grow: true,
        ...DefaultDisplayColumn,
        tableBodyCellProps: blankColProps,
        tableFooterCellProps: blankColProps,
        tableHeadCellProps: blankColProps,
    };
};
