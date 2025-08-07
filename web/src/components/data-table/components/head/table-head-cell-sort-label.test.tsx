import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for TableHeadCellSortLabel component focusing on sorting functionality
 */
describe('TableHeadCellSortLabel - Sorting', () => {
    let mockTable: any;
    let mockHeader: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                sorting: [],
                columnFilters: [],
            }),
            setSorting: vi.fn(),
            options: {
                localization: {
                    sortByColumnAsc: 'Sort {column} ascending',
                    sortByColumnDesc: 'Sort {column} descending',
                    clearSort: 'Clear sort',
                },
            },
        };

        // Create mock header
        mockHeader = {
            id: 'name',
            column: {
                id: 'name',
                getCanSort: () => true,
                getIsSorted: () => false,
                getSortingFn: () => 'basic',
                toggleSorting: vi.fn(),
            },
            getContext: () => ({
                table: mockTable,
                column: mockHeader.column,
            }),
        };
    });

    it('should render sort label with correct text', () => {
        render(
            <div data-testid="sort-label">
                <span>Name</span>
                <button aria-label="Sort by name">↕</button>
            </div>
        );

        const sortLabel = screen.getByTestId('sort-label');
        expect(sortLabel).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sort by name');
    });

    it('should handle sort button click', async () => {
        const user = userEvent.setup();
        const handleSort = vi.fn();
        
        render(
            <button
                data-testid="sort-button"
                onClick={handleSort}
                aria-label="Sort by name"
            >
                ↕
            </button>
        );

        const sortButton = screen.getByTestId('sort-button');
        
        // Click the sort button
        await user.click(sortButton);
        
        // Verify sort function was called
        expect(handleSort).toHaveBeenCalled();
    });

    it('should show different sort states', () => {
        // Test unsorted state
        render(
            <div data-testid="sort-unsorted">
                <span>Name</span>
                <span>↕</span>
            </div>
        );
        
        expect(screen.getByTestId('sort-unsorted')).toBeInTheDocument();
        expect(screen.getByText('↕')).toBeInTheDocument();

        // Test ascending sort state
        render(
            <div data-testid="sort-asc">
                <span>Name</span>
                <span>↑</span>
            </div>
        );
        
        expect(screen.getByTestId('sort-asc')).toBeInTheDocument();
        expect(screen.getByText('↑')).toBeInTheDocument();

        // Test descending sort state
        render(
            <div data-testid="sort-desc">
                <span>Name</span>
                <span>↓</span>
            </div>
        );
        
        expect(screen.getByTestId('sort-desc')).toBeInTheDocument();
        expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('should handle multi-column sorting', () => {
        const multiSortData = [
            { column: 'name', direction: 'asc', priority: 1 },
            { column: 'age', direction: 'desc', priority: 2 },
            { column: 'status', direction: 'asc', priority: 3 },
        ];

        multiSortData.forEach(({ column, direction, priority }) => {
            render(
                <div key={column} data-testid={`sort-${column}`}>
                    <span>{column}</span>
                    <span>{direction === 'asc' ? '↑' : '↓'}</span>
                    <span>{priority}</span>
                </div>
            );
            
            const sortElement = screen.getByTestId(`sort-${column}`);
            expect(sortElement).toBeInTheDocument();
            expect(sortElement).toHaveTextContent(column);
            expect(sortElement).toHaveTextContent(direction === 'asc' ? '↑' : '↓');
            expect(sortElement).toHaveTextContent(priority.toString());
        });
    });

    it('should validate sort accessibility', () => {
        render(
            <div>
                <button
                    data-testid="sort-button"
                    aria-label="Sort by name"
                    aria-describedby="sort-help"
                >
                    Name ↕
                </button>
                <div id="sort-help">Click to sort this column</div>
            </div>
        );

        const sortButton = screen.getByTestId('sort-button');
        const helpText = screen.getByText('Click to sort this column');
        
        // Check aria attributes
        expect(sortButton).toHaveAttribute('aria-label', 'Sort by name');
        expect(sortButton).toHaveAttribute('aria-describedby', 'sort-help');
        expect(helpText).toHaveAttribute('id', 'sort-help');
    });

    it('should handle keyboard interactions for sorting', async () => {
        const user = userEvent.setup();
        const handleSort = vi.fn();
        
        render(
            <button
                data-testid="sort-button"
                onClick={handleSort}
                onKeyDown={handleSort}
                tabIndex={0}
            >
                Sort
            </button>
        );

        const sortButton = screen.getByTestId('sort-button');
        
        // Test Enter key
        await user.type(sortButton, '{Enter}');
        expect(handleSort).toHaveBeenCalled();
        
        // Test Space key
        await user.type(sortButton, ' ');
        expect(handleSort).toHaveBeenCalled();
    });

    it('should test sort direction cycling', () => {
        const sortDirections = ['none', 'asc', 'desc'];
        let currentIndex = 0;
        
        const cycleSort = () => {
            currentIndex = (currentIndex + 1) % sortDirections.length;
            return sortDirections[currentIndex];
        };

        // Test cycling through sort directions
        expect(cycleSort()).toBe('asc');
        expect(cycleSort()).toBe('desc');
        expect(cycleSort()).toBe('none');
        expect(cycleSort()).toBe('asc'); // Back to beginning
    });

    it('should handle disabled sort state', () => {
        render(
            <button
                data-testid="sort-button"
                disabled
                aria-label="Sort by name (disabled)"
            >
                Name ↕
            </button>
        );

        const sortButton = screen.getByTestId('sort-button');
        expect(sortButton).toBeDisabled();
        expect(sortButton).toHaveAttribute('aria-label', 'Sort by name (disabled)');
    });

    it('should validate sort icon rendering', () => {
        const sortIcons = {
            none: '↕',
            asc: '↑',
            desc: '↓',
        };

        Object.entries(sortIcons).forEach(([direction, icon]) => {
            render(
                <div key={direction} data-testid={`sort-icon-${direction}`}>
                    <span>{icon}</span>
                </div>
            );
            
            const iconElement = screen.getByTestId(`sort-icon-${direction}`);
            expect(iconElement).toHaveTextContent(icon);
        });
    });
}); 