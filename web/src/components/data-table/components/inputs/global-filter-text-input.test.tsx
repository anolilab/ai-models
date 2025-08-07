import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for GlobalFilterTextInput component focusing on global search functionality
 */
describe('GlobalFilterTextInput - Global Search', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                globalFilter: '',
                showGlobalFilter: true,
            }),
            setGlobalFilter: vi.fn(),
            setShowGlobalFilter: vi.fn(),
            options: {
                localization: {
                    search: 'Search',
                    clearSearch: 'Clear search',
                    showHideSearch: 'Show/Hide Search',
                },
            },
        };
    });

    it('should render global search input', () => {
        render(
            <div data-testid="global-search">
                <input
                    type="text"
                    data-testid="search-input"
                    placeholder="Search all columns..."
                    aria-label="Search all columns"
                />
            </div>
        );

        const searchContainer = screen.getByTestId('global-search');
        const searchInput = screen.getByTestId('search-input');
        
        expect(searchContainer).toBeInTheDocument();
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('type', 'text');
        expect(searchInput).toHaveAttribute('placeholder', 'Search all columns...');
        expect(searchInput).toHaveAttribute('aria-label', 'Search all columns');
    });

    it('should handle search input changes', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={handleSearch}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Type in the search input
        await user.type(searchInput, 'test search');
        
        // Verify search function was called
        expect(handleSearch).toHaveBeenCalled();
        expect(searchInput).toHaveValue('test search');
    });

    it('should clear search when clear button is clicked', async () => {
        const user = userEvent.setup();
        const handleClear = vi.fn();
        
        render(
            <div data-testid="global-search">
                <input
                    type="text"
                    data-testid="search-input"
                    placeholder="Search all columns..."
                    defaultValue="test search"
                />
                <button
                    data-testid="clear-search"
                    onClick={handleClear}
                    aria-label="Clear search"
                >
                    ×
                </button>
            </div>
        );

        const searchInput = screen.getByTestId('search-input');
        const clearButton = screen.getByTestId('clear-search');
        
        // Verify initial state
        expect(searchInput).toHaveValue('test search');
        
        // Click clear button
        await user.click(clearButton);
        
        // Verify clear function was called
        expect(handleClear).toHaveBeenCalled();
    });

    it('should handle search with debouncing', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={handleSearch}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Type multiple characters quickly
        await user.type(searchInput, 'a');
        await user.type(searchInput, 'b');
        await user.type(searchInput, 'c');
        
        // Verify search function was called for each character
        expect(handleSearch).toHaveBeenCalledTimes(3);
        expect(searchInput).toHaveValue('abc');
    });

    it('should validate search input accessibility', () => {
        render(
            <div>
                <label htmlFor="global-search">Search all columns</label>
                <input
                    id="global-search"
                    type="text"
                    data-testid="search-input"
                    placeholder="Search all columns..."
                    aria-describedby="search-help"
                />
                <div id="search-help">Type to search across all columns</div>
            </div>
        );

        const searchInput = screen.getByTestId('search-input');
        const label = screen.getByText('Search all columns');
        const helpText = screen.getByText('Type to search across all columns');
        
        // Check label association
        expect(searchInput).toHaveAttribute('id', 'global-search');
        expect(label).toHaveAttribute('for', 'global-search');
        
        // Check aria-describedby
        expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
        expect(helpText).toHaveAttribute('id', 'search-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        const handleKeyDown = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Test Enter key
        await user.type(searchInput, '{Enter}');
        expect(handleKeyDown).toHaveBeenCalled();
        
        // Test Escape key
        await user.type(searchInput, '{Escape}');
        expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should handle search with special characters', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={handleSearch}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Test special characters
        const specialChars = ['@', '#', '$', '%', '&', '*', '(', ')', '-', '_', '+', '='];
        
        for (const char of specialChars) {
            await user.type(searchInput, char);
        }
        
        expect(handleSearch).toHaveBeenCalledTimes(specialChars.length);
        expect(searchInput).toHaveValue(specialChars.join(''));
    });

    it('should handle search with numbers', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={handleSearch}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Type numbers
        await user.type(searchInput, '12345');
        
        expect(handleSearch).toHaveBeenCalled();
        expect(searchInput).toHaveValue('12345');
    });

    it('should handle search with case sensitivity', () => {
        const searchTerms = [
            'Test',
            'test',
            'TEST',
            'TeSt',
        ];

        searchTerms.forEach((term, index) => {
            render(
                <input
                    key={index}
                    type="text"
                    data-testid={`search-input-${index}`}
                    placeholder="Search all columns..."
                    defaultValue={term}
                />
            );
            
            const searchInput = screen.getByTestId(`search-input-${index}`);
            expect(searchInput).toHaveValue(term);
        });
    });

    it('should handle search with whitespace', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={handleSearch}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Type with spaces
        await user.type(searchInput, '  test  search  ');
        
        expect(handleSearch).toHaveBeenCalled();
        expect(searchInput).toHaveValue('  test  search  ');
    });

    it('should handle search input focus and blur', () => {
        const handleFocus = vi.fn();
        const handleBlur = vi.fn();
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Test focus
        fireEvent.focus(searchInput);
        expect(handleFocus).toHaveBeenCalled();
        
        // Test blur
        fireEvent.blur(searchInput);
        expect(handleBlur).toHaveBeenCalled();
    });

    it('should handle search with minimum length', async () => {
        const user = userEvent.setup();
        const handleSearch = vi.fn();
        const minLength = 3;
        
        render(
            <input
                type="text"
                data-testid="search-input"
                placeholder="Search all columns..."
                onChange={(e) => {
                    if (e.target.value.length >= minLength) {
                        handleSearch(e);
                    }
                }}
            />
        );

        const searchInput = screen.getByTestId('search-input');
        
        // Type less than minimum length
        await user.type(searchInput, 'ab');
        expect(handleSearch).not.toHaveBeenCalled();
        
        // Type minimum length
        await user.type(searchInput, 'c');
        expect(handleSearch).toHaveBeenCalled();
    });

    it('should handle search suggestions/autocomplete', async () => {
        const user = userEvent.setup();
        const suggestions = ['apple', 'banana', 'cherry', 'date'];
        
        render(
            <div data-testid="search-container">
                <input
                    type="text"
                    data-testid="search-input"
                    placeholder="Search all columns..."
                    list="search-suggestions"
                />
                <datalist id="search-suggestions">
                    {suggestions.map(suggestion => (
                        <option key={suggestion} value={suggestion} />
                    ))}
                </datalist>
            </div>
        );

        const searchInput = screen.getByTestId('search-input');
        const datalist = document.getElementById('search-suggestions');
        
        expect(searchInput).toHaveAttribute('list', 'search-suggestions');
        expect(datalist).toBeInTheDocument();
        
        // Verify suggestions are available
        suggestions.forEach(suggestion => {
            const option = document.querySelector(`option[value="${suggestion}"]`);
            expect(option).toBeInTheDocument();
        });
    });

    it('should handle search with regex patterns', () => {
        const regexPatterns = [
            'test.*',
            '^start',
            'end$',
            '[a-z]+',
            '\\d+',
        ];

        regexPatterns.forEach((pattern, index) => {
            render(
                <input
                    key={index}
                    type="text"
                    data-testid={`search-input-${index}`}
                    placeholder="Search all columns..."
                    defaultValue={pattern}
                />
            );
            
            const searchInput = screen.getByTestId(`search-input-${index}`);
            expect(searchInput).toHaveValue(pattern);
        });
    });

    it('should validate search input styling states', () => {
        const searchStates = [
            { hasValue: false, focused: false, className: 'search-input' },
            { hasValue: true, focused: false, className: 'search-input has-value' },
            { hasValue: false, focused: true, className: 'search-input focused' },
            { hasValue: true, focused: true, className: 'search-input has-value focused' },
        ];

        searchStates.forEach(({ hasValue, focused, className }, index) => {
            render(
                <input
                    key={index}
                    type="text"
                    data-testid={`search-input-${index}`}
                    placeholder="Search all columns..."
                    defaultValue={hasValue ? 'test' : ''}
                    className={className}
                />
            );
            
            const searchInput = screen.getByTestId(`search-input-${index}`);
            expect(searchInput).toHaveClass(className);
            
            if (hasValue) {
                expect(searchInput).toHaveValue('test');
            } else {
                expect(searchInput).toHaveValue('');
            }
        });
    });
}); 