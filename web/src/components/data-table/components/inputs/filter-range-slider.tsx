import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { Slider } from "@/components/ui/slider";

import type { Header, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    header: Header<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const FilterRangeSlider = <TData extends RowData>({ className, header, style, table, ...rest }: Props<TData>) => {
    const {
        options: { mantineFilterRangeSliderProps },
        refs: { filterInputRefs },
    } = table;
    const { column } = header;
    const { columnDef } = column;

    const arg = { column, table };
    const rangeSliderProps = {
        ...parseFromValuesOrFunc(mantineFilterRangeSliderProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineFilterRangeSliderProps, arg),
        className,
        style,
        ...rest,
    };

    let [min, max]
        = rangeSliderProps.min !== undefined && rangeSliderProps.max !== undefined
            ? [rangeSliderProps.min, rangeSliderProps.max]
            : column.getFacetedMinMaxValues() ?? [0, 1];

    // fix potential TanStack Table bugs where min or max is an array
    if (Array.isArray(min))
        min = min[0];

    if (Array.isArray(max))
        max = max[0];

    if (min === null)
        min = 0;

    if (max === null)
        max = 1;

    const [filterValues, setFilterValues] = useState<[number, number]>([min, max]);
    const columnFilterValue = column.getFilterValue() as [number, number] | undefined;

    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current) {
            if (columnFilterValue === undefined) {
                setFilterValues([min, max]);
            } else if (Array.isArray(columnFilterValue)) {
                setFilterValues(columnFilterValue);
            }
        }

        isMounted.current = true;
    }, [columnFilterValue, min, max]);

    return (
        <Slider
            className={clsx("ano-filter-range-slider mx-auto mt-4 mb-1.5 w-[calc(100%-8px)]")}
            max={max}
            min={min}
            onValueChange={(values) => {
                if (Array.isArray(values) && values.length === 2) {
                    setFilterValues(values as [number, number]);
                }
            }}
            onValueCommit={(values) => {
                if (Array.isArray(values) && values.length === 2) {
                    if (values[0] <= min && values[1] >= max) {
                        // if the user has selected the entire range, remove the filter
                        column.setFilterValue(undefined);
                    } else {
                        column.setFilterValue(values as [number, number]);
                    }
                }
            }}
            step={rangeSliderProps.step || 1}
            value={filterValues}
            {...rangeSliderProps}
            ref={(node) => {
                if (node) {
                    // @ts-ignore
                    filterInputRefs.current[`${column.id}-0`] = node;

                    // @ts-ignore
                    if (rangeSliderProps?.ref) {
                        // @ts-ignore
                        rangeSliderProps.ref = node;
                    }
                }
            }}
        />
    );
};
