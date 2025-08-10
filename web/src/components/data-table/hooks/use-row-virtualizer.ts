import type { Range } from "@tanstack/react-virtual";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo } from "react";

import type { Row, RowData, RowVirtualizer, TableInstance } from "../types";
import { parseFromValuesOrFunc } from "../utils/utils";
import { extraIndexRangeExtractor } from "../utils/virtualization-utils";

export const useRowVirtualizer = <
    TData extends RowData,
    TScrollElement extends Element | Window = HTMLDivElement,
    TItemElement extends Element = HTMLTableRowElement,
>(
    table: TableInstance<TData>,
    rows?: Row<TData>[],
): RowVirtualizer<TScrollElement, TItemElement> | undefined => {
    const {
        getRowModel,
        getState,
        options: { enableRowVirtualization, renderDetailPanel, rowVirtualizerInstanceRef, rowVirtualizerOptions },
        refs: { tableContainerRef },
    } = table;
    const { density, draggingRow, expanded } = getState();

    if (!enableRowVirtualization)
        return undefined;

    const rowVirtualizerProps = parseFromValuesOrFunc(rowVirtualizerOptions, {
        table,
    });

    const realRows = rows ?? getRowModel().rows;

    /**
     * when filtering, should find the correct index in filtered rows
     */
    const draggingRowIndex = useMemo(() => (draggingRow?.id ? realRows.findIndex((r) => r.id === draggingRow?.id) : undefined), [realRows, draggingRow?.id]);

    const rowCount = realRows.length;

    const normalRowHeight = density === "compact" ? 37 : density === "comfortable" ? 58 : 73;

    const rowVirtualizer = useVirtualizer({
        count: renderDetailPanel ? rowCount * 2 : rowCount,
        estimateSize: (index) => (renderDetailPanel && index % 2 === 1 ? (expanded === true ? 100 : 0) : normalRowHeight),
        getScrollElement: () => tableContainerRef.current,
        measureElement:
            typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1 ? (element) => element?.getBoundingClientRect().height : undefined,
        overscan: 5, // ✅ IMPROVED: Increased overscan for better scrolling
        rangeExtractor: useCallback((range: Range) => extraIndexRangeExtractor(range, draggingRowIndex), [draggingRowIndex]),
        scrollMargin: 0,
        initialOffset: 0,
        ...rowVirtualizerProps,
    }) as unknown as RowVirtualizer<TScrollElement, TItemElement>;

    rowVirtualizer.virtualRows = rowVirtualizer.getVirtualItems() as any;

    if (rowVirtualizerInstanceRef) {
        // @ts-expect-error
        rowVirtualizerInstanceRef.current = rowVirtualizer;
    }

    return rowVirtualizer;
};
