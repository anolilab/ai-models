import { useMemo } from "react";

import type { Row, RowData, TableInstance } from "../types";
import { getRows } from "../utils/row-utils";

export const useRows = <TData extends RowData>(table: TableInstance<TData>): Row<TData>[] => {
    const {
        getRowModel,
        getState,
        options: { data, enableGlobalFilterRankedResults, positionCreatingRow },
    } = table;
    const { creatingRow, expanded, globalFilter, pagination, rowPinning, sorting } = getState();

    const rows = useMemo(
        () => getRows(table),
        [
            creatingRow,
            data,
            enableGlobalFilterRankedResults,
            expanded,
            getRowModel().rows,
            globalFilter,
            pagination.pageIndex,
            pagination.pageSize,
            positionCreatingRow,
            rowPinning,
            sorting,
        ],
    );

    return rows;
};
