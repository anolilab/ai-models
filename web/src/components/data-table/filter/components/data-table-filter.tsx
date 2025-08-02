import useIsMobile from "@/hooks/use-is-mobile";

import type { Column, DataTableFilterActions, FiltersState, FilterStrategy } from "../core/types";
import type { Locale } from "../lib/i18n";
import { ActiveFilters, ActiveFiltersMobileContainer } from "./active-filters";
import FilterActions from "./filter-actions";
import { FilterSelector } from "./filter-selector";

interface DataTableFilterProps<TData> {
    actions: DataTableFilterActions;
    columns: Column<TData>[];
    filters: FiltersState;
    locale?: Locale;
    strategy: FilterStrategy;
}

const DataTableFilter = <TData,>({ actions, columns, filters, locale = "en", strategy }: DataTableFilterProps<TData>) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <div className="flex w-full items-start justify-between gap-2">
                <div className="flex gap-1">
                    <FilterSelector actions={actions} columns={columns} filters={filters} locale={locale} strategy={strategy} />
                    <FilterActions actions={actions} hasFilters={filters.length > 0} locale={locale} />
                </div>
                <ActiveFiltersMobileContainer>
                    <ActiveFilters actions={actions} columns={columns} filters={filters} locale={locale} strategy={strategy} />
                </ActiveFiltersMobileContainer>
            </div>
        );
    }

    return (
        <div className="flex w-full items-start justify-between gap-2">
            <div className="flex w-full flex-1 gap-2 md:flex-wrap">
                <FilterSelector actions={actions} columns={columns} filters={filters} locale={locale} strategy={strategy} />
                <ActiveFilters actions={actions} columns={columns} filters={filters} locale={locale} strategy={strategy} />
            </div>

            <FilterActions actions={actions} hasFilters={filters.length > 0} locale={locale} />
        </div>
    );
};

export default DataTableFilter;
