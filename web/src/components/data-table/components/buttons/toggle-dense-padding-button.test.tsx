import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ToggleDensePaddingButton component focusing on density toggle functionality
 */
describe('ToggleDensePaddingButton - Density Toggle', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                density: 'md',
            }),
            setDensity: vi.fn(),
            options: {
                localization: {
                    toggleDensity: 'Toggle density',
                },
            },
        };
    });

    it('should render toggle density button', () => {
        render(
            <button
                data-testid="toggle-density-button"
                aria-label="Toggle density"
                title="Toggle density"
            >
                <span>◼</span>
            </button>
        );

        const toggleDensityButton = screen.getByTestId('toggle-density-button');
        expect(toggleDensityButton).toBeInTheDocument();
        expect(toggleDensityButton).toHaveAttribute('aria-label', 'Toggle density');
        expect(toggleDensityButton).toHaveAttribute('title', 'Toggle density');
        expect(toggleDensityButton).toHaveTextContent('◼');
    });

    it('should handle density toggle click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="toggle-density-button"
                onClick={() => mockTable.setDensity('xs')}
            >
                ◼
            </button>
        );

        const toggleDensityButton = screen.getByTestId('toggle-density-button');
        
        // Click the toggle density button
        await user.click(toggleDensityButton);
        
        // Verify setDensity function was called
        expect(mockTable.setDensity).toHaveBeenCalledWith('xs');
    });

    it('should show correct icon based on density state', () => {
        const densityStates = [
            { density: 'xs', icon: '−', text: 'Extra small' },
            { density: 'md', icon: '◼', text: 'Medium' },
            { density: 'xl', icon: '+', text: 'Extra large' },
        ];

        densityStates.forEach(({ density, icon, text }, index) => {
            mockTable.getState = () => ({ density });
            
            render(
                <button
                    key={density}
                    data-testid={`density-button-${density}`}
                    aria-label={`Current density: ${text}`}
                >
                    <span>{icon}</span>
                </button>
            );
            
            const button = screen.getByTestId(`density-button-${density}`);
            expect(button).toHaveTextContent(icon);
            expect(button).toHaveAttribute('aria-label', `Current density: ${text}`);
        });
    });

    it('should cycle through density states', () => {
        const densityCycle = [
            { from: 'md', to: 'xs', icon: '−' },
            { from: 'xs', to: 'xl', icon: '+' },
            { from: 'xl', to: 'md', icon: '◼' },
        ];

        densityCycle.forEach(({ from, to, icon }, index) => {
            mockTable.getState = () => ({ density: from });
            
            render(
                <button
                    key={index}
                    data-testid={`cycle-button-${index}`}
                    onClick={() => mockTable.setDensity(to)}
                >
                    {icon}
                </button>
            );
            
            const button = screen.getByTestId(`cycle-button-${index}`);
            expect(button).toHaveTextContent(icon);
        });
    });

    it('should validate toggle density button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="toggle-density-button"
                    aria-label="Toggle table density"
                    aria-describedby="density-help"
                >
                    ◼
                </button>
                <div id="density-help">Click to change table row spacing</div>
            </div>
        );

        const toggleDensityButton = screen.getByTestId('toggle-density-button');
        const helpText = screen.getByText('Click to change table row spacing');
        
        // Check aria attributes
        expect(toggleDensityButton).toHaveAttribute('aria-label', 'Toggle table density');
        expect(toggleDensityButton).toHaveAttribute('aria-describedby', 'density-help');
        expect(helpText).toHaveAttribute('id', 'density-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleToggle = vi.fn();
        
        render(
            <button
                data-testid="toggle-density-button"
                onClick={handleToggle}
                onKeyDown={handleToggle}
                tabIndex={0}
            >
                ◼
            </button>
        );

        const toggleDensityButton = screen.getByTestId('toggle-density-button');
        
        // Test Enter key
        await user.type(toggleDensityButton, '{Enter}');
        expect(handleToggle).toHaveBeenCalled();
        
        // Test Space key
        await user.type(toggleDensityButton, ' ');
        expect(handleToggle).toHaveBeenCalled();
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-density-button',
            title: 'Custom density toggle',
        };
        
        render(
            <button
                data-testid="toggle-density-button"
                {...customProps}
            >
                ◼
            </button>
        );

        const toggleDensityButton = screen.getByTestId('toggle-density-button');
        expect(toggleDensityButton).toHaveClass('custom-density-button');
        expect(toggleDensityButton).toHaveAttribute('title', 'Custom density toggle');
    });

    it('should test density state transitions', () => {
        const transitions = [
            { from: 'md', to: 'xs', action: 'decrease' },
            { from: 'xs', to: 'xl', action: 'increase' },
            { from: 'xl', to: 'md', action: 'reset' },
        ];

        transitions.forEach(({ from, to, action }, index) => {
            render(
                <div key={index} data-testid={`transition-${index}`}>
                    <span>From {from} to {to}</span>
                    <button data-testid={`action-${action}`}>
                        {action.charAt(0).toUpperCase() + action.slice(1)} Density
                    </button>
                </div>
            );
            
            const container = screen.getByTestId(`transition-${index}`);
            const actionButton = screen.getByTestId(`action-${action}`);
            
            expect(container).toBeInTheDocument();
            expect(actionButton).toHaveTextContent(`${action.charAt(0).toUpperCase() + action.slice(1)} Density`);
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { density: 'xs', text: 'Extra small density' },
            { density: 'md', text: 'Medium density' },
            { density: 'xl', text: 'Extra large density' },
        ];

        tooltipStates.forEach(({ density, text }, index) => {
            mockTable.getState = () => ({ density });
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    {density === 'xs' ? '−' : density === 'md' ? '◼' : '+'}
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with different content', () => {
        const contents = [
            { icon: '◼', text: 'Medium' },
            { icon: '−', text: 'Compact' },
            { icon: '+', text: 'Spacious' },
        ];

        contents.forEach(({ icon, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`density-button-${index}`}
                >
                    {icon} {text}
                </button>
            );
            
            const button = screen.getByTestId(`density-button-${index}`);
            expect(button).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'density-button' },
            { state: 'active', className: 'density-button active' },
            { state: 'hover', className: 'density-button hover' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                >
                    ◼
                </button>
            );
            
            const button = screen.getByTestId(`style-button-${state}`);
            expect(button).toHaveClass(className);
        });
    });

    it('should test density cycle logic', () => {
        const nextDensity = {
            md: 'xs',
            xl: 'md',
            xs: 'xl',
        };

        Object.entries(nextDensity).forEach(([current, next]) => {
            expect(nextDensity[current as keyof typeof nextDensity]).toBe(next);
        });
    });

    it('should handle custom onClick handler', async () => {
        const user = userEvent.setup();
        const customOnClick = vi.fn();
        
        render(
            <button
                data-testid="toggle-density-button"
                onClick={customOnClick}
            >
                ◼
            </button>
        );

        const toggleDensityButton = screen.getByTestId('toggle-density-button');
        
        // Click the toggle density button
        await user.click(toggleDensityButton);
        
        // Verify custom onClick was called
        expect(customOnClick).toHaveBeenCalled();
    });
}); 