"use client";

import { useState, useCallback } from "react";
import type { ColumnSizingState } from "@tanstack/react-table";

/**
 * Custom hook to manage table column sizing with client-side only state
 * 
 * @param tableId Unique identifier for the table (unused in client-side mode)
 * @param enableResizing Whether column resizing is enabled
 * @returns An object with column sizing state and setter
 */
export function useTableColumnResize(
  tableId: string,
  enableResizing: boolean = false
) {
  // Column sizing state
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // Memoized function to reset column sizes
  const resetColumnSizing = useCallback(() => {
    setColumnSizing({});
  }, []);

  return {
    columnSizing,
    setColumnSizing,
    resetColumnSizing,
  };
} 