"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";
import { useState, useCallback } from "react";
import { Settings, Undo2, EyeOff, CheckSquare, MoveHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDatePicker } from "@/components/calendar-date-picker";
import { DataTableViewOptions } from "./view-options";
import { DataTableExport } from "./data-export";
import type { DataTransformFunction, ExportableData } from "./utils/export-utils";
import type { TableConfig } from "./utils/table-config";
import { formatDate } from "./utils/date-format";

// Helper functions for component sizing
const getInputSizeClass = (size: 'sm' | 'default' | 'lg') => {
  switch (size) {
    case 'sm': return 'h-8';
    case 'lg': return 'h-11';
    default: return '';
  }
};

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
  setSearch: (value: string | ((prev: string) => string)) => void;
  setDateRange: (
    value:
      | { from_date: string; to_date: string }
      | ((prev: { from_date: string; to_date: string }) => {
        from_date: string;
        to_date: string;
      })
  ) => void;
  totalSelectedItems?: number;
  deleteSelection?: () => void;
  getSelectedItems?: () => Promise<TData[]>;
  getAllItems?: () => TData[];
  config: TableConfig;
  resetColumnSizing?: () => void;
  resetColumnOrder?: () => void;
  entityName?: string;
  columnMapping?: Record<string, string>;
  columnWidths?: Array<{ wch: number }>;
  headers?: string[];
  transformFunction?: DataTransformFunction<TData>;
  customToolbarComponent?: React.ReactNode;
}

export function DataTableToolbar<TData extends ExportableData>({
  table,
  setSearch,
  setDateRange,
  totalSelectedItems = 0,
  deleteSelection,
  getSelectedItems,
  getAllItems,
  config,
  resetColumnSizing,
  resetColumnOrder,
  entityName = "items",
  columnMapping,
  columnWidths,
  headers,
  transformFunction,
  customToolbarComponent,
}: DataTableToolbarProps<TData>) {
  const tableFiltered = table.getState().columnFilters.length > 0;

  // Local search state
  const [localSearch, setLocalSearch] = useState("");

  // Local date state
  const [dates, setDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  // Track if user has explicitly changed dates
  const [datesModified, setDatesModified] = useState(false);

  // Determine if any filters are active
  const isFiltered = tableFiltered || !!localSearch || datesModified;

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    setSearch(value.trim());
  };

  // Handle date selection for filtering
  const handleDateSelect = useCallback(({ from, to }: { from: Date; to: Date }) => {
    setDates({ from, to });
    setDatesModified(!!(from || to));

    // Convert dates to strings in YYYY-MM-DD format for the API
    setDateRange({
      from_date: from ? formatDate(from) : "",
      to_date: to ? formatDate(to) : "",
    });
  }, [setDateRange]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    // Reset table filters
    table.resetColumnFilters();

    // Reset search
    setLocalSearch("");
    setSearch("");

    // Reset dates
    setDates({
      from: undefined,
      to: undefined,
    });
    setDatesModified(false);
    setDateRange({
      from_date: "",
      to_date: "",
    });
  }, [table, setSearch, setDateRange]);

  // Get selected items data for export - this is now just for the UI indication
  // The actual data fetching happens in the export component
  const selectedItems =
    totalSelectedItems > 0
      ? new Array(totalSelectedItems).fill({} as TData)
      : [];

  // Get all available items data for export
  const allItems = getAllItems ? getAllItems() : [];

  return (
    <div className="flex flex-wrap items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {config.enableSearch && (
          <Input
            placeholder={config.searchPlaceholder || `Search ${entityName}...`}
            value={localSearch}
            onChange={handleSearchChange}
            className={`w-[150px] lg:w-[250px] ${getInputSizeClass(config.size)}`}
          />
        )}

        {config.enableDateFilter && (
          <div className="flex items-center">
            <CalendarDatePicker
              date={{
                from: dates.from,
                to: dates.to,
              }}
              onDateSelect={handleDateSelect}
              className={`w-fit cursor-pointer ${getInputSizeClass(config.size)}`}
              variant="outline"
            />
          </div>
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className={getButtonSizeClass(config.size)}
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={getButtonSizeClass(config.size, true)}
              title="Table Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Open table settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Table Settings</h4>
              </div>

              <div className="grid gap-2">
                {config.enableColumnResizing && resetColumnSizing && (
                  <Button
                    variant="outline"
                    size={config.size}
                    className="justify-start"
                    onClick={(e) => {
                      e.preventDefault();
                      resetColumnSizing();
                    }}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Reset Column Sizes
                  </Button>
                )}

                {resetColumnOrder && (
                  <Button
                    variant="outline"
                    size={config.size}
                    className="justify-start"
                    onClick={(e) => {
                      e.preventDefault();
                      resetColumnOrder();
                    }}
                  >
                    <MoveHorizontal className="mr-2 h-4 w-4" />
                    Reset Column Order
                  </Button>
                )}

                {config.enableRowSelection && (
                  <Button
                    variant="outline"
                    size={config.size}
                    className="justify-start"
                    onClick={(e) => {
                      e.preventDefault();
                      table.resetRowSelection();
                      // Also call the parent component's deleteSelection function if available
                      if (deleteSelection) {
                        deleteSelection();
                      }
                    }}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Clear Selection
                  </Button>
                )}

                {!table.getIsAllColumnsVisible() && (
                  <Button
                    variant="outline"
                    size={config.size}
                    className="justify-start"
                    onClick={() => table.resetColumnVisibility()}
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Show All Columns
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
