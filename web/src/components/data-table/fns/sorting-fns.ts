import type { RankingInfo } from "@tanstack/match-sorter-utils";
import { compareItems } from "@tanstack/match-sorter-utils";
import type { Row as TanStackRow } from "@tanstack/react-table";
import { sortingFns } from "@tanstack/react-table";

import type { Row, RowData } from "../types";

const fuzzy = <TData extends RowData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
    let dir = 0;

    if (rowA.columnFiltersMeta[columnId]) {
        dir = compareItems(rowA.columnFiltersMeta[columnId] as RankingInfo, rowB.columnFiltersMeta[columnId] as RankingInfo);
    }

    // Provide a fallback for when the item ranks are equal
    return dir === 0 ? sortingFns.alphanumeric(rowA as TanStackRow<any>, rowB as TanStackRow<any>, columnId) : dir;
};

export const SortingFns = {
    ...sortingFns,
    fuzzy,
};

export const rankGlobalFuzzy = <TData extends RowData>(rowA: Row<TData>, rowB: Row<TData>) =>
    Math.max(...Object.values(rowB.columnFiltersMeta).map((v: any) => v.rank)) - Math.max(...Object.values(rowA.columnFiltersMeta).map((v: any) => v.rank));
