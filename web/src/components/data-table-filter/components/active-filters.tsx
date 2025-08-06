import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { Column, ColumnDataType, DataTableFilterActions, FilterModel, FiltersState, FilterStrategy } from "../core/types";
import { getColumn } from "../lib/helpers";
import type { Locale } from "../lib/i18n";
import { FilterOperator } from "./filter-operator";
import FilterSubject from "./filter-subject";
import { FilterValue } from "./filter-value";

interface ActiveFiltersProps<TData> {
    actions: DataTableFilterActions;
    columns: Column<TData>[];
    filters: FiltersState;
    locale?: Locale;
    strategy: FilterStrategy;
}

interface ActiveFilterProps<TData, TType extends ColumnDataType> {
    actions: DataTableFilterActions;
    column: Column<TData, TType>;
    filter: FilterModel<TType>;
    locale?: Locale;
    strategy: FilterStrategy;
}

export const ActiveFilters = <TData,>({ actions, columns, filters, locale = "en", strategy }: ActiveFiltersProps<TData>) => (
    <>
        {filters.map((filter) => {
            const id = filter.columnId;

            const column = getColumn(columns, id);

            // Skip if no filter value
            if (!filter.values) {
                return null;
            }

            return (
                <ActiveFilter actions={actions} column={column} filter={filter} key={`active-filter-${filter.columnId}`} locale={locale} strategy={strategy} />
            );
        })}
    </>
);

// Generic render function for a filter with type-safe value
export const ActiveFilter = <TData, TType extends ColumnDataType>({ actions, column, filter, locale = "en", strategy }: ActiveFilterProps<TData, TType>) => (
    <div className="border-border bg-background flex items-center border text-xs shadow-xs">
        <FilterSubject column={column} />
        <Separator orientation="vertical" />
        <FilterOperator actions={actions} column={column} filter={filter} locale={locale} />
        <Separator orientation="vertical" />
        <FilterValue actions={actions} column={column} filter={filter} locale={locale} strategy={strategy} />
        <Separator orientation="vertical" />
        <Button className="h-full text-xs" onClick={() => actions.removeFilter(filter.columnId)} variant="ghost">
            <X className="size-4" />
        </Button>
    </div>
);

export const ActiveFiltersMobileContainer = ({ children }: { children: React.ReactNode }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftBlur, setShowLeftBlur] = useState(false);
    const [showRightBlur, setShowRightBlur] = useState(true);

    // Check if there's content to scroll and update blur states
    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { clientWidth, scrollLeft, scrollWidth } = scrollContainerRef.current;

            // Show left blur if scrolled to the right
            setShowLeftBlur(scrollLeft > 0);

            // Show right blur if there's more content to scroll to the right
            // Add a small buffer (1px) to account for rounding errors
            setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        if (scrollContainerRef.current) {
            const resizeObserver = new ResizeObserver(() => {
                checkScroll();
            });

            resizeObserver.observe(scrollContainerRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, []);

    // Update blur states when children change
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        checkScroll();
    }, [children]);

    return (
        <div className="relative w-full overflow-x-hidden">
            {/* Left blur effect */}
            {showLeftBlur && (
                <div className="from-background animate-in fade-in-0 pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent" />
            )}

            {/* Scrollable container */}
            <div className="no-scrollbar flex gap-2 overflow-x-scroll" onScroll={checkScroll} ref={scrollContainerRef}>
                {children}
            </div>

            {/* Right blur effect */}
            {showRightBlur && (
                <div className="from-background animate-in fade-in-0 pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-16 bg-gradient-to-l to-transparent" />
            )}
        </div>
    );
};
