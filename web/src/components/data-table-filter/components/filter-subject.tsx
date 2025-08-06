import type { FilterSubjectProps } from "../core/types";

const FilterSubject = <TData, TType extends ColumnDataType>({ column }: FilterSubjectProps<TData, TType>) => (
    <div className="flex items-center gap-2">
        <column.icon className="h-4 w-4" />
        <span className="font-medium">{column.displayName}</span>
    </div>
);

export default FilterSubject;
