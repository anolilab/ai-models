/**
 * Table configuration options
 * This file provides centralized configuration for the data table features
 */
export interface TableConfig {
    // Allow exporting new columns created by transform function
    // When true (default): Export includes visible columns + new columns from transform function
    // When false: Export only includes visible columns (hidden columns always excluded)
    // Note: Hidden columns are ALWAYS excluded regardless of this setting
    allowExportNewColumns: boolean;

    // Enable/disable clicking a row to select it
    enableClickRowSelect: boolean;

    // Enable/disable column filters
    enableColumnFilters: boolean;

    // Enable/disable column resizing
    enableColumnResizing: boolean;

    // Enable/disable column visibility options
    enableColumnVisibility: boolean;

    // Enable/disable data export
    enableExport: boolean;

    // Enable/disable keyboard navigation
    enableKeyboardNavigation: boolean;

    // Enable/disable pagination
    enablePagination: boolean;

    // Enable/disable row selection
    enableRowSelection: boolean;

    // Enable row virtualization for large datasets
    enableRowVirtualization: boolean;

    // Enable/disable static header (header stays fixed while scrolling)
    enableStickyHeader: boolean;

    // Enable/disable toolbar
    enableToolbar: boolean;

    // Estimated row height for virtualization (in pixels)
    estimatedRowHeight: number;

    // Maximum number of items that can be selected (for comparison features)
    // Set to 0 or undefined to disable the limit
    maxSelectionLimit: number;

    // Selection mode for the table
    // "comparison": Limited selection for model comparison (default: 5 items)
    // "export": Unlimited selection for data export
    selectionMode: "comparison" | "export";

    // Control the size of buttons and inputs throughout the table
    // sm: small, default: standard, lg: large
    size: "sm" | "default" | "lg";

    // Number of items to render outside the visible area (overscan)
    virtualizationOverscan: number;
}
