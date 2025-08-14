import clsx from "clsx";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { CellValue, Column, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData, TValue = CellValue> {
    className?: string;
    column: Column<TData, TValue>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const FilterCheckbox = <TData extends RowData>({ className, column, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { localization, mantineFilterCheckboxProps },
    } = table;
    const { density } = getState();
    const { columnDef } = column;

    const arg = { column, table };
    const checkboxProps = {
        ...parseFromValuesOrFunc(mantineFilterCheckboxProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterCheckboxProps, arg),
        ...rest,
    };

    const filterLabel = localization.filterByColumn?.replace("{column}", columnDef.header);

    const value = column.getFilterValue();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        checked={value === "true"}
                        className={clsx("ano-filter-checkbox mt-2 font-normal", className)}
                        style={style}
                        {...checkboxProps}
                        onCheckedChange={(checked) => {
                            column.setFilterValue(column.getFilterValue() === undefined ? "true" : column.getFilterValue() === "true" ? "false" : undefined);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            checkboxProps?.onClick?.(e);
                        }}
                    />
                    <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {checkboxProps.title ?? filterLabel}
                    </label>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{checkboxProps?.title ?? filterLabel}</p>
            </TooltipContent>
        </Tooltip>
    );
};
