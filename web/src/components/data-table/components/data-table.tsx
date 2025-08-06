import { useDataTable } from "../hooks/use-data-table";
import type { RowData, TableInstance, TableOptions } from "../types";
import { TablePaper } from "./table/table-paper";

type TableInstanceProp<TData extends RowData> = {
    table: TableInstance<TData>;
};

type Props<TData extends RowData> = TableInstanceProp<TData> | TableOptions<TData>;

const isTableInstanceProp = <TData extends RowData>(props: Props<TData>): props is TableInstanceProp<TData> => "table" in props && props.table !== undefined;

const DataTable = <TData extends RowData>(props: Props<TData>) => {
    let table: TableInstance<TData>;

    if (isTableInstanceProp(props)) {
        table = props.table;
    } else {
        table = useDataTable(props);
    }

    return <TablePaper table={table} />;
};

export { DataTable };
