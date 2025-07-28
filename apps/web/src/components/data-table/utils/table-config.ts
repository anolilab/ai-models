/**
 * Table configuration options
 * This file provides centralized configuration for the data table features
 */
export interface TableConfig {
  // Enable/disable row selection
  enableRowSelection: boolean;
  
  // Enable/disable keyboard navigation
  enableKeyboardNavigation: boolean;
  
  // Enable/disable clicking a row to select it
  enableClickRowSelect: boolean;
  
  // Enable/disable pagination
  enablePagination: boolean;
  
  // Enable/disable search
  enableSearch: boolean;
  
  // Enable/disable column filters
  enableColumnFilters: boolean;
  
  // Enable/disable date range filter
  enableDateFilter: boolean;
  
  // Enable/disable column visibility options
  enableColumnVisibility: boolean;
  
  // Enable/disable data export
  enableExport: boolean;
  
  // Enable/disable column resizing
  enableColumnResizing: boolean;
  
  // Enable/disable toolbar
  enableToolbar: boolean;
  
  // Enable/disable static header (header stays fixed while scrolling)
  enableStickyHeader: boolean;
  
  // Control the size of buttons and inputs throughout the table
  // sm: small, default: standard, lg: large
  size: 'sm' | 'default' | 'lg';

  // PERFORMANCE OPTIONS
  
  // Enable row virtualization for large datasets
  enableRowVirtualization: boolean;
  

  
  // Estimated row height for virtualization (in pixels)
  estimatedRowHeight: number;
  
  // Number of items to render outside the visible area (overscan)
  virtualizationOverscan: number;
  
  // Enable debounced search for better performance
  enableDebouncedSearch: boolean;
  
  // Search debounce delay in milliseconds
  searchDebounceDelay: number;
  
  // Enable lazy loading for large datasets
  enableLazyLoading: boolean;
  
  // Batch size for lazy loading operations
  lazyLoadingBatchSize: number;
  
  // Enable column virtualization for wide tables
  enableColumnVirtualization: boolean;
  
  // Estimated column width for column virtualization
  estimatedColumnWidth: number;
  
  // Custom placeholder text for search input
  // If not provided, defaults to "Search {entityName}..."
  searchPlaceholder?: string;
  
  // Allow exporting new columns created by transform function
  // When true (default): Export includes visible columns + new columns from transform function
  // When false: Export only includes visible columns (hidden columns always excluded)
  // Note: Hidden columns are ALWAYS excluded regardless of this setting
  allowExportNewColumns: boolean;
}

// Default configuration
const defaultConfig: TableConfig = {
  enableRowSelection: true,      // Row selection enabled by default
  enableKeyboardNavigation: false, // Keyboard navigation disabled by default
  enableClickRowSelect: false,    // Clicking row to select disabled by default
  enablePagination: true,         // Pagination enabled by default
  enableSearch: true,             // Search enabled by default
  enableColumnFilters: true,      // Column filters enabled by default
  enableDateFilter: true,         // Date filter enabled by default
  enableColumnVisibility: true,   // Column visibility options enabled by default
  enableExport: true,             // Data export enabled by default
  enableColumnResizing: true,     // Column resizing enabled by default
  enableToolbar: true,            // Toolbar enabled by default
  enableStickyHeader: false,      // Static header disabled by default
  size: 'default',                // Default size for buttons and inputs
  searchPlaceholder: undefined,   // No custom search placeholder by default
  allowExportNewColumns: true,    // Allow new columns from transform function by default
  
  // PERFORMANCE DEFAULTS
  enableRowVirtualization: false,     // Disabled by default for backward compatibility
  estimatedRowHeight: 40,             // Default row height estimate
  virtualizationOverscan: 5,          // Default overscan for smooth scrolling
  enableDebouncedSearch: true,        // Enabled by default for better UX
  searchDebounceDelay: 300,           // 300ms debounce delay
  enableLazyLoading: false,           // Disabled by default
  lazyLoadingBatchSize: 100,          // Default batch size
  enableColumnVirtualization: false,  // Disabled by default
  estimatedColumnWidth: 150,          // Default column width estimate
};

/**
 * Hook to provide table configuration
 * Allows overriding default configuration
 */
export function useTableConfig(overrideConfig?: Partial<TableConfig>): TableConfig {
  // Merge default config with any overrides
  const config = { ...defaultConfig, ...overrideConfig };
  
  return config;
} 