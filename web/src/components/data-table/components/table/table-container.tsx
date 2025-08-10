import clsx from "clsx";
import { useEffect, useLayoutEffect, useState } from "react";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { EditRowModal } from "../modals/edit-row-modal";
import { Table } from "./table";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableContainer = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options,
        refs: { bottomToolbarRef, tableContainerRef, topToolbarRef },
    } = table;
    const state = getState();

    const [totalToolbarHeight, setTotalToolbarHeight] = useState(0);

    const tableContainerProps = {
        ...parseFromValuesOrFunc((options as any).mantineTableContainerProps, { table }),
        ...rest,
    };
    // const loadingOverlayProps = parseFromValuesOrFunc((options as any).mantineLoadingOverlayProps, { table });

    useIsomorphicLayoutEffect(() => {
        const topToolbarHeight = typeof document !== "undefined" ? topToolbarRef.current?.offsetHeight ?? 0 : 0;

        const bottomToolbarHeight = typeof document !== "undefined" ? bottomToolbarRef?.current?.offsetHeight ?? 0 : 0;

        setTotalToolbarHeight(topToolbarHeight + bottomToolbarHeight);
    });

    // Debug listeners to diagnose scroll-edge reload/navigation issues
    useEffect(() => {
        const el = tableContainerRef.current;
        if (!el) return;

        const debugPrefix = "[DataTableScroll]";

        const onScroll = (evt?: Event) => {
            const { scrollLeft, scrollTop, clientWidth, clientHeight, scrollWidth, scrollHeight } = el;
            const atStartX = scrollLeft <= 0;
            const atEndX = Math.ceil(scrollLeft + clientWidth) >= Math.floor(scrollWidth);
            const atStartY = scrollTop <= 0;
            const atEndY = Math.ceil(scrollTop + clientHeight) >= Math.floor(scrollHeight);
            // eslint-disable-next-line no-console
            console.debug(
                debugPrefix,
                "scroll",
                { scrollLeft, scrollTop, clientWidth, clientHeight, scrollWidth, scrollHeight, atStartX, atEndX, atStartY, atEndY },
            );
            table.options?.onTableContainerScroll?.({ element: el, event: evt as Event, table });
        };

        const onWheel = (e: WheelEvent) => {
            const { scrollLeft, clientWidth, scrollWidth } = el;
            const atStartX = scrollLeft <= 0;
            const atEndX = Math.ceil(scrollLeft + clientWidth) >= Math.floor(scrollWidth);
            // eslint-disable-next-line no-console
            console.debug(
                debugPrefix,
                "wheel",
                { deltaX: e.deltaX, deltaY: e.deltaY, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, atStartX, atEndX },
            );
        };

        const onTouchStart = (touchEvent: TouchEvent) => {
            // eslint-disable-next-line no-console
            console.debug(debugPrefix, "touchstart", { touches: touchEvent.touches.length });
        };

        const onTouchMove = (_e: TouchEvent) => {
            const { scrollLeft, clientWidth, scrollWidth } = el;
            const atStartX = scrollLeft <= 0;
            const atEndX = Math.ceil(scrollLeft + clientWidth) >= Math.floor(scrollWidth);
            // eslint-disable-next-line no-console
            console.debug(debugPrefix, "touchmove", { atStartX, atEndX });
        };

        const onTouchEnd = () => {
            // eslint-disable-next-line no-console
            console.debug(debugPrefix, "touchend");
        };

        const onPopState = () => {
            // eslint-disable-next-line no-console
            console.debug(debugPrefix, "popstate (navigation) detected");
        };

        const onVisibility = () => {
            // eslint-disable-next-line no-console
            console.debug(debugPrefix, "visibilitychange", { hidden: document.hidden });
        };

        el.addEventListener("scroll", onScroll as EventListener, { passive: true });
        el.addEventListener("wheel", onWheel, { passive: true });
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
        window.addEventListener("popstate", onPopState);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            el.removeEventListener("scroll", onScroll as EventListener);
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("popstate", onPopState);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [tableContainerRef]);

    const createModalOpen = (options as any).createDisplayMode === "modal" && (state as any).creatingRow;
    const editModalOpen = (options as any).editDisplayMode === "modal" && (state as any).editingRow;
    const isFullScreen = (state as any).isFullScreen;
    const isLoading = (state as any).isLoading;
    const showLoadingOverlay = (state as any).showLoadingOverlay;
    const enableStickyHeader = (options as any).enableStickyHeader;

    // ✅ FIXED: Get virtualization height from table options
    const virtualizationHeight = (options as any).enableRowVirtualization ? 
        (options as any).rowVirtualizerOptions?.containerHeight || 600 : undefined;

    return (
        <div
            {...tableContainerProps}
            className={clsx(
                "ano-table-container relative max-w-full overflow-auto bg-white dark:bg-gray-900",
                enableStickyHeader && "max-h-[clamp(350px,calc(100vh-calc(var(--ano-top-toolbar-height)*1px)),9999px)]",
                isFullScreen && "max-h-[calc(100vh-calc(var(--ano-top-toolbar-height)*1px))]",
                className,
            )}
            ref={(node: HTMLDivElement) => {
                if (node) {
                    tableContainerRef.current = node;

                    if (tableContainerProps?.ref) {
                        // @ts-ignore
                        tableContainerProps.ref.current = node;
                    }
                }
            }}
            style={{
                "--ano-top-toolbar-height": `${totalToolbarHeight}`,
                // ✅ FIXED: Set explicit height for virtualization
                height: virtualizationHeight ? `${virtualizationHeight}px` : undefined,
                // ✅ Prevent browser back/forward or pull-to-refresh when reaching scroll edges
                overscrollBehaviorX: "contain",
                overscrollBehaviorY: "contain",
                touchAction: "pan-x pan-y",
                ...style,
            }}
        >
            {(isLoading || showLoadingOverlay) && (
                <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        <span className="text-muted-foreground text-sm">Loading...</span>
                    </div>
                </div>
            )}
            <Table table={table} />
            {(createModalOpen || editModalOpen) && <EditRowModal open table={table} />}
        </div>
    );
};
