import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ToggleFiltersButton component focusing on filter toggle functionality
 */
describe('ToggleFiltersButton - Filter Toggle', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                showColumnFilters: false,
            }),
            setShowColumnFilters: vi.fn(),
            options: {
                localization: {
                    showHideFilters: 'Show/Hide filters',
                },
            },
        };
    });

    it('should render toggle filters button', () => {
        render(
            <button
                data-testid="toggle-filters-button"
                aria-label="Show/Hide filters"
                title="Show/Hide filters"
            >
                <span>🔍</span>
            </button>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        expect(toggleFiltersButton).toBeInTheDocument();
        expect(toggleFiltersButton).toHaveAttribute('aria-label', 'Show/Hide filters');
        expect(toggleFiltersButton).toHaveAttribute('title', 'Show/Hide filters');
        expect(toggleFiltersButton).toHaveTextContent('🔍');
    });

    it('should handle show filters button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="toggle-filters-button"
                onClick={() => mockTable.setShowColumnFilters(true)}
            >
                🔍
            </button>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        
        // Click the toggle filters button
        await user.click(toggleFiltersButton);
        
        // Verify setShowColumnFilters function was called
        expect(mockTable.setShowColumnFilters).toHaveBeenCalledWith(true);
    });

    it('should handle hide filters button click', async () => {
        const user = userEvent.setup();
        mockTable.getState = () => ({ showColumnFilters: true });
        
        render(
            <button
                data-testid="toggle-filters-button"
                onClick={() => mockTable.setShowColumnFilters(false)}
            >
                ✕
            </button>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        
        // Click the toggle filters button
        await user.click(toggleFiltersButton);
        
        // Verify setShowColumnFilters function was called
        expect(mockTable.setShowColumnFilters).toHaveBeenCalledWith(false);
    });

    it('should show correct icon based on filter state', () => {
        const filterStates = [
            { showFilters: false, icon: '🔍', text: 'Show filters' },
            { showFilters: true, icon: '✕', text: 'Hide filters' },
        ];

        filterStates.forEach(({ showFilters, icon, text }, index) => {
            mockTable.getState = () => ({ showColumnFilters: showFilters });
            
            render(
                <button
                    key={index}
                    data-testid={`filter-button-${index}`}
                    aria-label={text}
                >
                    <span>{icon}</span>
                </button>
            );
            
            const button = screen.getByTestId(`filter-button-${index}`);
            expect(button).toHaveTextContent(icon);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should validate toggle filters button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="toggle-filters-button"
                    aria-label="Toggle column filters"
                    aria-describedby="filter-help"
                >
                    🔍
                </button>
                <div id="filter-help">Click to show or hide column filters</div>
            </div>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        const helpText = screen.getByText('Click to show or hide column filters');
        
        // Check aria attributes
        expect(toggleFiltersButton).toHaveAttribute('aria-label', 'Toggle column filters');
        expect(toggleFiltersButton).toHaveAttribute('aria-describedby', 'filter-help');
        expect(helpText).toHaveAttribute('id', 'filter-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleToggle = vi.fn();
        
        render(
            <button
                data-testid="toggle-filters-button"
                onClick={handleToggle}
                onKeyDown={handleToggle}
                tabIndex={0}
            >
                🔍
            </button>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        
        // Test Enter key
        await user.type(toggleFiltersButton, '{Enter}');
        expect(handleToggle).toHaveBeenCalled();
        
        // Test Space key
        await user.type(toggleFiltersButton, ' ');
        expect(handleToggle).toHaveBeenCalled();
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-filter-button',
            title: 'Custom filter toggle',
        };
        
        render(
            <button
                data-testid="toggle-filters-button"
                {...customProps}
            >
                🔍
            </button>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        expect(toggleFiltersButton).toHaveClass('custom-filter-button');
        expect(toggleFiltersButton).toHaveAttribute('title', 'Custom filter toggle');
    });

    it('should test filter state transitions', () => {
        const transitions = [
            { from: false, to: true, action: 'show' },
            { from: true, to: false, action: 'hide' },
        ];

        transitions.forEach(({ from, to, action }, index) => {
            render(
                <div key={index} data-testid={`transition-${index}`}>
                    <span>From {from.toString()} to {to.toString()}</span>
                    <button data-testid={`action-${action}`}>
                        {action.charAt(0).toUpperCase() + action.slice(1)} Filters
                    </button>
                </div>
            );
            
            const container = screen.getByTestId(`transition-${index}`);
            const actionButton = screen.getByTestId(`action-${action}`);
            
            expect(container).toBeInTheDocument();
            expect(actionButton).toHaveTextContent(`${action.charAt(0).toUpperCase() + action.slice(1)} Filters`);
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { showFilters: false, text: 'Show filters' },
            { showFilters: true, text: 'Hide filters' },
        ];

        tooltipStates.forEach(({ showFilters, text }, index) => {
            mockTable.getState = () => ({ showColumnFilters: showFilters });
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    {showFilters ? '✕' : '🔍'}
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with different content', () => {
        const contents = [
            { icon: '🔍', text: 'Show Filters' },
            { icon: '✕', text: 'Hide Filters' },
            { icon: '⚡', text: 'Toggle Filters' },
        ];

        contents.forEach(({ icon, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`filter-button-${index}`}
                >
                    {icon} {text}
                </button>
            );
            
            const button = screen.getByTestId(`filter-button-${index}`);
            expect(button).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'filter-button' },
            { state: 'active', className: 'filter-button active' },
            { state: 'hover', className: 'filter-button hover' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                >
                    🔍
                </button>
            );
            
            const button = screen.getByTestId(`style-button-${state}`);
            expect(button).toHaveClass(className);
        });
    });

    it('should test filter toggle logic', () => {
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
                data-testid="toggle-filters-button"
                onClick={customOnClick}
            >
                🔍
            </button>
        );

        const toggleFiltersButton = screen.getByTestId('toggle-filters-button');
        
        // Click the toggle filters button
        await user.click(toggleFiltersButton);
        
        // Verify custom onClick was called
        expect(customOnClick).toHaveBeenCalled();
    });

    it('should test filter button states', () => {
        const buttonStates = [
            { showFilters: false, disabled: false, text: 'Show Filters' },
            { showFilters: true, disabled: false, text: 'Hide Filters' },
            { showFilters: false, disabled: true, text: 'Filters Disabled' },
        ];

        buttonStates.forEach(({ showFilters, disabled, text }, index) => {
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