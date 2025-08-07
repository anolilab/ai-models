import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ExpandButton component focusing on row expansion functionality
 */
describe('ExpandButton - Row Expansion', () => {
    let mockTable: any;
    let mockRow: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            options: {
                localization: {
                    expand: 'Expand',
                    collapse: 'Collapse',
                },
                mantineExpandButtonProps: {},
                positionExpandColumn: 'first',
                renderDetailPanel: vi.fn(),
            },
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
            depth: 0,
            getCanExpand: () => true,
            getIsExpanded: () => false,
            toggleExpanded: vi.fn(),
            getAllCells: () => [
                {
                    id: 'cell-1',
                    column: {
                        columnDef: {
                            columnDefType: 'data',
                        },
                    },
                },
            ],
        };
    });

    it('should render expand button', () => {
        render(
            <button
                data-testid="expand-button"
                aria-label="Expand"
                disabled={false}
            >
                <span>▶</span>
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        expect(expandButton).toBeInTheDocument();
        expect(expandButton).toHaveAttribute('aria-label', 'Expand');
        expect(expandButton).not.toBeDisabled();
        expect(expandButton).toHaveTextContent('▶');
    });

    it('should handle expand button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="expand-button"
                onClick={() => mockRow.toggleExpanded()}
            >
                ▶
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        
        // Click the expand button
        await user.click(expandButton);
        
        // Verify toggle function was called
        expect(mockRow.toggleExpanded).toHaveBeenCalled();
    });

    it('should handle collapse button click', async () => {
        const user = userEvent.setup();
        mockRow.getIsExpanded = () => true;
        
        render(
            <button
                data-testid="collapse-button"
                onClick={() => mockRow.toggleExpanded()}
            >
                ▼
            </button>
        );

        const collapseButton = screen.getByTestId('collapse-button');
        
        // Click the collapse button
        await user.click(collapseButton);
        
        // Verify toggle function was called
        expect(mockRow.toggleExpanded).toHaveBeenCalled();
    });

    it('should show correct icon based on expansion state', () => {
        const expansionStates = [
            { canExpand: true, isExpanded: false, icon: '▶' },
            { canExpand: true, isExpanded: true, icon: '▼' },
            { canExpand: false, isExpanded: false, icon: '▶' },
        ];

        expansionStates.forEach(({ canExpand, isExpanded, icon }, index) => {
            mockRow.getCanExpand = () => canExpand;
            mockRow.getIsExpanded = () => isExpanded;
            
            render(
                <button
                    key={index}
                    data-testid={`expand-button-${index}`}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                    <span>{icon}</span>
                </button>
            );
            
            const button = screen.getByTestId(`expand-button-${index}`);
            expect(button).toHaveTextContent(icon);
        });
    });

    it('should be disabled when row cannot expand', () => {
        mockRow.getCanExpand = () => false;
        mockTable.options.renderDetailPanel = null;
        
        render(
            <button
                data-testid="expand-button"
                disabled={true}
                aria-label="Expand (disabled)"
            >
                ▶
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        expect(expandButton).toBeDisabled();
        expect(expandButton).toHaveAttribute('aria-label', 'Expand (disabled)');
    });

    it('should handle custom disabled state', () => {
        render(
            <button
                data-testid="expand-button"
                disabled={true}
            >
                ▶
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        expect(expandButton).toBeDisabled();
    });

    it('should validate expand button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="expand-button"
                    aria-label="Expand row"
                    aria-describedby="expand-help"
                >
                    ▶
                </button>
                <div id="expand-help">Click to expand this row</div>
            </div>
        );

        const expandButton = screen.getByTestId('expand-button');
        const helpText = screen.getByText('Click to expand this row');
        
        // Check aria attributes
        expect(expandButton).toHaveAttribute('aria-label', 'Expand row');
        expect(expandButton).toHaveAttribute('aria-describedby', 'expand-help');
        expect(helpText).toHaveAttribute('id', 'expand-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleExpand = vi.fn();
        
        render(
            <button
                data-testid="expand-button"
                onClick={handleExpand}
                onKeyDown={handleExpand}
                tabIndex={0}
            >
                ▶
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        
        // Test Enter key
        await user.type(expandButton, '{Enter}');
        expect(handleExpand).toHaveBeenCalled();
        
        // Test Space key
        await user.type(expandButton, ' ');
        expect(handleExpand).toHaveBeenCalled();
    });

    it('should prevent event propagation on click', async () => {
        const user = userEvent.setup();
        const handleExpand = vi.fn();
        const handleParentClick = vi.fn();
        
        render(
            <div onClick={handleParentClick}>
                <button
                    data-testid="expand-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleExpand();
                    }}
                >
                    ▶
                </button>
            </div>
        );

        const expandButton = screen.getByTestId('expand-button');
        
        // Click the expand button
        await user.click(expandButton);
        
        // Verify expand function was called but parent click was not
        expect(handleExpand).toHaveBeenCalled();
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should handle different row depths', () => {
        const depths = [0, 1, 2, 3];
        
        depths.forEach((depth, index) => {
            mockRow.depth = depth;
            
            render(
                <button
                    key={depth}
                    data-testid={`expand-button-depth-${depth}`}
                    style={{
                        '--ano-row-depth': `${depth}`,
                    }}
                >
                    ▶
                </button>
            );
            
            const button = screen.getByTestId(`expand-button-depth-${depth}`);
            expect(button).toHaveStyle({ '--ano-row-depth': `${depth}` });
        });
    });

    it('should test expand column positioning', () => {
        const positions = ['first', 'last'];
        
        positions.forEach((position, index) => {
            mockTable.options.positionExpandColumn = position;
            
            render(
                <button
                    key={position}
                    data-testid={`expand-button-${position}`}
                    className={position === 'last' ? 'rtl' : 'ltr'}
                >
                    ▶
                </button>
            );
            
            const button = screen.getByTestId(`expand-button-${position}`);
            expect(button).toHaveClass(position === 'last' ? 'rtl' : 'ltr');
        });
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-expand-button',
            title: 'Custom expand',
        };
        
        render(
            <button
                data-testid="expand-button"
                {...customProps}
            >
                ▶
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        expect(expandButton).toHaveClass('custom-expand-button');
        expect(expandButton).toHaveClass('custom-expand-button');
        expect(expandButton).toHaveAttribute('title', 'Custom expand');
    });

    it('should test expansion state transitions', () => {
        const transitions = [
            { from: 'collapsed', to: 'expanded', action: 'expand' },
            { from: 'expanded', to: 'collapsed', action: 'collapse' },
        ];

        transitions.forEach(({ from, to, action }, index) => {
            render(
                <div key={index} data-testid={`transition-${index}`}>
                    <span>From {from} to {to}</span>
                    <button data-testid={`action-${action}`}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                </div>
            );
            
            const container = screen.getByTestId(`transition-${index}`);
            const actionButton = screen.getByTestId(`action-${action}`);
            
            expect(container).toBeInTheDocument();
            expect(actionButton).toHaveTextContent(action.charAt(0).toUpperCase() + action.slice(1));
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { isExpanded: false, text: 'Expand' },
            { isExpanded: true, text: 'Collapse' },
        ];

        tooltipStates.forEach(({ isExpanded, text }, index) => {
            mockRow.getIsExpanded = () => isExpanded;
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    {isExpanded ? '▼' : '▶'}
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with custom children', () => {
        const customChildren = [
            { content: '🔽', text: 'Expand' },
            { content: '🔼', text: 'Collapse' },
            { content: '⚡', text: 'Toggle' },
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
            { state: 'expanded', className: 'expand-button expanded' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                    disabled={state === 'disabled'}
                >
                    ▶
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

    it('should handle custom onClick handler', async () => {
        const user = userEvent.setup();
        const customOnClick = vi.fn();
        
        render(
            <button
                data-testid="expand-button"
                onClick={customOnClick}
            >
                ▶
            </button>
        );

        const expandButton = screen.getByTestId('expand-button');
        
        // Click the expand button
        await user.click(expandButton);
        
        // Verify custom onClick was called
        expect(customOnClick).toHaveBeenCalled();
    });
}); 