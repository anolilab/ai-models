import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../../src/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';

// Mock data for testing
const mockData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    department: 'Engineering',
    salary: 75000,
    startDate: '2023-01-15',
    lastLogin: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'Inactive',
    department: 'Marketing',
    salary: 65000,
    startDate: '2023-03-20',
    lastLogin: '2024-01-19T14:45:00Z'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Manager',
    status: 'Active',
    department: 'Sales',
    salary: 85000,
    startDate: '2022-11-10',
    lastLogin: '2024-01-21T09:15:00Z'
  }
];

type TestData = typeof mockData[0];

// Column definitions for testing
const getColumns = (): ColumnDef<TestData>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    enableColumnFilter: true,
    sortingFn: 'text',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableColumnFilter: true,
    sortingFn: 'text',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    enableColumnFilter: true,
    sortingFn: 'text',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableColumnFilter: true,
    sortingFn: 'text',
  },
  {
    accessorKey: 'department',
    header: 'Department',
    enableColumnFilter: true,
    sortingFn: 'text',
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    enableColumnFilter: true,
    sortingFn: 'number',
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    enableColumnFilter: true,
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
    enableColumnFilter: true,
    sortingFn: 'datetime',
  }
];

// Export configuration
const exportConfig = {
  entityName: 'employees',
  columnMapping: {
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    department: 'Department',
    salary: 'Salary',
    startDate: 'Start Date',
    lastLogin: 'Last Login',
  },
  columnWidths: [
    { wch: 15 }, // name
    { wch: 25 }, // email
    { wch: 12 }, // role
    { wch: 10 }, // status
    { wch: 15 }, // department
    { wch: 10 }, // salary
    { wch: 12 }, // startDate
    { wch: 15 }, // lastLogin
  ],
  headers: [
    'Name',
    'Email',
    'Role',
    'Status',
    'Department',
    'Salary',
    'Start Date',
    'Last Login',
  ],
};

describe('DataTable Component E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Basic Rendering', () => {
    it('should render the data table with all data', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check that all data is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display all column headers', () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const headers = ['Name', 'Email', 'Role', 'Status', 'Department', 'Salary', 'Start Date', 'Last Login'];
      headers.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter data by search term', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search employees/i);
      
      // Search for "John"
      await user.type(searchInput, 'John');
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('should clear search results when input is cleared', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search employees/i);
      
      // Search for something
      await user.type(searchInput, 'John');
      
      // Clear the search
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by name column', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const nameHeader = screen.getByText('Name');
      
      // Click to sort ascending
      await user.click(nameHeader);
      
      // Check that Bob Johnson comes first (alphabetically)
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      
      expect(within(firstDataRow).getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should sort by salary column numerically', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const salaryHeader = screen.getByText('Salary');
      
      // Click to sort ascending
      await user.click(salaryHeader);
      
      // Check that Jane Smith comes first (lowest salary)
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      
      expect(within(firstDataRow).getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('should allow selecting individual rows', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      // Find and click the first row's checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Skip header checkbox
      
      await user.click(firstRowCheckbox);
      
      // Check that the row is selected
      expect(firstRowCheckbox).toBeChecked();
    });

    it('should allow selecting all rows', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      // Find and click the header checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      
      await user.click(headerCheckbox);
      
      // Check that all rows are selected
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Column Visibility', () => {
    it('should show column visibility options', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const viewOptionsButton = screen.getByRole('button', { name: /table settings/i });
      await user.click(viewOptionsButton);
      
      // Check that column visibility options are shown
      expect(screen.getByText('Toggle columns')).toBeInTheDocument();
    });

    it('should hide/show columns when toggled', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const viewOptionsButton = screen.getByRole('button', { name: /table settings/i });
      await user.click(viewOptionsButton);
      
      // Find and click the Name checkbox to hide it
      const nameCheckbox = screen.getByRole('checkbox', { name: /name/i });
      await user.click(nameCheckbox);
      
      // Name column should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
      });
      
      // Show it again
      await user.click(nameCheckbox);
      
      // Name column should be visible again
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should show export options', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Check that export options are shown
      expect(screen.getByText(/csv/i)).toBeInTheDocument();
      expect(screen.getByText(/excel/i)).toBeInTheDocument();
    });

    it('should export all data to CSV', async () => {
      // Mock the download function
      global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
      
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const csvButton = screen.getByText(/csv/i);
      await user.click(csvButton);
      
      // Should trigger download
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should show date range picker', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const dateFilterButton = screen.getByRole('button', { name: /date/i });
      await user.click(dateFilterButton);
      
      // Check that date picker is shown
      expect(screen.getByText('Select a date')).toBeInTheDocument();
    });
  });

  describe('Virtualization', () => {
    it('should handle virtualization correctly', async () => {
      // Create a large dataset for virtualization testing
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: i % 2 === 0 ? 'Admin' : 'User',
        status: i % 3 === 0 ? 'Active' : 'Inactive',
        department: ['Engineering', 'Marketing', 'Sales'][i % 3],
        salary: 50000 + (i * 1000),
        startDate: '2023-01-15',
        lastLogin: '2024-01-20T10:30:00Z'
      }));

      render(
        <DataTable
          data={largeData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: true,
            estimatedRowHeight: 40,
            virtualizationOverscan: 5,
          }}
          virtualizationOptions={{
            estimatedRowHeight: 40,
            overscan: 5,
            containerHeight: 600,
          }}
        />
      );

      // The table should render efficiently with virtualization
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check that some rows are rendered (virtualization will only render visible ones)
      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + some data rows
    });
  });

  describe('Performance', () => {
    it('should maintain performance during rapid interactions', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
            enableDebouncedSearch: true,
            searchDebounceDelay: 300,
          }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search employees/i);
      
      // Perform multiple searches quickly
      await user.type(searchInput, 'John');
      await user.clear(searchInput);
      await user.type(searchInput, 'Jane');
      await user.clear(searchInput);
      await user.type(searchInput, 'Bob');
      
      // Table should still be responsive
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      // Check for search input accessibility
      const searchInput = screen.getByPlaceholderText(/search employees/i);
      expect(searchInput).toBeInTheDocument();
      
      // Check for table accessibility
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('rowgroup')).toHaveLength(2); // thead and tbody
    });

    it('should support keyboard navigation', async () => {
      render(
        <DataTable
          data={mockData}
          getColumns={getColumns}
          exportConfig={exportConfig}
          idField="id"
          config={{
            enableRowSelection: true,
            enableSearch: true,
            enableColumnFilters: true,
            enableDateFilter: true,
            enableColumnVisibility: true,
            enableExport: true,
            enableToolbar: true,
            enablePagination: false,
            enableRowVirtualization: false,
          }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search employees/i);
      
      // Focus search input
      searchInput.focus();
      expect(searchInput).toHaveFocus();
      
      // Tab to next interactive element
      await user.tab();
      expect(searchInput).not.toHaveFocus();
    });
  });
}); 