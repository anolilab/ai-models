import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Custom hook for debounced search
 * Improves performance by reducing the number of search operations
 */
export function useDebouncedSearch(searchValue: string, onSearchChange: (value: string) => void, delay: number = 300) {
    const timeoutRef = useRef<number>();

    useEffect(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = window.setTimeout(() => {
            onSearchChange(searchValue);
        }, delay);

        // Cleanup on unmount or when searchValue changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [searchValue, onSearchChange, delay]);

    return searchValue;
}

/**
 * Custom hook for lazy loading data
 * Loads data in batches to improve initial render performance
 */
export function useLazyLoading<T>(data: T[], batchSize: number = 100, initialBatchSize: number = 50) {
    const [loadedCount, setLoadedCount] = useState(initialBatchSize);
    const [isLoading, setIsLoading] = useState(false);

    const loadMore = useCallback(() => {
        if (loadedCount < data.length) {
            setIsLoading(true);
            // Simulate async loading with setTimeout
            setTimeout(() => {
                setLoadedCount((prev) => Math.min(prev + batchSize, data.length));
                setIsLoading(false);
            }, 100);
        }
    }, [loadedCount, data.length, batchSize]);

    const loadedData = data.slice(0, loadedCount);
    const hasMore = loadedCount < data.length;

    return {
        hasMore,
        isLoading,
        loadedCount,
        loadedData,
        loadMore,
        totalCount: data.length,
    };
}

/**
 * Optimized row selection handler for large datasets
 * Uses Set for O(1) lookups instead of object properties
 */
export function createOptimizedRowSelectionHandler<TData>(data: TData[], idField: keyof TData, onSelectionChange: (selectedIds: Set<string>) => void) {
    return useCallback(
        (updaterOrValue: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
            const newRowSelection = typeof updaterOrValue === "function" ? updaterOrValue({}) : updaterOrValue;

            // Convert to Set for better performance
            const selectedIds = new Set<string>();

            Object.entries(newRowSelection).forEach(([rowId, isSelected]) => {
                if (isSelected) {
                    const rowIndex = parseInt(rowId, 10);

                    if (rowIndex >= 0 && rowIndex < data.length) {
                        const item = data[rowIndex];
                        const itemId = String(item[idField]);

                        selectedIds.add(itemId);
                    }
                }
            });

            onSelectionChange(selectedIds);
        },
        [data, idField, onSelectionChange],
    );
}

/**
 * Virtualization helper for calculating visible range
 */
export function calculateVisibleRange(scrollTop: number, containerHeight: number, itemHeight: number, overscan: number = 5) {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan, Number.MAX_SAFE_INTEGER);

    return { endIndex, startIndex };
}

/**
 * Performance monitoring utility
 */
export function usePerformanceMonitor(componentName: string) {
    const renderCount = useRef(0);
    const lastRenderTime = useRef(performance.now());

    useEffect(() => {
        renderCount.current += 1;
        const currentTime = performance.now();
        const timeSinceLastRender = currentTime - lastRenderTime.current;

        if (import.meta.env.DEV) {
            console.log(`${componentName} render #${renderCount.current} (${timeSinceLastRender.toFixed(2)}ms)`);
        }

        lastRenderTime.current = currentTime;
    });

    return {
        renderCount: renderCount.current,
        timeSinceLastRender: performance.now() - lastRenderTime.current,
    };
}

/**
 * Memoization helper for expensive computations
 */
export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList, equalityFn?: (prev: T, next: T) => boolean): T {
    const ref = useRef<T>();
    const depsRef = useRef<React.DependencyList>();

    if (!depsRef.current || !shallowEqual(depsRef.current, deps)) {
        const newValue = factory();

        if (!ref.current || !equalityFn || !equalityFn(ref.current, newValue)) {
            ref.current = newValue;
        }

        depsRef.current = deps;
    }

    return ref.current!;
}

/**
 * Shallow equality check for dependency arrays
 */
function shallowEqual(a: React.DependencyList, b: React.DependencyList): boolean {
    if (a.length !== b.length)
        return false;

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }

    return true;
}

/**
 * Batch state updates for better performance
 */
export function useBatchedState<T>(initialState: T) {
    const [state, setState] = useState<T>(initialState);
    const batchRef = useRef<T | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const batchedSetState = useCallback(
        (updater: T | ((prev: T) => T)) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            batchRef.current = typeof updater === "function" ? (updater as (prev: T) => T)(batchRef.current ?? state) : updater;

            timeoutRef.current = setTimeout(() => {
                if (batchRef.current !== null) {
                    setState(batchRef.current);
                    batchRef.current = null;
                }
            }, 0);
        },
        [state],
    );

    return [state, batchedSetState] as const;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(callback: () => void, options: IntersectionObserverInit = {}) {
    const observerRef = useRef<IntersectionObserver>();
    const elementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    callback();
                }
            });
        }, options);

        if (elementRef.current) {
            observerRef.current.observe(elementRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [callback, options]);

    return elementRef;
}

/**
 * Optimized sorting utilities for better performance
 */

// Pre-computed sort functions for common data types
const sortFunctions = {
    boolean: (a: boolean, b: boolean) => Number(a) - Number(b),
    date: (a: Date, b: Date) => a.getTime() - b.getTime(),
    number: (a: number, b: number) => a - b,
    text: (a: string, b: string) => a.localeCompare(b),
};

/**
 * Creates an optimized sorting function for a specific column
 */
export function createOptimizedSortFunction<T>(accessorKey: keyof T, dataType: "text" | "number" | "date" | "boolean" = "text") {
    return (a: T, b: T) => {
        const valueA = a[accessorKey];
        const valueB = b[accessorKey];

        // Handle null/undefined values
        if (valueA == null && valueB == null)
            return 0;

        if (valueA == null)
            return 1;

        if (valueB == null)
            return -1;

        // Use pre-computed sort functions
        switch (dataType) {
            case "boolean":
                return sortFunctions.boolean(Boolean(valueA), Boolean(valueB));
            case "date":
                const dateA = valueA instanceof Date ? valueA : new Date(String(valueA));
                const dateB = valueB instanceof Date ? valueB : new Date(String(valueB));

                return sortFunctions.date(dateA, dateB);
            case "number":
                return sortFunctions.number(Number(valueA), Number(valueB));
            case "text":
            default:
                return sortFunctions.text(String(valueA), String(valueB));
        }
    };
}

/**
 * Debounced sorting to prevent excessive re-sorting during rapid changes
 */
export function useDebouncedSorting<T>(data: T[], sortConfig: { desc: boolean; id: string } | null, delay: number = 100) {
    const [debouncedSortConfig, setDebouncedSortConfig] = useState(sortConfig);
    const timeoutRef = useRef<number>();

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            setDebouncedSortConfig(sortConfig);
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [sortConfig, delay]);

    return debouncedSortConfig;
}

/**
 * Memoized sorting with stable references
 */
export function useMemoizedSorting<T>(data: T[], sortConfig: { desc: boolean; id: string } | null, sortFunctions: Record<string, (a: T, b: T) => number>) {
    return useMemo(() => {
        if (!sortConfig || !data.length)
            return data;

        const sortedData = [...data].sort((a, b) => {
            const sortFn = sortFunctions[sortConfig.id];

            if (!sortFn)
                return 0;

            const result = sortFn(a, b);

            return sortConfig.desc ? -result : result;
        });

        return sortedData;
    }, [data, sortConfig, sortFunctions]);
}

/**
 * Optimized column sorting configuration
 */
export function createOptimizedColumnSorting<T>(columns: { accessorKey: keyof T; id: string; meta?: { sortType?: string } }[]) {
    const sortFunctions: Record<string, (a: T, b: T) => number> = {};

    columns.forEach((column) => {
        const sortType = column.meta?.sortType || "text";

        sortFunctions[column.id] = createOptimizedSortFunction(column.accessorKey, sortType as any);
    });

    return sortFunctions;
}
