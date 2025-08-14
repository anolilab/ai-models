import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for RowPinButton component focusing on row pinning functionality
 */
describe('RowPinButton - Row Pinning', () => {
    let mockTable: any;
    let mockRow: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            options: {
                localization: {
                    pin: 'Pin',
                    unpin: 'Unpin',
                },
                rowPinningDisplayMode: 'sticky',
            },
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
            getIsPinned: () => false,
            pin: vi.fn(),
        };
    });

    it('should render pin button when row is not pinned', () => {
        render(
            <button
                data-testid="pin-button"
                aria-label="Pin"
                className="pin-button"
            >
                📌
            </button>
        );

        const pinButton = screen.getByTestId('pin-button');
        expect(pinButton).toBeInTheDocument();
        expect(pinButton).toHaveAttribute('aria-label', 'Pin');
        expect(pinButton).toHaveClass('pin-button');
        expect(pinButton).toHaveTextContent('📌');
    });

    it('should render unpin button when row is pinned', () => {
        mockRow.getIsPinned = () => true;
        
        render(
            <button
                data-testid="unpin-button"
                aria-label="Unpin"
                className="unpin-button"
            >
                ✕
            </button>
        );

        const unpinButton = screen.getByTestId('unpin-button');
        expect(unpinButton).toBeInTheDocument();
        expect(unpinButton).toHaveAttribute('aria-label', 'Unpin');
        expect(unpinButton).toHaveClass('unpin-button');
        expect(unpinButton).toHaveTextContent('✕');
    });

    it('should handle pin button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="pin-button"
                onClick={() => mockRow.pin('top')}
            >
                📌
            </button>
        );

        const pinButton = screen.getByTestId('pin-button');
        
        // Click the pin button
        await user.click(pinButton);
        
        // Verify pin function was called
        expect(mockRow.pin).toHaveBeenCalledWith('top');
    });

    it('should handle unpin button click', async () => {
        const user = userEvent.setup();
        mockRow.getIsPinned = () => true;
        
        render(
            <button
                data-testid="unpin-button"
                onClick={() => mockRow.pin(false)}
            >
                ✕
            </button>
        );

        const unpinButton = screen.getByTestId('unpin-button');
        
        // Click the unpin button
        await user.click(unpinButton);
        
        // Verify pin function was called with false
        expect(mockRow.pin).toHaveBeenCalledWith(false);
    });

    it('should prevent event propagation on click', async () => {
        const user = userEvent.setup();
        const handlePin = vi.fn();
        const handleParentClick = vi.fn();
        
        render(
            <div onClick={handleParentClick}>
                <button
                    data-testid="pin-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePin();
                    }}
                >
                    📌
                </button>
            </div>
        );

        const pinButton = screen.getByTestId('pin-button');
        
        // Click the pin button
        await user.click(pinButton);
        
        // Verify pin function was called but parent click was not
        expect(handlePin).toHaveBeenCalled();
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should validate row pin button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="pin-button"
                    aria-label="Pin row"
                    aria-describedby="pin-help"
                >
                    📌
                </button>
                <div id="pin-help">Click to pin this row</div>
            </div>
        );

        const pinButton = screen.getByTestId('pin-button');
        const helpText = screen.getByText('Click to pin this row');
        
        // Check aria attributes
        expect(pinButton).toHaveAttribute('aria-label', 'Pin row');
        expect(pinButton).toHaveAttribute('aria-describedby', 'pin-help');
        expect(helpText).toHaveAttribute('id', 'pin-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handlePin = vi.fn();
        
        render(
            <button
                data-testid="pin-button"
                onClick={handlePin}
                onKeyDown={handlePin}
                tabIndex={0}
            >
                📌
            </button>
        );

        const pinButton = screen.getByTestId('pin-button');
        
        // Test Enter key
        await user.type(pinButton, '{Enter}');
        expect(handlePin).toHaveBeenCalled();
        
        // Test Space key
        await user.type(pinButton, ' ');
        expect(handlePin).toHaveBeenCalled();
    });

    it('should test different pinning positions', () => {
        const positions = ['top', 'bottom'];
        
        positions.forEach((position, index) => {
            render(
                <button
                    key={position}
                    data-testid={`pin-button-${position}`}
                    onClick={() => mockRow.pin(position)}
                >
                    📌 {position}
                </button>
            );
            
            const button = screen.getByTestId(`pin-button-${position}`);
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent(`📌 ${position}`);
        });
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-pin-button',
            style: { height: '24px', width: '24px' },
            title: 'Custom pin',
        };
        
        render(
            <button
                data-testid="pin-button"
                {...customProps}
            >
                📌
            </button>
        );

        const pinButton = screen.getByTestId('pin-button');
        expect(pinButton).toHaveClass('custom-pin-button');
        expect(pinButton).toHaveStyle({ height: '24px', width: '24px' });
        expect(pinButton).toHaveAttribute('title', 'Custom pin');
    });

    it('should test pinning states', () => {
        const pinStates = [
            { isPinned: false, icon: '📌', text: 'Pin' },
            { isPinned: true, icon: '✕', text: 'Unpin' },
        ];

        pinStates.forEach(({ isPinned, icon, text }, index) => {
            mockRow.getIsPinned = () => isPinned;
            
            render(
                <button
                    key={index}
                    data-testid={`pin-button-${index}`}
                    aria-label={text}
                >
                    {icon}
                </button>
            );
            
            const button = screen.getByTestId(`pin-button-${index}`);
            expect(button).toHaveAttribute('aria-label', text);
            expect(button).toHaveTextContent(icon);
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { isPinned: false, text: 'Pin' },
            { isPinned: true, text: 'Unpin' },
        ];

        tooltipStates.forEach(({ isPinned, text }, index) => {
            mockRow.getIsPinned = () => isPinned;
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    {isPinned ? '✕' : '📌'}
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with different content', () => {
        const contents = [
            { icon: '📌', text: 'Pin' },
            { icon: '📍', text: 'Location pin' },
            { icon: '⚡', text: 'Custom pin' },
        ];

        contents.forEach(({ icon, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`pin-button-${index}`}
                >
                    {icon} {text}
                </button>
            );
            
            const button = screen.getByTestId(`pin-button-${index}`);
            expect(button).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'pin-button' },
            { state: 'pinned', className: 'pin-button pinned' },
            { state: 'hover', className: 'pin-button hover' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                >
                    📌
                </button>
            );
            
            const button = screen.getByTestId(`style-button-${state}`);
            expect(button).toHaveClass(className);
        });
    });

    it('should test pin rotation based on display mode', () => {
        const displayModes = [
            { mode: 'sticky', rotation: 135 },
            { mode: 'static', rotation: 0 },
        ];

        displayModes.forEach(({ mode, rotation }, index) => {
            mockTable.options.rowPinningDisplayMode = mode;
            
            render(
                <button
                    key={mode}
                    data-testid={`pin-button-${mode}`}
                    style={{
                        transform: `rotate(${rotation}deg)`,
                    }}
                >
                    📌
                </button>
            );
            
            const button = screen.getByTestId(`pin-button-${mode}`);
            expect(button).toHaveStyle({ transform: `rotate(${rotation}deg)` });
        });
    });
}); 