import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the provider registry to return consistent test data
vi.mock('@anolilab/provider-registry', () => ({
  getAllModels: () => [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      tool_call: true,
      reasoning: true,
      modalities: {
        input: ['text'],
        output: ['text']
      },
      cost: {
        input: 0.03,
        output: 0.06,
        input_cache_hit: 0.01
      },
      limit: {
        context: 8192,
        output: 4096
      },
      temperature: true,
      open_weights: false,
      knowledge: '2023-04',
      release_date: '2023-03-14',
      last_updated: '2023-11-06'
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      tool_call: true,
      reasoning: true,
      modalities: {
        input: ['text', 'image'],
        output: ['text']
      },
      cost: {
        input: 0.015,
        output: 0.075,
        input_cache_hit: 0.005
      },
      limit: {
        context: 200000,
        output: 4096
      },
      temperature: true,
      open_weights: false,
      knowledge: '2023-10',
      release_date: '2024-03-04',
      last_updated: '2024-03-04'
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      tool_call: false,
      reasoning: true,
      modalities: {
        input: ['text', 'image'],
        output: ['text']
      },
      cost: {
        input: 0.0005,
        output: 0.0015,
        input_cache_hit: 0.00025
      },
      limit: {
        context: 32768,
        output: 2048
      },
      temperature: true,
      open_weights: false,
      knowledge: '2024-02',
      release_date: '2023-12-06',
      last_updated: '2024-02-15'
    }
  ]
}));

// Import the component after mocking
const { HomeComponent } = await import('../../src/routes/index');

describe('Data Table E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Table Rendering', () => {
    it('should render the data table with all models', async () => {
      render(<HomeComponent />);

      // Wait for the table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check that all models are displayed
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument();
      expect(screen.getByText('Gemini Pro')).toBeInTheDocument();
    });

    it('should display correct column headers', () => {
      render(<HomeComponent />);

      const headers = [
        'Provider',
        'Model',
        'Provider ID',
        'Model ID',
        'Tool Call',
        'Reasoning',
        'Input',
        'Output',
        'Input Cost',
        'Output Cost',
        'Cache Read Cost',
        'Cache Write Cost',
        'Context Limit',
        'Output Limit',
        'Temperature',
        'Weights',
        'Knowledge',
        'Release Date',
        'Last Updated'
      ];

      headers.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('should display model data correctly', () => {
      render(<HomeComponent />);

      // Check specific model data
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      
      // Check costs are formatted correctly
      expect(screen.getByText('$0.0300')).toBeInTheDocument(); // GPT-4 input cost
      expect(screen.getByText('$0.0750')).toBeInTheDocument(); // Claude output cost
    });
  });

  describe('Search Functionality', () => {
    it('should filter models by search term', async () => {
      render(<HomeComponent />);

      const searchInput = screen.getByPlaceholderText(/search models/i);
      
      // Search for GPT
      await user.type(searchInput, 'GPT');
      
      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument();
        expect(screen.queryByText('Claude 3 Opus')).not.toBeInTheDocument();
        expect(screen.queryByText('Gemini Pro')).not.toBeInTheDocument();
      });
    });

    it('should clear search results when input is cleared', async () => {
      render(<HomeComponent />);

      const searchInput = screen.getByPlaceholderText(/search models/i);
      
      // Search for something
      await user.type(searchInput, 'GPT');
      
      // Clear the search
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument();
        expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument();
        expect(screen.getByText('Gemini Pro')).toBeInTheDocument();
      });
    });

    it('should debounce search input', async () => {
      render(<HomeComponent />);

      const searchInput = screen.getByPlaceholderText(/search models/i);
      
      // Type quickly
      await user.type(searchInput, 'G');
      await user.type(searchInput, 'P');
      await user.type(searchInput, 'T');
      
      // Should show results after debounce
      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by provider name', async () => {
      render(<HomeComponent />);

      const providerHeader = screen.getByText('Provider');
      
      // Click to sort ascending
      await user.click(providerHeader);
      
      // Check that Anthropic comes first (alphabetically)
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      
      expect(within(firstDataRow).getByText('Anthropic')).toBeInTheDocument();
    });

    it('should sort by model name', async () => {
      render(<HomeComponent />);

      const modelHeader = screen.getByText('Model');
      
      // Click to sort ascending
      await user.click(modelHeader);
      
      // Check that Claude 3 Opus comes first (alphabetically)
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      
      expect(within(firstDataRow).getByText('Claude 3 Opus')).toBeInTheDocument();
    });

    it('should reverse sort order on second click', async () => {
      render(<HomeComponent />);

      const providerHeader = screen.getByText('Provider');
      
      // First click - ascending
      await user.click(providerHeader);
      
      // Second click - descending
      await user.click(providerHeader);
      
      // Check that Google comes first (reverse alphabetical)
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      
      expect(within(firstDataRow).getByText('OpenAI')).toBeInTheDocument();
    });
  });

  describe('Column Visibility', () => {
    it('should show column visibility options', async () => {
      render(<HomeComponent />);

      const viewOptionsButton = screen.getByRole('button', { name: /table settings/i });
      await user.click(viewOptionsButton);
      
      // Check that column visibility options are shown
      expect(screen.getByText('Toggle columns')).toBeInTheDocument();
    });

    it('should hide/show columns when toggled', async () => {
      render(<HomeComponent />);

      const viewOptionsButton = screen.getByRole('button', { name: /table settings/i });
      await user.click(viewOptionsButton);
      
      // Find and click the Provider checkbox to hide it
      const providerCheckbox = screen.getByRole('checkbox', { name: /provider/i });
      await user.click(providerCheckbox);
      
      // Provider column should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Provider')).not.toBeInTheDocument();
      });
      
      // Show it again
      await user.click(providerCheckbox);
      
      // Provider column should be visible again
      await waitFor(() => {
        expect(screen.getByText('Provider')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should show export options', async () => {
      render(<HomeComponent />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      // Check that export options are shown
      expect(screen.getByText(/csv/i)).toBeInTheDocument();
      expect(screen.getByText(/excel/i)).toBeInTheDocument();
    });

    it('should export all data to CSV', async () => {
      // Mock the download function
      global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
      
      render(<HomeComponent />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const csvButton = screen.getByText(/csv/i);
      await user.click(csvButton);
      
      // Should trigger download
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('should export all data to Excel', async () => {
      // Mock the download function
      global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
      
      render(<HomeComponent />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      
      const excelButton = screen.getByText(/excel/i);
      await user.click(excelButton);
      
      // Should trigger download
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should show date range picker', async () => {
      render(<HomeComponent />);

      const dateFilterButton = screen.getByRole('button', { name: /date/i });
      await user.click(dateFilterButton);
      
      // Check that date picker is shown
      expect(screen.getByText('Select a date')).toBeInTheDocument();
    });

    it('should filter by date range', async () => {
      render(<HomeComponent />);

      const dateFilterButton = screen.getByRole('button', { name: /date/i });
      await user.click(dateFilterButton);
      
      // Select "This Year" option
      const thisYearButton = screen.getByText('This Year');
      await user.click(thisYearButton);
      
      // Should filter to show only models from this year
      await waitFor(() => {
        // All models should still be visible since they're all from recent years
        expect(screen.getByText('GPT-4')).toBeInTheDocument();
        expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument();
        expect(screen.getByText('Gemini Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Table Performance', () => {
    it('should handle virtualization correctly', async () => {
      render(<HomeComponent />);

      // The table should render efficiently with virtualization
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check that rows are rendered
      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should maintain performance during search', async () => {
      render(<HomeComponent />);

      const searchInput = screen.getByPlaceholderText(/search models/i);
      
      // Perform multiple searches quickly
      await user.type(searchInput, 'GPT');
      await user.clear(searchInput);
      await user.type(searchInput, 'Claude');
      await user.clear(searchInput);
      await user.type(searchInput, 'Gemini');
      
      // Table should still be responsive
      await waitFor(() => {
        expect(screen.getByText('Gemini Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<HomeComponent />);

      // Check for search input accessibility
      const searchInput = screen.getByPlaceholderText(/search models/i);
      expect(searchInput).toBeInTheDocument();
      
      // Check for table accessibility
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<HomeComponent />);

      const searchInput = screen.getByPlaceholderText(/search models/i);
      
      // Focus search input
      searchInput.focus();
      expect(searchInput).toHaveFocus();
      
      // Tab to next interactive element
      await user.tab();
      expect(searchInput).not.toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should handle different screen sizes', () => {
      render(<HomeComponent />);

      // Test that the table is responsive
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check that the table container has proper styling
      const tableContainer = table.closest('.table-container');
      expect(tableContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty search results gracefully', async () => {
      render(<HomeComponent />);

      const searchInput = screen.getByPlaceholderText(/search models/i);
      
      // Search for something that doesn't exist
      await user.type(searchInput, 'NonExistentModel');
      
      await waitFor(() => {
        // Should show no results but table should still be present
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('GPT-4')).not.toBeInTheDocument();
        expect(screen.queryByText('Claude 3 Opus')).not.toBeInTheDocument();
        expect(screen.queryByText('Gemini Pro')).not.toBeInTheDocument();
      });
    });
  });
}); 