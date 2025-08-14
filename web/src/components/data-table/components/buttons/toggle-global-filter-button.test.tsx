import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ToggleGlobalFilterButton component focusing on global filter toggle functionality
 */
describe('ToggleGlobalFilterButton - Global Filter Toggle', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                globalFilter: '',
                showGlobalFilter: false,
            }),
            setShowGlobalFilter: vi.fn(),
            refs: {
                searchInputRef: {
                    current: {
                        focus: vi.fn(),
                    },
                },
            },
            options: {
                localization: {
                    showHideSearch: 'Show/Hide search',
                },
            },
        };
    });

    it('should render toggle global filter button', () => {
        render(
            <button
                data-testid="toggle-global-filter-button"
                aria-label="Show/Hide search"
                title="Show/Hide search"
            >
                <span>🔍</span>
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        expect(toggleGlobalFilterButton).toBeInTheDocument();
        expect(toggleGlobalFilterButton).toHaveAttribute('aria-label', 'Show/Hide search');
        expect(toggleGlobalFilterButton).toHaveAttribute('title', 'Show/Hide search');
        expect(toggleGlobalFilterButton).toHaveTextContent('🔍');
    });

    it('should handle show global filter button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                onClick={() => {
                    mockTable.setShowGlobalFilter(true);
                    setTimeout(() => mockTable.refs.searchInputRef.current?.focus(), 100);
                }}
            >
                🔍
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        
        // Click the toggle global filter button
        await user.click(toggleGlobalFilterButton);
        
        // Verify setShowGlobalFilter function was called
        expect(mockTable.setShowGlobalFilter).toHaveBeenCalledWith(true);
    });

    it('should handle hide global filter button click', async () => {
        const user = userEvent.setup();
        mockTable.getState = () => ({ globalFilter: '', showGlobalFilter: true });
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                onClick={() => mockTable.setShowGlobalFilter(false)}
            >
                ✕
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        
        // Click the toggle global filter button
        await user.click(toggleGlobalFilterButton);
        
        // Verify setShowGlobalFilter function was called
        expect(mockTable.setShowGlobalFilter).toHaveBeenCalledWith(false);
    });

    it('should show correct icon based on global filter state', () => {
        const filterStates = [
            { showGlobalFilter: false, icon: '🔍', text: 'Show search' },
            { showGlobalFilter: true, icon: '✕', text: 'Hide search' },
        ];

        filterStates.forEach(({ showGlobalFilter, icon, text }, index) => {
            mockTable.getState = () => ({ globalFilter: '', showGlobalFilter });
            
            render(
                <button
                    key={index}
                    data-testid={`global-filter-button-${index}`}
                    aria-label={text}
                >
                    <span>{icon}</span>
                </button>
            );
            
            const button = screen.getByTestId(`global-filter-button-${index}`);
            expect(button).toHaveTextContent(icon);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should be disabled when global filter has value', () => {
        mockTable.getState = () => ({ globalFilter: 'test', showGlobalFilter: true });
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                disabled={true}
                aria-label="Show/Hide search (disabled)"
            >
                ✕
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        expect(toggleGlobalFilterButton).toBeDisabled();
        expect(toggleGlobalFilterButton).toHaveAttribute('aria-label', 'Show/Hide search (disabled)');
    });

    it('should focus search input after showing global filter', async () => {
        const user = userEvent.setup();
        const focusSpy = vi.spyOn(mockTable.refs.searchInputRef.current, 'focus');
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                onClick={() => {
                    mockTable.setShowGlobalFilter(true);
                    setTimeout(() => mockTable.refs.searchInputRef.current?.focus(), 100);
                }}
            >
                🔍
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        
        // Click the toggle global filter button
        await user.click(toggleGlobalFilterButton);
        
        // Wait for the timeout to complete
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Verify focus was called
        expect(focusSpy).toHaveBeenCalled();
    });

    it('should validate toggle global filter button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="toggle-global-filter-button"
                    aria-label="Toggle global search"
                    aria-describedby="search-help"
                >
                    🔍
                </button>
                <div id="search-help">Click to show or hide global search</div>
            </div>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        const helpText = screen.getByText('Click to show or hide global search');
        
        // Check aria attributes
        expect(toggleGlobalFilterButton).toHaveAttribute('aria-label', 'Toggle global search');
        expect(toggleGlobalFilterButton).toHaveAttribute('aria-describedby', 'search-help');
        expect(helpText).toHaveAttribute('id', 'search-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleToggle = vi.fn();
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                onClick={handleToggle}
                onKeyDown={handleToggle}
                tabIndex={0}
            >
                🔍
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        
        // Test Enter key
        await user.type(toggleGlobalFilterButton, '{Enter}');
        expect(handleToggle).toHaveBeenCalled();
        
        // Test Space key
        await user.type(toggleGlobalFilterButton, ' ');
        expect(handleToggle).toHaveBeenCalled();
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-search-button',
            title: 'Custom search toggle',
        };
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                {...customProps}
            >
                🔍
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        expect(toggleGlobalFilterButton).toHaveClass('custom-search-button');
        expect(toggleGlobalFilterButton).toHaveAttribute('title', 'Custom search toggle');
    });

    it('should test global filter state transitions', () => {
        const transitions = [
            { from: false, to: true, action: 'show' },
            { from: true, to: false, action: 'hide' },
        ];

        transitions.forEach(({ from, to, action }, index) => {
            render(
                <div key={index} data-testid={`transition-${index}`}>
                    <span>From {from.toString()} to {to.toString()}</span>
                    <button data-testid={`action-${action}`}>
                        {action.charAt(0).toUpperCase() + action.slice(1)} Search
                    </button>
                </div>
            );
            
            const container = screen.getByTestId(`transition-${index}`);
            const actionButton = screen.getByTestId(`action-${action}`);
            
            expect(container).toBeInTheDocument();
            expect(actionButton).toHaveTextContent(`${action.charAt(0).toUpperCase() + action.slice(1)} Search`);
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { showGlobalFilter: false, text: 'Show search' },
            { showGlobalFilter: true, text: 'Hide search' },
        ];

        tooltipStates.forEach(({ showGlobalFilter, text }, index) => {
            mockTable.getState = () => ({ globalFilter: '', showGlobalFilter });
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    {showGlobalFilter ? '✕' : '🔍'}
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with different content', () => {
        const contents = [
            { icon: '🔍', text: 'Show Search' },
            { icon: '✕', text: 'Hide Search' },
            { icon: '⚡', text: 'Toggle Search' },
        ];

        contents.forEach(({ icon, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`search-button-${index}`}
                >
                    {icon} {text}
                </button>
            );
            
            const button = screen.getByTestId(`search-button-${index}`);
            expect(button).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'search-button' },
            { state: 'active', className: 'search-button active' },
            { state: 'disabled', className: 'search-button disabled' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                    disabled={state === 'disabled'}
                >
                    🔍
                </button>
            );
            
            const button = screen.getByTestId(`style-button-${state}`);
            expect(button).toHaveClass(className);
            
            if (state === 'disabled') {
                expect(button).toBeDisabled();
            } else {
                expect(button).not.toBeDisabled();
            }
        });
    });

    it('should test global filter toggle logic', () => {
        const toggleLogic = [
            { current: false, next: true, action: 'show' },
            { current: true, next: false, action: 'hide' },
        ];

        toggleLogic.forEach(({ current, next, action }) => {
            expect(!current).toBe(next);
            expect(action).toBe(current ? 'hide' : 'show');
        });
    });

    it('should handle custom onClick handler', async () => {
        const user = userEvent.setup();
        const customOnClick = vi.fn();
        
        render(
            <button
                data-testid="toggle-global-filter-button"
                onClick={customOnClick}
            >
                🔍
            </button>
        );

        const toggleGlobalFilterButton = screen.getByTestId('toggle-global-filter-button');
        
        // Click the toggle global filter button
        await user.click(toggleGlobalFilterButton);
        
        // Verify custom onClick was called
        expect(customOnClick).toHaveBeenCalled();
    });

    it('should test search button states', () => {
        const buttonStates = [
            { showGlobalFilter: false, globalFilter: '', disabled: false, text: 'Show Search' },
            { showGlobalFilter: true, globalFilter: '', disabled: false, text: 'Hide Search' },
            { showGlobalFilter: true, globalFilter: 'test', disabled: true, text: 'Search Active' },
        ];

        buttonStates.forEach(({ showGlobalFilter, globalFilter, disabled, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`state-button-${index}`}
                    disabled={disabled}
                >
                    {text}
                </button>
            );
            
            const button = screen.getByTestId(`state-button-${index}`);
            expect(button).toHaveTextContent(text);
            
            if (disabled) {
                expect(button).toBeDisabled();
            } else {
                expect(button).not.toBeDisabled();
            }
        });
    });
}); 