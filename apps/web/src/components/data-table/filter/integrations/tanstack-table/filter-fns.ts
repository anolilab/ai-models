import type { Row } from "@tanstack/react-table";

import type { FilterModel } from "../../core/types";
import { dateFilterFn as f_dateFilterFn, numberFilterFn as f_numberFilterFn, textFilterFn as f_textFilterFn } from "../../lib/filter-fns";

export function dateFilterFn<TData>(row: Row<TData>, columnId: string, filterValue: FilterModel<"date">): boolean {
    const value = row.getValue<Date>(columnId);

    return f_dateFilterFn(value, filterValue);
}

export function textFilterFn<TData>(row: Row<TData>, columnId: string, filterValue: FilterModel<"text">): boolean {
    const value = row.getValue<string>(columnId) ?? "";

    return f_textFilterFn(value, filterValue);
}

export function numberFilterFn<TData>(row: Row<TData>, columnId: string, filterValue: FilterModel<"number">): boolean {
    const value = row.getValue<number>(columnId);

    return f_numberFilterFn(value, filterValue);
}
