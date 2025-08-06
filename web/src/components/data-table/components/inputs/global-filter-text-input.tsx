import clsx from "clsx";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { FilterOptionMenu } from "../menus/filter-option-menu";

interface Props<TData extends RowData> {
    className?: string;
    placeholder?: string;
    table: TableInstance<TData>;
}

export const GlobalFilterTextInput = <TData extends RowData>({ className, placeholder, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { enableGlobalFilterModes, localization, mantineSearchTextInputProps, manualFiltering, positionGlobalFilter },
        refs: { searchInputRef },
        setGlobalFilter,
    } = table;
    const { globalFilter, showGlobalFilter } = getState();

    const textFieldProps = {
        ...parseFromValuesOrFunc(mantineSearchTextInputProps, {
            table,
        }),
        ...rest,
    };

    const isMounted = useRef(false);
    const [searchValue, setSearchValue] = useState(globalFilter ?? "");

    // Simple debounce implementation
    const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);

    useEffect(() => {
        const timer = setTimeout(
            () => {
                setDebouncedSearchValue(searchValue);
            },
            manualFiltering ? 500 : 250,
        );

        return () => clearTimeout(timer);
    }, [searchValue, manualFiltering]);

    useEffect(() => {
        setGlobalFilter(debouncedSearchValue || undefined);
    }, [debouncedSearchValue, setGlobalFilter]);

    const handleClear = () => {
        setSearchValue("");
        setGlobalFilter(undefined);
    };

    useEffect(() => {
        if (isMounted.current) {
            if (globalFilter === undefined) {
                handleClear();
            } else {
                setSearchValue(globalFilter);
            }
        }

        isMounted.current = true;
    }, [globalFilter]);

    if (!showGlobalFilter)
        return null;

    return (
        <div className={clsx("flex flex-nowrap items-center gap-1", className)}>
            {enableGlobalFilterModes && <FilterOptionMenu onSelect={handleClear} table={table} />}
            <div className="relative">
                <Input
                    className={clsx("ano-global-filter-text-input relative z-10", textFieldProps?.className)}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder={placeholder ?? localization.search}
                    ref={(node) => {
                        if (node) {
                            searchInputRef.current = node;

                            if (textFieldProps?.ref) {
                                // @ts-ignore
                                textFieldProps.ref = node;
                            }
                        }
                    }}
                    value={searchValue ?? ""}
                />
                {!enableGlobalFilterModes && <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />}
                {searchValue && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                aria-label={localization.clearSearch}
                                className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
                                onClick={handleClear}
                                size="sm"
                                variant="ghost"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{localization.clearSearch}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};
