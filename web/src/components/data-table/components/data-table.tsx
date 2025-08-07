import { useDataTable } from "../hooks/use-data-table";
import type { RowData, TableInstance, TableOptions } from "../types";
import { TablePaper } from "./table";

type TableInstanceProp<TData extends RowData> = {
    table: TableInstance<TData>;
    features?: any;
};

type Props<TData extends RowData> = TableInstanceProp<TData> | TableOptions<TData>;

const isTableInstanceProp = <TData extends RowData>(props: Props<TData>): props is TableInstanceProp<TData> => "table" in props && props.table !== undefined;

const DataTable = <TData extends RowData>(props: Props<TData>) => {
    let table: TableInstance<TData>;
    let features: any = {};

    if (isTableInstanceProp(props)) {
        table = props.table;
        features = props.features || {};
    } else {
        const result = useDataTable(props);
        table = result.table;
        features = result.features;
    }

    return <TablePaper features={features} table={table} />;
};

export { DataTable };
