// Basic type definitions for Material React Table
// All MRT_ prefixes removed as part of Phase 4 cleanup

export type RowData = Record<string, any>;

export type TableInstance<TData extends RowData> = any;

export type TableOptions<TData extends RowData> = any;

export type DefinedTableOptions<TData extends RowData> = any;

export type StatefulTableOptions<TData extends RowData> = any;

export type Row<TData extends RowData> = any;

export type Column<TData extends RowData> = any;

export type ColumnDef<TData extends RowData> = any;

export type Header<TData extends RowData> = any;

export type Cell<TData extends RowData, TValue = any> = any;

export type CellValue = any;

export type TableState = any;

export type ColumnOrderState = any;

export type ColumnSizingInfoState = any;

export type ColumnFilterFnsState = any;

export type GroupingState = any;

export type PaginationState = any;

export type SortingState = any;

export type DensityState = any;

export type FilterOption = any;

export type InternalFilterOption = any;

export type Updater<T> = any;

export type DefinedColumnDef<TData extends RowData> = any;

export type DisplayColumnDef<TData extends RowData> = any;

export type GroupColumnDef<TData extends RowData> = any;

export type ColumnHelper<TData extends RowData> = any;

export type DisplayColumnIds = any;

export type Localization = any;

export type Theme = any;

export type ColumnVirtualizer = any;

export type RowVirtualizer = any;

export type VirtualItem = any;

export type DropdownOption = any;

export type Xor<T, U> = T extends U ? never : T;

// Placeholder types for missing dependencies
export type DefaultIcons = any;
export type LocalizationEN = any;
