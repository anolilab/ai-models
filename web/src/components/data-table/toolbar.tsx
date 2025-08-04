"use client";

import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import cn from "@/lib/utils";

import { DataTableExport } from "./data-export";
import DataTableFilter from "./filter/components/data-table-filter";
import type { Column, DataTableFilterActions, FiltersState, FilterStrategy } from "./filter/core/types";
import type { TableConfig } from "./types";
import type { DataTransformFunction, ExportableData } from "./utils/export-utils";
import { DataTableViewOptions } from "./view-options";

interface DataTableToolbarProps<TData extends ExportableData> {
    className?: string;
    columnMapping?: Record<string, string>;
    columnWidths?: { wch: number }[];
    config: TableConfig;
    customToolbarComponent?: React.ReactNode;
    entityName?: string;
    filterActions?: DataTableFilterActions;
    // New filter props - processed data from DataTable
    filterColumns?: Column<TData>[];
    filters?: FiltersState;
    filterStrategy?: FilterStrategy;
    getAllItems?: () => TData[];
    getSelectedItems?: () => Promise<TData[]>;
    headers?: string[];
    table: Table<TData>;
    totalSelectedItems?: number;
    transformFunction?: DataTransformFunction<TData>;
}

const DataTableToolbar = <TData extends ExportableData>({
    className,
    columnMapping,
    columnWidths,
    config,
    customToolbarComponent,
    entityName = "items",
    filterActions,
    filterColumns,
    filters,
    filterStrategy = "client",
    getAllItems,
    getSelectedItems,
    headers,
    table,
    totalSelectedItems = 0,
    transformFunction,
}: DataTableToolbarProps<TData>): ReactNode => {
    // Use filter data passed from DataTable
    const filterState = filters || [];
    const filterColumnsData = filterColumns || [];

    // Get selected items data for export - this is now just for the UI indication
    // The actual data fetching happens in the export component
    const selectedItems = totalSelectedItems > 0 ? new Array(totalSelectedItems).fill({} as TData) : [];

    // Get all available items data for export
    const allItems = getAllItems ? getAllItems() : [];

    return (
        <div className={cn("flex flex-wrap items-center justify-between p-2", className)}>
            <div>
                {filterColumnsData && filterColumnsData.length > 0 && filterActions && (
                    <DataTableFilter actions={filterActions} columns={filterColumnsData} filters={filterState} strategy={filterStrategy} />
                )}
            </div>

            <div className="flex items-center gap-2">
                {customToolbarComponent}

                {config.enableExport && (
                    <DataTableExport
                        columnMapping={columnMapping}
                        columnWidths={columnWidths}
                        config={config}
                        data={allItems}
                        entityName={entityName}
                        getSelectedItems={getSelectedItems}
                        headers={headers}
                        selectedData={selectedItems}
                        size={config.size}
                        table={table}
                        transformFunction={transformFunction}
                    />
                )}

                {config.enableColumnVisibility && <DataTableViewOptions columnMapping={columnMapping} size={config.size} table={table} />}
            </div>
        </div>
    );
};

export default DataTableToolbar;
