import React from 'react';
import { DataTable as OriginalDataTable } from '../../src/components/data-table/data-table';
import type { DataTableProps } from '../../src/components/data-table/data-table';

// Test-specific DataTable component that doesn't use performance monitoring
export function TestDataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  // Disable performance monitoring for tests
  const testProps = {
    ...props,
    config: {
      ...props.config,
      enablePerformanceMonitoring: false, // Add this flag to disable performance monitoring
    },
  };
  
  return <OriginalDataTable {...testProps} />;
} 