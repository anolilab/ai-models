import { isBefore } from "date-fns";

import type { Column, ColumnOption } from "../core/types";

export const getColumn = <TData>(columns: Column<TData>[], id: string) => {
    const column = columns.find((c) => c.id === id);

    if (!column) {
        throw new Error(`Column with id ${id} not found`);
    }

    return column;
};

export const createNumberFilterValue = (values: number[] | undefined): number[] => {
    if (!values || values.length === 0)
        return [];

    if (values.length === 1)
        return [values[0]];

    if (values.length === 2)
        return createNumberRange(values);

    return [values[0], values[1]];
};

export const createDateFilterValue = (values: [Date, Date] | [Date] | [] | undefined) => {
    if (!values || values.length === 0)
        return [];

    if (values.length === 1)
        return [values[0]];

    if (values.length === 2)
        return createDateRange(values);

    throw new Error("Cannot create date filter value from more than 2 values");
};

export const createDateRange = (values: [Date, Date]) => {
    const [a, b] = values;
    const [min, max] = isBefore(a, b) ? [a, b] : [b, a];

    return [min, max];
};

export const createNumberRange = (values: number[] | undefined) => {
    let a = 0;
    let b = 0;

    if (!values || values.length === 0)
        return [a, b];

    if (values.length === 1) {
        a = values[0];
    } else {
        a = values[0];
        b = values[1];
    }

    const [min, max] = a < b ? [a, b] : [b, a];

    return [min, max];
};

export const isColumnOption = (value: unknown): value is ColumnOption => typeof value === "object" && value !== null && "value" in value && "label" in value;

export const isColumnOptionArray = (value: unknown): value is ColumnOption[] => Array.isArray(value) && value.every(isColumnOption);

export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === "string");

export const isColumnOptionMap = (value: unknown): value is Map<string, number> => {
    if (!(value instanceof Map)) {
        return false;
    }

    for (const key of value.keys()) {
        if (typeof key !== "string") {
            return false;
        }
    }

    for (const val of value.values()) {
        if (typeof val !== "number") {
            return false;
        }
    }

    return true;
};

export const isMinMaxTuple = (value: unknown): value is [number, number] => Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
