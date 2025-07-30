"use client";

import type { Table } from "@tanstack/react-table";
import { Settings, Undo2, EyeOff, CheckSquare, MoveHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTableViewOptions } from "./view-options";
import { DataTableExport } from "./data-export";
import { DataTableFilter } from "./filter/components/data-table-filter";
import type { DataTransformFunction, ExportableData } from "./utils/export-utils";
import type { TableConfig } from "./utils/table-config";
import type { 
  ColumnConfig, 
  FiltersState, 
  FilterStrategy,
  Column,
  DataTableFilterActions
} from "./filter/core/types";
import { useDataTableFilters } from "./filter/hooks/use-data-table-filters";
import { cn } from "@/lib/utils";

// Helper functions for component sizing
const getButtonSizeClass = (size: 'sm' | 'default' | 'lg', isIcon = false) => {
  if (isIcon) {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-11 w-11';
      default: return '';
    }
  }
  switch (size) {
    case 'sm': return 'h-8 px-3';
    case 'lg': return 'h-11 px-5';
    default: return '';
  }
};

interface DataTableToolbarProps<TData extends ExportableData> {
  table: Table<TData>;
  totalSelectedItems?: number;
  getSelectedItems?: () => Promise<TData[]>;
  getAllItems?: () => TData[];
  config: TableConfig;
  entityName?: string;
  columnMapping?: Record<string, string>;
  columnWidths?: Array<{ wch: number }>;
  headers?: string[];
  transformFunction?: DataTransformFunction<TData>;
  customToolbarComponent?: React.ReactNode;
  className?: string;
  // New filter props - processed data from DataTable
  filterColumns?: Column<TData>[];
  filterStrategy?: FilterStrategy;
  filters?: FiltersState;
  filterActions?: DataTableFilterActions;
}

export function DataTableToolbar<TData extends ExportableData>({
  table,
  totalSelectedItems = 0,
  getSelectedItems,
  getAllItems,
  config,
  entityName = "items",
  columnMapping,
  columnWidths,
  headers,
  transformFunction,
  customToolbarComponent,
  className,
  filterColumns,
  filterStrategy = 'client',
  filters,
  filterActions,
}: DataTableToolbarProps<TData>) {
  // Use filter data passed from DataTable
  const filterState = filters || [];
  const filterColumnsData = filterColumns || [];



  // Get selected items data for export - this is now just for the UI indication
  // The actual data fetching happens in the export component
  const selectedItems =
    totalSelectedItems > 0
      ? new Array(totalSelectedItems).fill({} as TData)
      : [];

  // Get all available items data for export
  const allItems = getAllItems ? getAllItems() : [];

  return (
    <div className={cn("flex flex-wrap items-center justify-between p-2", className)}>
      <div>
        {filterColumnsData && filterColumnsData.length > 0 && filterActions && (
            <DataTableFilter
              columns={filterColumnsData}
              filters={filterState}
              actions={filterActions}
              strategy={filterStrategy}
            />
          )}
      </div>

      <div className="flex items-center gap-2">
        {customToolbarComponent}

        {config.enableExport && (
          <DataTableExport
            table={table}
            data={allItems}
            selectedData={selectedItems}
            getSelectedItems={getSelectedItems}
            entityName={entityName}
            columnMapping={columnMapping}
            columnWidths={columnWidths}
            headers={headers}
            transformFunction={transformFunction}
            size={config.size}
            config={config}
          />
        )}

        {config.enableColumnVisibility && (
          <DataTableViewOptions
            table={table}
            columnMapping={columnMapping}
            size={config.size}
          />
        )}
      </div>
    </div>
  );
}
