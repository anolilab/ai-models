import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHeadCellFilterContainer } from './table-head-cell-filter-container';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child components
vi.mock('../inputs/filter-checkbox', () => ({
    FilterCheckbox: ({ column, table }: { column: any; table: any }) => (
        <div data-testid="filter-checkbox" data-column-id={column.id}>
            Filter Checkbox
        </div>
    ),
}));

vi.mock('../inputs/filter-range-fields', () => ({
    FilterRangeFields: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="filter-range-fields" data-header-id={header.id}>
            Filter Range Fields
        </div>
    ),
}));

vi.mock('../inputs/filter-range-slider', () => ({
    FilterRangeSlider: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="filter-range-slider" data-header-id={header.id}>
            Filter Range Slider
        </div>
    ),
}));

vi.mock('../inputs/filter-text-input', () => ({
    FilterTextInput: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="filter-text-input" data-header-id={header.id}>
            Filter Text Input
        </div>
    ),
}));

vi.mock('../menus/filter-option-menu', () => ({
    FilterOptionMenu: ({ header, table, onSelect }: { header: any; table: any; onSelect: any }) => (
        <div data-testid="filter-option-menu" data-header-id={header.id}>
            Filter Option Menu
            <button onClick={onSelect}>Select Option</button>
        </div>
    ),
}));

/**
 * Test for TableHeadCellFilterContainer component focusing on filter container functionality
 */
describe('TableHeadCellFilterContainer - Filter Container Functionality', () => {
    let mockTable: any;
    let mockHeader: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            columnFilterDisplayMode: 'subheader',
            columnFilterModeOptions: ['contains', 'equals', 'startsWith'],
            enableColumnFilterModes: true,
            localization: {
                changeFilterMode: 'Change filter mode',
                filterMode: 'Filter mode: {filterType}',
            },
        };
        mockTable.refs = {
            filterInputRefs: {
                current: {
                    'name-0': { focus: vi.fn(), select: vi.fn() },
                },
            },
        };
        mockTable.getState = vi.fn(() => ({
            showColumnFilters: true,
        }));

        // Create mock column
        mockColumn = {
            id: 'name',
            columnDef: {
                header: 'Name',
                _filterFn: 'contains',
                filterVariant: 'text',
                enableColumnFilterModes: true,
                columnFilterModeOptions: ['contains', 'equals'],
            },
        };

        // Create mock header
        mockHeader = {
            id: 'name',
            column: mockColumn,
        };
    });

    it('should render filter container with text input by default', () => {
        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-text-input')).toBeInTheDocument();
        expect(screen.getByTestId('filter-text-input')).toHaveAttribute('data-header-id', 'name');
    });

    it('should render checkbox filter when filterVariant is checkbox', () => {
        mockColumn.columnDef.filterVariant = 'checkbox';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-checkbox')).toBeInTheDocument();
        expect(screen.getByTestId('filter-checkbox')).toHaveAttribute('data-column-id', 'name');
    });

    it('should render range slider when filterVariant is range-slider', () => {
        mockColumn.columnDef.filterVariant = 'range-slider';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-range-slider')).toBeInTheDocument();
        expect(screen.getByTestId('filter-range-slider')).toHaveAttribute('data-header-id', 'name');
    });

    it('should render range fields for date-range filterVariant', () => {
        mockColumn.columnDef.filterVariant = 'date-range';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-range-fields')).toBeInTheDocument();
        expect(screen.getByTestId('filter-range-fields')).toHaveAttribute('data-header-id', 'name');
    });

    it('should render range fields for range filterVariant', () => {
        mockColumn.columnDef.filterVariant = 'range';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-range-fields')).toBeInTheDocument();
    });

    it('should render range fields for between filter function', () => {
        mockColumn.columnDef._filterFn = 'between';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-range-fields')).toBeInTheDocument();
    });

    it('should render range fields for betweenInclusive filter function', () => {
        mockColumn.columnDef._filterFn = 'betweenInclusive';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-range-fields')).toBeInTheDocument();
    });

    it('should render range fields for inNumberRange filter function', () => {
        mockColumn.columnDef._filterFn = 'inNumberRange';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-range-fields')).toBeInTheDocument();
    });

    it('should show filter mode button when enabled', () => {
        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button', { name: 'Change filter mode' })).toBeInTheDocument();
    });

    it('should not show filter mode button when disabled', () => {
        mockTable.options.enableColumnFilterModes = false;

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByRole('button', { name: 'Change filter mode' })).not.toBeInTheDocument();
    });

    it('should not show filter mode button when column disables it', () => {
        mockColumn.columnDef.enableColumnFilterModes = false;

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByRole('button', { name: 'Change filter mode' })).not.toBeInTheDocument();
    });

    it('should show filter mode text when mode button is present', () => {
        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByText('Filter mode: contains')).toBeInTheDocument();
    });

    it('should not show filter mode text when mode button is not present', () => {
        mockTable.options.enableColumnFilterModes = false;

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByText('Filter mode: contains')).not.toBeInTheDocument();
    });

    it('should handle filter mode selection', async () => {
        const user = userEvent.setup();

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        const modeButton = screen.getByRole('button', { name: 'Change filter mode' });
        await user.click(modeButton);

        expect(screen.getByTestId('filter-option-menu')).toBeInTheDocument();
    });

    it('should focus input after filter mode selection', async () => {
        const user = userEvent.setup();

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        const modeButton = screen.getByRole('button', { name: 'Change filter mode' });
        await user.click(modeButton);

        const selectButton = screen.getByText('Select Option');
        await user.click(selectButton);

        // Wait for the setTimeout to execute
        await new Promise(resolve => setTimeout(resolve, 150));

        expect(mockTable.refs.filterInputRefs.current['name-0'].focus).toHaveBeenCalled();
    });

    it('should not render when showColumnFilters is false and display mode is not popover', () => {
        mockTable.getState = vi.fn(() => ({
            showColumnFilters: false,
        }));

        const { container } = render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should render when display mode is popover even if showColumnFilters is false', () => {
        mockTable.getState = vi.fn(() => ({
            showColumnFilters: false,
        }));
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-text-input')).toBeInTheDocument();
    });

    it('should apply custom className and style', () => {
        render(
            <TableHeadCellFilterContainer
                className="custom-filter-class"
                header={mockHeader}
                style={{ color: 'blue' }}
                table={mockTable}
            />
        );

        const container = screen.getByTestId('filter-text-input').parentElement?.parentElement;
        expect(container).toHaveClass('custom-filter-class');
        expect(container).toHaveStyle('color: blue');
    });

    it('should handle undefined columnFilterModeOptions', () => {
        mockColumn.columnDef.columnFilterModeOptions = undefined;

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button', { name: 'Change filter mode' })).toBeInTheDocument();
    });

    it('should handle empty columnFilterModeOptions array', () => {
        mockColumn.columnDef.columnFilterModeOptions = [];

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByRole('button', { name: 'Change filter mode' })).not.toBeInTheDocument();
    });

    it('should handle undefined global columnFilterModeOptions', () => {
        mockTable.options.columnFilterModeOptions = undefined;

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button', { name: 'Change filter mode' })).toBeInTheDocument();
    });

    it('should handle empty global columnFilterModeOptions array', () => {
        mockTable.options.columnFilterModeOptions = [];

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByRole('button', { name: 'Change filter mode' })).not.toBeInTheDocument();
    });

    it('should prioritize column-specific filter mode options', () => {
        mockTable.options.columnFilterModeOptions = ['global1', 'global2'];
        mockColumn.columnDef.columnFilterModeOptions = ['column1', 'column2'];

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button', { name: 'Change filter mode' })).toBeInTheDocument();
    });

    it('should handle missing filterInputRefs', () => {
        mockTable.refs.filterInputRefs.current = {};

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-text-input')).toBeInTheDocument();
    });

    it('should handle missing localization', () => {
        mockTable.options.localization = undefined;

        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-text-input')).toBeInTheDocument();
    });

    it('should render with flex layout', () => {
        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        const container = screen.getByTestId('filter-text-input').parentElement?.parentElement;
        expect(container).toHaveClass('flex', 'flex-col');
    });

    it('should render filter controls with proper spacing', () => {
        render(
            <TableHeadCellFilterContainer
                header={mockHeader}
                table={mockTable}
            />
        );

        const controlsContainer = screen.getByTestId('filter-text-input').parentElement;
        expect(controlsContainer).toHaveClass('flex', 'items-end', 'gap-2');
    });
}); 