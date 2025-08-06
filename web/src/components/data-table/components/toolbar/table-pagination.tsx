import clsx from "clsx";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

const defaultRowsPerPage = [5, 10, 15, 20, 25, 30, 50, 100].map((x) => x.toString());

interface Props<TData extends RowData> {
    className?: string;
    position?: "bottom" | "top";
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TablePagination = <TData extends RowData>({ className, position = "bottom", style, table, ...props }: Props<TData>) => {
    const {
        getPrePaginationRowModel,
        getState,
        options: { enableToolbarInternalActions, localization, mantinePaginationProps, paginationDisplayMode, rowCount },
        setPageIndex,
        setPageSize,
    } = table;
    const {
        pagination: { pageIndex = 0, pageSize = 10 },
        showGlobalFilter,
    } = getState();

    const paginationProps = {
        ...parseFromValuesOrFunc(mantinePaginationProps, {
            table,
        }),
        ...props,
    };

    const totalRowCount = rowCount ?? getPrePaginationRowModel().rows.length;
    const numberOfPages = Math.ceil(totalRowCount / pageSize);
    const showFirstLastPageButtons = numberOfPages > 2;
    const firstRowIndex = pageIndex * pageSize;
    const lastRowIndex = Math.min(pageIndex * pageSize + pageSize, totalRowCount);

    const { rowsPerPageOptions = defaultRowsPerPage, showRowsPerPage = true, withEdges = showFirstLastPageButtons, ...rest } = paginationProps ?? {};

    const needsTopMargin = position === "top" && enableToolbarInternalActions && !showGlobalFilter;

    return (
        <div
            className={clsx("ano-table-pagination z-10 flex items-center justify-between gap-6 pt-1 pr-2 pb-1 pl-2", needsTopMargin && "mt-12", className)}
            style={style}
        >
            {paginationProps?.showRowsPerPage !== false && (
                <div className="flex items-center gap-2">
                    <span id="rpp-label">{localization.rowsPerPage}</span>
                    <Select onValueChange={(value: string) => setPageSize(+value)} value={pageSize.toString()}>
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(paginationProps?.rowsPerPageOptions ?? defaultRowsPerPage).map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {paginationDisplayMode === "pages"
                ? (
                <div className="flex items-center gap-2">
                    {withEdges && (
                        <Button aria-label={localization.goToFirstPage} disabled={pageIndex <= 0} onClick={() => setPageIndex(0)} size="sm" variant="ghost">
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        aria-label={localization.goToPreviousPage}
                        disabled={pageIndex <= 0}
                        onClick={() => setPageIndex(pageIndex - 1)}
                        size="sm"
                        variant="ghost"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        {pageIndex + 1} of {numberOfPages}
                    </span>
                    <Button
                        aria-label={localization.goToNextPage}
                        disabled={pageIndex >= numberOfPages - 1}
                        onClick={() => setPageIndex(pageIndex + 1)}
                        size="sm"
                        variant="ghost"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    {withEdges && (
                        <Button
                            aria-label={localization.goToLastPage}
                            disabled={pageIndex >= numberOfPages - 1}
                            onClick={() => setPageIndex(numberOfPages - 1)}
                            size="sm"
                            variant="ghost"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                )
                : paginationDisplayMode === "default"
                    ? (
                <>
                    <span className="text-sm">{`${lastRowIndex === 0 ? 0 : (firstRowIndex + 1).toLocaleString()}-${lastRowIndex.toLocaleString()} ${
                        localization.of
                    } ${totalRowCount.toLocaleString()}`}</span>
                    <div className="flex items-center gap-1">
                        {withEdges && (
                            <Button aria-label={localization.goToFirstPage} disabled={pageIndex <= 0} onClick={() => setPageIndex(0)} size="sm" variant="ghost">
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            aria-label={localization.goToPreviousPage}
                            disabled={pageIndex <= 0}
                            onClick={() => setPageIndex(pageIndex - 1)}
                            size="sm"
                            variant="ghost"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            aria-label={localization.goToNextPage}
                            disabled={lastRowIndex >= totalRowCount}
                            onClick={() => setPageIndex(pageIndex + 1)}
                            size="sm"
                            variant="ghost"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        {withEdges && (
                            <Button
                                aria-label={localization.goToLastPage}
                                disabled={lastRowIndex >= totalRowCount}
                                onClick={() => setPageIndex(numberOfPages - 1)}
                                size="sm"
                                variant="ghost"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </>
                    )
                    : null}
        </div>
    );
};
