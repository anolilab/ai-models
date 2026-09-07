import type { ColumnSizingState, PaginationState } from "@tanstack/react-table";

type StatePromise = Promise<URLSearchParams> | undefined;
type SetStateFunction<T> = (value: T | ((prev: T) => T)) => StatePromise;

/**
 * Handler for pagination changes in a data table.
 */
export function createPaginationHandler(
    setPage: SetStateFunction<number>,
    setPageSize: SetStateFunction<number>,
    currentPage: number,
    currentPageSize: number,
) {
    return (updaterOrValue: PaginationState | ((prev: PaginationState) => PaginationState)) => {
        // Handle both direct values and updater functions
        const newPagination = typeof updaterOrValue === "function" ? updaterOrValue({ pageIndex: currentPage - 1, pageSize: currentPageSize }) : updaterOrValue;

        setPage(newPagination.pageIndex + 1);
        setPageSize(newPagination.pageSize);
    };
}

/**
 * Handler for column sizing changes in a data table.
 */
export const createColumnSizingHandler = (setColumnSizing: SetStateFunction<ColumnSizingState>, columnSizing: ColumnSizingState) => (updaterOrValue: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState)) => {
    // Handle both direct values and updater functions
    const newSizing = typeof updaterOrValue === "function" ? updaterOrValue(columnSizing) : updaterOrValue;

    setColumnSizing(newSizing);
};
