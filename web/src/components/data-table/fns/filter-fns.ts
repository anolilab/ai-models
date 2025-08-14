import type { RankingInfo } from "@tanstack/match-sorter-utils";
import { rankings, rankItem } from "@tanstack/match-sorter-utils";
import type { Row } from "@tanstack/react-table";
import { filterFns } from "@tanstack/react-table";

import type { Localization, RowData } from "../types";

const fuzzy = <TData extends RowData>(row: Row<TData>, columnId: string, filterValue: number | string, addMeta: (item: RankingInfo) => void): boolean => {
    const itemRank = rankItem(row.getValue<string | number | null>(columnId), filterValue as string, {
        threshold: rankings.MATCHES,
    });

    addMeta(itemRank);

    return itemRank.passed;
};

fuzzy.autoRemove = (val: any) => !val;

const contains = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    !!row.getValue<number | string | null>(id)?.toString().toLowerCase().trim().includes(filterValue.toString().toLowerCase().trim());

contains.autoRemove = (val: any) => !val;

const startsWith = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    !!row.getValue<number | string | null>(id)?.toString().toLowerCase().trim().startsWith(filterValue.toString().toLowerCase().trim());

startsWith.autoRemove = (val: any) => !val;

const endsWith = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    !!row.getValue<number | string | null>(id)?.toString().toLowerCase().trim().endsWith(filterValue.toString().toLowerCase().trim());

endsWith.autoRemove = (val: any) => !val;

const equals = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    row.getValue<number | string | null>(id)?.toString().toLowerCase().trim() === filterValue.toString().toLowerCase().trim();

equals.autoRemove = (val: any) => !val;

const notEquals = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    row.getValue<number | string | null>(id)?.toString().toLowerCase().trim() !== filterValue.toString().toLowerCase().trim();

notEquals.autoRemove = (val: any) => !val;

const greaterThan = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    (!isNaN(+filterValue) && !isNaN(+row.getValue<number | string>(id))
        ? +(row.getValue<number | string | null>(id) ?? 0) > +filterValue
        : (row.getValue<number | string | null>(id) ?? "")?.toString().toLowerCase().trim() > filterValue.toString().toLowerCase().trim());

greaterThan.autoRemove = (val: any) => !val;

const greaterThanOrEqualTo = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    equals(row, id, filterValue) || greaterThan(row, id, filterValue);

greaterThanOrEqualTo.autoRemove = (val: any) => !val;

const lessThan = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    (!isNaN(+filterValue) && !isNaN(+row.getValue<number | string>(id))
        ? +(row.getValue<number | string | null>(id) ?? 0) < +filterValue
        : (row.getValue<number | string | null>(id) ?? "")?.toString().toLowerCase().trim() < filterValue.toString().toLowerCase().trim());

lessThan.autoRemove = (val: any) => !val;

const lessThanOrEqualTo = <TData extends RowData>(row: Row<TData>, id: string, filterValue: number | string): boolean =>
    equals(row, id, filterValue) || lessThan(row, id, filterValue);

lessThanOrEqualTo.autoRemove = (val: any) => !val;

const between = <TData extends RowData>(row: Row<TData>, id: string, filterValues: [number | string, number | string]): boolean =>
    ((["", undefined] as any[]).includes(filterValues[0]) || greaterThan(row, id, filterValues[0]))
    && ((!isNaN(+filterValues[0]) && !isNaN(+filterValues[1]) && +filterValues[0] > +filterValues[1])
        || (["", undefined] as any[]).includes(filterValues[1])
        || lessThan(row, id, filterValues[1]));

between.autoRemove = (val: any) => !val;

const betweenInclusive = <TData extends RowData>(row: Row<TData>, id: string, filterValues: [number | string, number | string]): boolean =>
    ((["", undefined] as any[]).includes(filterValues[0]) || greaterThanOrEqualTo(row, id, filterValues[0]))
    && ((!isNaN(+filterValues[0]) && !isNaN(+filterValues[1]) && +filterValues[0] > +filterValues[1])
        || (["", undefined] as any[]).includes(filterValues[1])
        || lessThanOrEqualTo(row, id, filterValues[1]));

betweenInclusive.autoRemove = (val: any) => !val;

const empty = <TData extends RowData>(row: Row<TData>, id: string, _filterValue: number | string): boolean =>
    !row.getValue<number | string | null>(id)?.toString().trim();

empty.autoRemove = (val: any) => !val;

const notEmpty = <TData extends RowData>(row: Row<TData>, id: string, _filterValue: number | string): boolean =>
    !!row.getValue<number | string | null>(id)?.toString().trim();

notEmpty.autoRemove = (val: any) => !val;

export const FilterFns = {
    ...filterFns,
    between,
    betweenInclusive,
    contains,
    empty,
    endsWith,
    equals,
    fuzzy,
    greaterThan,
    greaterThanOrEqualTo,
    lessThan,
    lessThanOrEqualTo,
    notEmpty,
    notEquals,
    startsWith,
};

/**
 * Returns a localized string for a filter option.
 * @param localization The localization object
 * @param filterOption The filter option name
 * @returns The localized filter option string
 */
export const localizedFilterOption = (localization: Localization, filterOption: string): string => {
    switch (filterOption) {
        case "between":
            return localization.filterFns?.between ?? "Between";
        case "betweenInclusive":
            return localization.filterFns?.betweenInclusive ?? "Between (inclusive)";
        case "contains":
            return localization.filterFns?.contains ?? "Contains";
        case "empty":
            return localization.filterFns?.empty ?? "Empty";
        case "endsWith":
            return localization.filterFns?.endsWith ?? "Ends with";
        case "equals":
            return localization.filterFns?.equals ?? "Equals";
        case "fuzzy":
            return localization.filterFns?.fuzzy ?? "Fuzzy";
        case "greaterThan":
            return localization.filterFns?.greaterThan ?? "Greater than";
        case "greaterThanOrEqualTo":
            return localization.filterFns?.greaterThanOrEqualTo ?? "Greater than or equal to";
        case "lessThan":
            return localization.filterFns?.lessThan ?? "Less than";
        case "lessThanOrEqualTo":
            return localization.filterFns?.lessThanOrEqualTo ?? "Less than or equal to";
        case "notEmpty":
            return localization.filterFns?.notEmpty ?? "Not empty";
        case "notEquals":
            return localization.filterFns?.notEquals ?? "Not equals";
        case "startsWith":
            return localization.filterFns?.startsWith ?? "Starts with";
        default:
            return filterOption;
    }
};
