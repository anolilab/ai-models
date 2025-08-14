import { ArrowRightIcon, ChevronRightIcon, FilterIcon } from "lucide-react";
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import cn from "@/lib/utils";

import type { Column, ColumnDataType, DataTableFilterActions, FiltersState, FilterStrategy } from "../core/types";
import { isAnyOf } from "../lib/array";
import { getColumn } from "../lib/helpers";
import type { Locale } from "../lib/i18n";
import { t } from "../lib/i18n";
import { FilterValueController } from "./filter-value";

interface FilterSelectorProps<TData> {
    actions: DataTableFilterActions;
    columns: Column<TData>[];
    filters: FiltersState;
    locale?: Locale;
    strategy: FilterStrategy;
}

const FilterSelectorElement = ({ actions, columns, filters, locale = "en", strategy }: FilterSelectorProps<TData>) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [property, setProperty] = useState<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    const column = property ? getColumn(columns, property) : undefined;
    const filter = property ? filters.find((f) => f.columnId === property) : undefined;

    const hasFilters = filters.length > 0;

    useEffect(() => {
        if (property && inputRef) {
            inputRef.current?.focus();
            setValue("");
        }
    }, [property]);

    useEffect(() => {
        if (!open)
            setTimeout(() => setValue(""), 150);
    }, [open]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: need filters to be updated
    const content = useMemo(
        () =>
            (property && column
                ? (
                <FilterValueController
                    actions={actions}
                    column={column as Column<TData, ColumnDataType>}
                    filter={filter!}
                    locale={locale}
                    strategy={strategy}
                />
                )
                : (
                <Command
                    filter={(value, search, keywords) => {
                        const extendValue = `${value} ${keywords?.join(" ")}`;

                        return extendValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                    }}
                    loop
                >
                    <CommandInput onValueChange={setValue} placeholder={t("search", locale)} ref={inputRef} value={value} />
                    <CommandEmpty>{t("noresults", locale)}</CommandEmpty>
                    <CommandList className="max-h-fit">
                        <CommandGroup>
                            {columns.map((column) => (
                                <FilterableColumn column={column} key={column.id} setProperty={setProperty} />
                            ))}
                            <QuickSearchFilters actions={actions} columns={columns} filters={filters} search={value} />
                        </CommandGroup>
                    </CommandList>
                </Command>
                )),
        [property, column, filter, filters, columns, actions, value],
    );

    return (
        <Popover
            onOpenChange={async (value) => {
                setOpen(value);

                if (!value)
                    setTimeout(() => setProperty(undefined), 100);
            }}
            open={open}
        >
            <PopoverTrigger asChild>
                <Button className={cn(hasFilters && "w-fit")} variant="outline">
                    <FilterIcon className="size-4" />
                    {!hasFilters && <span>{t("filter", locale)}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-fit origin-(--radix-popover-content-transform-origin) p-0" side="bottom">
                {content}
            </PopoverContent>
        </Popover>
    );
};

interface QuickSearchFiltersProps<TData> {
    actions: DataTableFilterActions;
    columns: Column<TData>[];
    filters: FiltersState;
    search?: string;
}

const QuickSearchFiltersElement = <TData,>({ actions, columns, filters, search }: QuickSearchFiltersProps<TData>) => {
    if (!search || search.trim().length < 2) {
        return null;
    }

    const cols = useMemo(() => columns.filter((c) => isAnyOf<ColumnDataType>(c.type, ["option", "multiOption"])), [columns]);

    return (
        <>
            {cols.map((column) => {
                const filter = filters.find((f) => f.columnId === column.id);
                const options = column.getOptions();
                const optionsCount = column.getFacetedUniqueValues();

                const handleOptionSelect = (value: string, check: boolean) => {
                    if (check)
                        actions.addFilterValue(column, [value]);
                    else actions.removeFilterValue(column, [value]);
                };

                return (
                    <Fragment key={column.id}>
                        {options.map((v) => {
                            const checked = Boolean(filter?.values.includes(v.value));
                            const count = optionsCount?.get(v.value) ?? 0;

                            return (
                                <CommandItem
                                    className="group"
                                    key={v.value}
                                    keywords={[v.label, v.value]}
                                    onSelect={() => {
                                        handleOptionSelect(v.value, !checked);
                                    }}
                                    value={v.value}
                                >
                                    <div className="group flex items-center gap-1.5">
                                        <Checkbox
                                            checked={checked}
                                            className="dark:border-ring mr-1 opacity-0 group-data-[selected=true]:opacity-100 data-[state=checked]:opacity-100"
                                        />
                                        <div className="flex w-4 items-center justify-center">
                                            {v.icon && (isValidElement(v.icon) ? v.icon : <v.icon className="text-primary size-4" />)}
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <span className="text-muted-foreground">{column.displayName}</span>
                                            <ChevronRightIcon className="text-muted-foreground/75 size-3.5" />
                                            <span>
                                                {v.label}
                                                <sup
                                                    className={cn(
                                                        !optionsCount && "hidden",
                                                        "text-muted-foreground ml-0.5 tracking-tight tabular-nums",
                                                        count === 0 && "slashed-zero",
                                                    )}
                                                >
                                                    {count < 100 ? count : "100+"}
                                                </sup>
                                            </span>
                                        </div>
                                    </div>
                                </CommandItem>
                            );
                        })}
                    </Fragment>
                );
            })}
        </>
    );
};

export const QuickSearchFilters = memo(QuickSearchFiltersElement) as typeof QuickSearchFiltersElement;

export const FilterableColumn = <TData, TType extends ColumnDataType, TVal>({
    column,
    setProperty,
}: {
    column: Column<TData, TType, TVal>;
    setProperty: (value: string) => void;
}) => {
    const itemRef = useRef<HTMLDivElement>(null);

    const prefetch = useCallback(() => {
        // Only prefetch options for option and multiOption columns
        if (isAnyOf(column.type, ["option", "multiOption"])) {
            column.prefetchOptions();
        }

        column.prefetchValues();
        column.prefetchFacetedUniqueValues();
        column.prefetchFacetedMinMaxValues();
    }, [column]);

    useEffect(() => {
        const target = itemRef.current;

        if (!target)
            return;

        // Set up MutationObserver
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "attributes") {
                    const isSelected = target.getAttribute("data-selected") === "true";

                    if (isSelected)
                        prefetch();
                }
            }
        });

        // Set up observer
        observer.observe(target, {
            attributeFilter: ["data-selected"],
            attributes: true,
        });

        // Cleanup on unmount
        return () => observer.disconnect();
    }, [prefetch]);

    return (
        <CommandItem
            className="group"
            keywords={[column.displayName]}
            onMouseEnter={prefetch}
            onSelect={() => {
                setProperty(column.id);
            }}
            ref={itemRef}
            value={column.id}
        >
            <div className="flex w-full items-center justify-between">
                <div className="inline-flex items-center gap-1.5">
                    {<column.icon className="size-4" strokeWidth={2.25} />}
                    <span>{column.displayName}</span>
                </div>
                <ArrowRightIcon className="size-4 opacity-0 group-aria-selected:opacity-100" />
            </div>
        </CommandItem>
    );
};

export const FilterSelector = memo(FilterSelectorElement) as typeof FilterSelectorElement;
