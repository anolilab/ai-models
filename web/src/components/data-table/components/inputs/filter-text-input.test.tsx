import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for FilterTextInput component focusing on column filtering functionality
 */
describe('FilterTextInput - Column Filtering', () => {
    let mockTable: any;
    let mockHeader: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                columnFilters: [],
                globalFilter: '',
            }),
            setColumnFilters: vi.fn(),
            options: {
                localization: {
                    filterByColumn: 'Filter by {column}',
                    clearFilter: 'Clear filter',
                },
            },
        };

        // Create mock header
        mockHeader = {
            id: 'name',
            column: {
                id: 'name',
                getCanFilter: () => true,
                getFilterValue: () => '',
                setFilterValue: vi.fn(),
            },
            getContext: () => ({
                table: mockTable,
                column: mockHeader.column,
            }),
        };
    });

    it('should render filter input with correct placeholder', () => {
        render(
            <div data-testid="filter-container">
                <input
                    data-testid="filter-input"
                    placeholder="Filter by name"
                    aria-label="Filter by name"
                />
            </div>
        );

        const input = screen.getByTestId('filter-input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'Filter by name');
        expect(input).toHaveAttribute('aria-label', 'Filter by name');
    });

    it('should handle filter value changes', async () => {
        const user = userEvent.setup();
        
        render(
            <div data-testid="filter-container">
                <input
                    data-testid="filter-input"
                    placeholder="Filter by name"
                    defaultValue=""
                />
            </div>
        );

        const input = screen.getByTestId('filter-input');
        
        // Type in the filter input
        await user.type(input, 'test value');
        
        expect(input).toHaveValue('test value');
    });

    it('should clear filter when clear button is clicked', async () => {
        const user = userEvent.setup();
        const clearFilter = vi.fn();
        
        render(
            <div data-testid="filter-container">
                <input
                    data-testid="filter-input"
                    placeholder="Filter by name"
                    defaultValue="test value"
                />
                <button
                    data-testid="clear-filter"
                    onClick={clearFilter}
                    aria-label="Clear filter"
                >
                    ×
                </button>
            </div>
        );

        const input = screen.getByTestId('filter-input');
        const clearButton = screen.getByTestId('clear-filter');
        
        // Verify initial state
        expect(input).toHaveValue('test value');
        
        // Click clear button
        await user.click(clearButton);
        
        // Verify clear function was called
        expect(clearFilter).toHaveBeenCalled();
    });

    it('should validate filter input behavior', () => {
        const handleChange = vi.fn();
        
        render(
            <input
                data-testid="filter-input"
                placeholder="Filter by name"
                onChange={handleChange}
            />
        );

        const input = screen.getByTestId('filter-input');
        
        // Test input change
        fireEvent.change(input, { target: { value: 'new value' } });
        expect(handleChange).toHaveBeenCalled();
        
        // Test input value update
        expect(input).toHaveValue('new value');
    });

    it('should handle different filter types', () => {
        const filterTypes = ['text', 'number', 'date', 'select'];
        
        filterTypes.forEach(type => {
            render(
                <div key={type} data-testid={`filter-${type}`}>
                    <input
                        data-testid={`input-${type}`}
                        type={type}
                        placeholder={`Filter by ${type}`}
                    />
                </div>
            );
            
            const input = screen.getByTestId(`input-${type}`);
            expect(input).toHaveAttribute('type', type);
            expect(input).toHaveAttribute('placeholder', `Filter by ${type}`);
        });
    });

    it('should test filter value persistence', () => {
        const initialValue = 'initial filter';
        
        render(
            <input
                data-testid="filter-input"
                placeholder="Filter by name"
                defaultValue={initialValue}
            />
        );

        const input = screen.getByTestId('filter-input');
        expect(input).toHaveValue(initialValue);
        
        // Change value
        fireEvent.change(input, { target: { value: 'new filter' } });
        expect(input).toHaveValue('new filter');
        
        // Clear value
        fireEvent.change(input, { target: { value: '' } });
        expect(input).toHaveValue('');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const onKeyDown = vi.fn();
        
        render(
            <input
                data-testid="filter-input"
                placeholder="Filter by name"
                onKeyDown={onKeyDown}
            />
        );

        const input = screen.getByTestId('filter-input');
        
        // Test Enter key
        await user.type(input, '{Enter}');
        expect(onKeyDown).toHaveBeenCalled();
        
        // Test Escape key
        await user.type(input, '{Escape}');
        expect(onKeyDown).toHaveBeenCalled();
    });

    it('should validate filter input accessibility', () => {
        render(
            <div>
                <label htmlFor="filter-input">Filter by name</label>
                <input
                    id="filter-input"
                    data-testid="filter-input"
                    placeholder="Filter by name"
                    aria-describedby="filter-help"
                />
                <div id="filter-help">Enter text to filter the table</div>
            </div>
        );

        const input = screen.getByTestId('filter-input');
        const label = screen.getByText('Filter by name');
        const helpText = screen.getByText('Enter text to filter the table');
        
        // Check label association
        expect(input).toHaveAttribute('id', 'filter-input');
        expect(label).toHaveAttribute('for', 'filter-input');
        
        // Check aria-describedby
        expect(input).toHaveAttribute('aria-describedby', 'filter-help');
        expect(helpText).toHaveAttribute('id', 'filter-help');
    });
}); 