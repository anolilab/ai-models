import { useMemo } from "react";
import type { RowData, TableInstance, TableOptions } from "../types";
import useTableInstance from "./use-table-instance";
import { useTableOptions } from "./use-table-options";

export const useDataTable = <TData extends RowData>(tableOptions: TableOptions<TData> & { features?: any }): { features: any; table: TableInstance<TData> } => {
    // Extract features from tableOptions if they exist
    const features = tableOptions.features || {};
    
    // ✅ OPTIMIZED: Memoize enhanced table options to prevent unnecessary re-computations
    const enhancedTableOptions = useMemo(() => {
        // Create table options without features to avoid conflicts
        const { features: _, ...cleanTableOptions } = tableOptions;
        
        // ✅ FIXED: Extract virtualization options from features
        const virtualizationOptions = features.virtualization || {};
        
        return {
            ...cleanTableOptions,
            // Apply selection features
            enableRowSelection: features.selection?.enabled ?? cleanTableOptions.enableRowSelection ?? false,
            enableMultiRowSelection: features.selection?.enabled ?? cleanTableOptions.enableMultiRowSelection ?? true,
            enableSelectAll: features.selection?.enabled ?? cleanTableOptions.enableSelectAll ?? true,
            // Apply other features as needed
            enableColumnFilters: features.filters?.enabled ?? cleanTableOptions.enableColumnFilters ?? true,
            enableGlobalFilter: features.toolbar?.search?.enabled ?? cleanTableOptions.enableGlobalFilter ?? true,
            enablePagination: features.pagination?.enabled ?? cleanTableOptions.enablePagination ?? true,
            enableSorting: cleanTableOptions.enableSorting ?? true,
            enableColumnVirtualization: virtualizationOptions.enabled ?? cleanTableOptions.enableColumnVirtualization,
            enableRowVirtualization: virtualizationOptions.enabled ?? cleanTableOptions.enableRowVirtualization,
            // ✅ FIXED: Pass virtualization options to rowVirtualizerOptions
            rowVirtualizerOptions: virtualizationOptions.enabled ? {
                containerHeight: virtualizationOptions.containerHeight || 600,
                estimatedRowHeight: virtualizationOptions.estimatedRowHeight || 40,
                overscan: virtualizationOptions.overscan || 5,
            } : undefined,
        } as TableOptions<TData>;
    }, [
        tableOptions,
        features.selection?.enabled,
        features.filters?.enabled,
        features.toolbar?.search?.enabled,
        features.pagination?.enabled,
        features.virtualization?.enabled,
        features.virtualization?.containerHeight,
        features.virtualization?.estimatedRowHeight,
        features.virtualization?.overscan,
    ]);
    
    const table = useTableInstance(useTableOptions(enhancedTableOptions));

    // ✅ OPTIMIZED: Memoize return value to prevent unnecessary re-renders
    return useMemo(() => ({
        features,
        table: table as TableInstance<TData>,
    }), [features, table]);
};
