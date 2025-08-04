import type { JSX } from "react";

import type { ColumnDataType, FilterSubjectProperties } from "../core/types";

const FilterSubject = <TData, TType extends ColumnDataType>({ column }: FilterSubjectProperties<TData, TType>): JSX.Element => (
    <div className="flex items-center gap-2 px-2">
        <column.icon className="size-3" />
        <span className="font-medium">{column.displayName}</span>
    </div>
);

export default FilterSubject;
