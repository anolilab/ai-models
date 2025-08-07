import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHeadCellFilterLabel } from './table-head-cell-filter-label';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('./table-head-cell-filter-container', () => ({
    TableHeadCellFilterContainer: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="filter-container" data-header-id={header.id}>
            Filter Container
        </div>
    ),
}));

/**
 * Test for TableHeadCellFilterLabel component focusing on filter label functionality
 */
describe('TableHeadCellFilterLabel - Filter Label Functionality', () => {
    let mockTable: any;
    let mockHeader: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            columnFilterDisplayMode: 'subheader',
            localization: {
                filterByColumn: 'Filter by {column}',
                filteringByColumn: 'Filtering {column} by {filterType} "{filterValue}"',
                and: 'and',
                or: 'or',
            },
        };
        mockTable.refs = {
            filterInputRefs: {
                current: {
                    'name-0': { focus: vi.fn(), select: vi.fn() },
                },
            },
        };
        mockTable.setShowColumnFilters = vi.fn();

        // Create mock column
        mockColumn = {
            id: 'name',
            getFilterValue: vi.fn(() => 'test value'),
            columnDef: {
                header: 'Name',
                _filterFn: 'contains',
                filterVariant: 'text',
                filterTooltipValueFn: (value: any) => String(value),
            },
        };

        // Create mock header
        mockHeader = {
            id: 'name',
            column: mockColumn,
        };
    });

    it('should render filter label button', () => {
        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveAttribute('aria-label');
    });

    it('should show filter icon', () => {
        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        // The Filter icon should be present
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle filter button click in subheader mode', async () => {
        const user = userEvent.setup();

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        await user.click(filterButton);

        expect(mockTable.setShowColumnFilters).toHaveBeenCalledWith(true);
    });

    it('should handle filter button click in popover mode', async () => {
        const user = userEvent.setup();
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        await user.click(filterButton);

        expect(screen.getByTestId('filter-container')).toBeInTheDocument();
    });

    it('should focus input after button click', async () => {
        const user = userEvent.setup();

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        await user.click(filterButton);

        // Wait for the setTimeout to execute
        await new Promise(resolve => setTimeout(resolve, 150));

        expect(mockTable.refs.filterInputRefs.current['name-0'].focus).toHaveBeenCalled();
        expect(mockTable.refs.filterInputRefs.current['name-0'].select).toHaveBeenCalled();
    });

    it('should show active filter state when filter is applied', () => {
        mockColumn.getFilterValue = vi.fn(() => 'active filter');

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveClass('text-blue-600');
    });

    it('should show inactive filter state when no filter is applied', () => {
        mockColumn.getFilterValue = vi.fn(() => '');

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveClass('text-gray-600');
    });

    it('should show filter tooltip with active filter', () => {
        mockColumn.getFilterValue = vi.fn(() => 'test value');

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "test value"');
    });

    it('should show filter tooltip for popover mode when no filter', () => {
        mockTable.options.columnFilterDisplayMode = 'popover';
        mockColumn.getFilterValue = vi.fn(() => '');

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filter by Name');
    });

    it('should handle range filter values', () => {
        mockColumn.getFilterValue = vi.fn(() => ['min', 'max']);
        mockColumn.columnDef._filterFn = 'between';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by between "min" and "max"');
    });

    it('should handle array filter values with or separator', () => {
        mockColumn.getFilterValue = vi.fn(() => ['value1', 'value2']);
        mockColumn.columnDef._filterFn = 'inNumberRange';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by inNumberRange "value1" or "value2"');
    });

    it('should handle custom filter tooltip value function', () => {
        mockColumn.getFilterValue = vi.fn(() => 'raw value');
        mockColumn.columnDef.filterTooltipValueFn = (value: any) => `Custom: ${value}`;

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "Custom: raw value"');
    });

    it('should not render when shouldShow is false', () => {
        mockColumn.getFilterValue = vi.fn(() => '');
        mockTable.options.columnFilterDisplayMode = 'subheader';

        const { container } = render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should render in popover mode even with no filter', () => {
        mockColumn.getFilterValue = vi.fn(() => '');
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with range filter even with partial values', () => {
        mockColumn.getFilterValue = vi.fn(() => ['min', '']);
        mockColumn.columnDef._filterFn = 'between';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply custom className and style', () => {
        render(
            <TableHeadCellFilterLabel
                className="custom-filter-label-class"
                header={mockHeader}
                style={{ color: 'blue' }}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveClass('custom-filter-label-class');
        expect(filterButton).toHaveStyle('color: blue');
    });

    it('should handle missing localization', () => {
        mockTable.options.localization = undefined;

        const { container } = render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should handle missing filterInputRefs', () => {
        mockTable.refs.filterInputRefs.current = {};

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle popover open/close state', async () => {
        const user = userEvent.setup();
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        
        // Click to open popover
        await user.click(filterButton);
        expect(screen.getByTestId('filter-container')).toBeInTheDocument();

        // Click again to close popover
        await user.click(filterButton);
        expect(screen.queryByTestId('filter-container')).not.toBeInTheDocument();
    });

    it('should handle keyboard interactions in popover', async () => {
        const user = userEvent.setup();
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        await user.click(filterButton);

        const popoverContent = screen.getByTestId('filter-container').parentElement;
        expect(popoverContent).toBeInTheDocument();

        // Test Enter key closes popover
        fireEvent.keyDown(popoverContent!, { key: 'Enter' });
        expect(screen.queryByTestId('filter-container')).not.toBeInTheDocument();
    });

    it('should handle mouse events in popover', async () => {
        const user = userEvent.setup();
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        await user.click(filterButton);

        const popoverContent = screen.getByTestId('filter-container').parentElement;
        expect(popoverContent).toBeInTheDocument();

        // Test mouse down event
        fireEvent.mouseDown(popoverContent!);
        expect(screen.getByTestId('filter-container')).toBeInTheDocument();
    });

    it('should handle click events in popover', async () => {
        const user = userEvent.setup();
        mockTable.options.columnFilterDisplayMode = 'popover';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        await user.click(filterButton);

        const popoverContent = screen.getByTestId('filter-container').parentElement;
        expect(popoverContent).toBeInTheDocument();

        // Test click event
        fireEvent.click(popoverContent!);
        expect(screen.getByTestId('filter-container')).toBeInTheDocument();
    });

    it('should handle empty filter values gracefully', () => {
        mockColumn.getFilterValue = vi.fn(() => ['', '']);

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains ""');
    });

    it('should handle null filter values', () => {
        mockColumn.getFilterValue = vi.fn(() => null);

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "null"');
    });

    it('should handle undefined filter values', () => {
        mockColumn.getFilterValue = vi.fn(() => undefined);

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "undefined"');
    });

    it('should handle boolean filter values', () => {
        mockColumn.getFilterValue = vi.fn(() => true);

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "true"');
    });

    it('should handle number filter values', () => {
        mockColumn.getFilterValue = vi.fn(() => 42);

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "42"');
    });

    it('should handle complex filter values', () => {
        mockColumn.getFilterValue = vi.fn(() => ['value1', 'value2', 'value3']);
        mockColumn.columnDef._filterFn = 'inNumberRange';

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by inNumberRange "value1" or "value2" or "value3"');
    });

    it('should handle filter values with special characters', () => {
        mockColumn.getFilterValue = vi.fn(() => 'test "quoted" value');

        render(
            <TableHeadCellFilterLabel
                header={mockHeader}
                table={mockTable}
            />
        );

        const filterButton = screen.getByRole('button');
        expect(filterButton).toHaveAttribute('aria-label', 'Filtering Name by contains "test \\"quoted\\" value"');
    });
}); 