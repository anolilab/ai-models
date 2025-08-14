import clsx from "clsx";

import type { Header, RowData, TableInstance } from "../../types";
import { FilterTextInput } from "./filter-text-input";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const FilterRangeFields = <TData extends RowData>({ className, header, style, table, ...rest }: Props<TData>) => (
    <div {...rest} className={clsx("ano-filter-range-fields grid grid-cols-2 gap-4", className)} style={style}>
        <FilterTextInput header={header} rangeFilterIndex={0} table={table} />
        <FilterTextInput header={header} rangeFilterIndex={1} table={table} />
    </div>
);
