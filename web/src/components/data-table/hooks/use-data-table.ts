import type { RowData, TableInstance, TableOptions } from "../types";
import useTableInstance from "./use-table-instance";
import { useTableOptions } from "./use-table-options";

export const useDataTable = <TData extends RowData>(tableOptions: TableOptions<TData>): { features: any; table: TableInstance<TData> } => {
    const table = useTableInstance(useTableOptions(tableOptions));

    // Return the expected API structure
    return {
        features: tableOptions.features || {},
        table,
    };
};
