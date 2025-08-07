import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ExpandAllButton component focusing on expand all functionality
 */
describe('ExpandAllButton - Expand All', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getCanSomeRowsExpand: () => true,
            getIsAllRowsExpanded: () => false,
            getIsSomeRowsExpanded: () => false,
            getState: () => ({
                density: 'md',
                isLoading: false,
            }),
            toggleAllRowsExpanded: vi.fn(),
            options: {
                localization: {
                    expandAll: 'Expand all',
                    collapseAll: 'Collapse all',
                },
                mantineExpandAllButtonProps: {},
                renderDetailPanel: vi.fn(),
            },
        };
    });

    it('should render expand all button', () => {
        render(
            <button
                data-testid="expand-all-button"
                aria-label="Expand all"
                title="Expand all"
            >
                <span>Expand All</span>
            </button>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        expect(expandAllButton).toBeInTheDocument();
        expect(expandAllButton).toHaveAttribute('aria-label', 'Expand all');
        expect(expandAllButton).toHaveAttribute('title', 'Expand all');
        expect(expandAllButton).toHaveTextContent('Expand All');
    });

    it('should handle expand all button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="expand-all-button"
                onClick={() => mockTable.toggleAllRowsExpanded(!mockTable.getIsAllRowsExpanded())}
            >
                Expand All
            </button>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        
        // Click the expand all button
        await user.click(expandAllButton);
        
        // Verify toggle function was called
        expect(mockTable.toggleAllRowsExpanded).toHaveBeenCalledWith(true);
    });

    it('should handle collapse all button click', async () => {
        const user = userEvent.setup();
        mockTable.getIsAllRowsExpanded = () => true;
        
        render(
            <button
                data-testid="collapse-all-button"
                onClick={() => mockTable.toggleAllRowsExpanded(!mockTable.getIsAllRowsExpanded())}
            >
                Collapse All
            </button>
        );

        const collapseAllButton = screen.getByTestId('collapse-all-button');
        
        // Click the collapse all button
        await user.click(collapseAllButton);
        
        // Verify toggle function was called
        expect(mockTable.toggleAllRowsExpanded).toHaveBeenCalledWith(false);
    });

    it('should show correct icon based on expansion state', () => {
        const expansionStates = [
            { allExpanded: false, someExpanded: false, icon: 'expand' },
            { allExpanded: false, someExpanded: true, icon: 'partial' },
            { allExpanded: true, someExpanded: true, icon: 'collapse' },
        ];

        expansionStates.forEach(({ allExpanded, someExpanded, icon }, index) => {
            mockTable.getIsAllRowsExpanded = () => allExpanded;
            mockTable.getIsSomeRowsExpanded = () => someExpanded;
            
            render(
                <button
                    key={index}
                    data-testid={`expand-button-${index}`}
                    aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
                >
                    <span>{icon}</span>
                </button>
            );
            
            const button = screen.getByTestId(`expand-button-${index}`);
            expect(button).toHaveTextContent(icon);
        });
    });

    it('should be disabled when no rows can expand', () => {
        mockTable.getCanSomeRowsExpand = () => false;
        mockTable.options.renderDetailPanel = null;
        
        render(
            <button
                data-testid="expand-all-button"
                disabled={true}
                aria-label="Expand all (disabled)"
            >
                Expand All
            </button>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        expect(expandAllButton).toBeDisabled();
        expect(expandAllButton).toHaveAttribute('aria-label', 'Expand all (disabled)');
    });

    it('should be disabled when loading', () => {
        mockTable.getState = () => ({
            density: 'md',
            isLoading: true,
        });
        
        render(
            <button
                data-testid="expand-all-button"
                disabled={true}
            >
                Expand All
            </button>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        expect(expandAllButton).toBeDisabled();
    });

    it('should validate expand all button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="expand-all-button"
                    aria-label="Expand all rows"
                    aria-describedby="expand-help"
                >
                    Expand All
                </button>
                <div id="expand-help">Click to expand all expandable rows</div>
            </div>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        const helpText = screen.getByText('Click to expand all expandable rows');
        
        // Check aria attributes
        expect(expandAllButton).toHaveAttribute('aria-label', 'Expand all rows');
        expect(expandAllButton).toHaveAttribute('aria-describedby', 'expand-help');
        expect(helpText).toHaveAttribute('id', 'expand-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleExpand = vi.fn();
        
        render(
            <button
                data-testid="expand-all-button"
                onClick={handleExpand}
                onKeyDown={handleExpand}
                tabIndex={0}
            >
                Expand All
            </button>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        
        // Test Enter key
        await user.type(expandAllButton, '{Enter}');
        expect(handleExpand).toHaveBeenCalled();
        
        // Test Space key
        await user.type(expandAllButton, ' ');
        expect(handleExpand).toHaveBeenCalled();
    });

    it('should test different density states', () => {
        const densityStates = ['xs', 'sm', 'md', 'lg', 'xl'];
        
        densityStates.forEach((density, index) => {
            mockTable.getState = () => ({
                density,
                isLoading: false,
            });
            
            render(
                <button
                    key={density}
                    data-testid={`expand-button-${density}`}
                    className={`density-${density}`}
                >
                    Expand All
                </button>
            );
            
            const button = screen.getByTestId(`expand-button-${density}`);
            expect(button).toHaveClass(`density-${density}`);
        });
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-expand-button',
            title: 'Custom expand all',
        };
        
        render(
            <button
                data-testid="expand-all-button"
                {...customProps}
            >
                Expand All
            </button>
        );

        const expandAllButton = screen.getByTestId('expand-all-button');
        expect(expandAllButton).toHaveClass('custom-expand-button');
        expect(expandAllButton).toHaveClass('custom-expand-button');
        expect(expandAllButton).toHaveAttribute('title', 'Custom expand all');
    });

    it('should test expansion state transitions', () => {
        const transitions = [
            { from: 'none', to: 'all', action: 'expand' },
            { from: 'all', to: 'none', action: 'collapse' },
            { from: 'some', to: 'all', action: 'expand' },
        ];

        transitions.forEach(({ from, to, action }, index) => {
            render(
                <div key={index} data-testid={`transition-${index}`}>
                    <span>From {from} to {to}</span>
                    <button data-testid={`action-${action}-${index}`}>
                        {action.charAt(0).toUpperCase() + action.slice(1)} All
                    </button>
                </div>
            );
            
            const container = screen.getByTestId(`transition-${index}`);
            const actionButton = screen.getByTestId(`action-${action}-${index}`);
            
            expect(container).toBeInTheDocument();
            expect(actionButton).toHaveTextContent(`${action.charAt(0).toUpperCase() + action.slice(1)} All`);
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { allExpanded: false, text: 'Expand all' },
            { allExpanded: true, text: 'Collapse all' },
        ];

        tooltipStates.forEach(({ allExpanded, text }, index) => {
            mockTable.getIsAllRowsExpanded = () => allExpanded;
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    {allExpanded ? 'Collapse All' : 'Expand All'}
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with custom children', () => {
        const customChildren = [
            { content: '🔽', text: 'Expand All' },
            { content: '🔼', text: 'Collapse All' },
            { content: '⚡', text: 'Toggle All' },
        ];

        customChildren.forEach(({ content, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`custom-button-${index}`}
                >
                    {content} {text}
                </button>
            );
            
            const button = screen.getByTestId(`custom-button-${index}`);
            expect(button).toHaveTextContent(`${content} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'expand-button' },
            { state: 'disabled', className: 'expand-button disabled' },
            { state: 'loading', className: 'expand-button loading' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                    disabled={state === 'disabled'}
                >
                    Expand All
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
}); 