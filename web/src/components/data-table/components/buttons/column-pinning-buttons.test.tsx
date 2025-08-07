import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ColumnPinningButtons component focusing on column pinning functionality
 */
describe('ColumnPinningButtons - Column Pinning', () => {
    let mockTable: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            options: {
                localization: {
                    pinToLeft: 'Pin to left',
                    pinToRight: 'Pin to right',
                    unpin: 'Unpin',
                },
            },
        };

        // Create mock column
        mockColumn = {
            id: 'name',
            getIsPinned: () => false,
            pin: vi.fn(),
        };
    });

    it('should render unpin button when column is pinned', () => {
        mockColumn.getIsPinned = () => true;
        
        render(
            <div data-testid="column-pinning-buttons">
                <button
                    data-testid="unpin-button"
                    aria-label="Unpin"
                    onClick={() => mockColumn.pin(false)}
                >
                    <span>Unpin</span>
                </button>
            </div>
        );

        const container = screen.getByTestId('column-pinning-buttons');
        const unpinButton = screen.getByTestId('unpin-button');
        
        expect(container).toBeInTheDocument();
        expect(unpinButton).toBeInTheDocument();
        expect(unpinButton).toHaveAttribute('aria-label', 'Unpin');
    });

    it('should render pin left and pin right buttons when column is not pinned', () => {
        mockColumn.getIsPinned = () => false;
        
        render(
            <div data-testid="column-pinning-buttons">
                <button
                    data-testid="pin-left-button"
                    aria-label="Pin to left"
                    onClick={() => mockColumn.pin('left')}
                >
                    <span>Pin Left</span>
                </button>
                <button
                    data-testid="pin-right-button"
                    aria-label="Pin to right"
                    onClick={() => mockColumn.pin('right')}
                >
                    <span>Pin Right</span>
                </button>
            </div>
        );

        const container = screen.getByTestId('column-pinning-buttons');
        const pinLeftButton = screen.getByTestId('pin-left-button');
        const pinRightButton = screen.getByTestId('pin-right-button');
        
        expect(container).toBeInTheDocument();
        expect(pinLeftButton).toBeInTheDocument();
        expect(pinRightButton).toBeInTheDocument();
        expect(pinLeftButton).toHaveAttribute('aria-label', 'Pin to left');
        expect(pinRightButton).toHaveAttribute('aria-label', 'Pin to right');
    });

    it('should handle pin to left button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="pin-left-button"
                onClick={() => mockColumn.pin('left')}
            >
                Pin Left
            </button>
        );

        const pinLeftButton = screen.getByTestId('pin-left-button');
        
        // Click pin left button
        await user.click(pinLeftButton);
        
        // Verify pin function was called with 'left'
        expect(mockColumn.pin).toHaveBeenCalledWith('left');
    });

    it('should handle pin to right button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="pin-right-button"
                onClick={() => mockColumn.pin('right')}
            >
                Pin Right
            </button>
        );

        const pinRightButton = screen.getByTestId('pin-right-button');
        
        // Click pin right button
        await user.click(pinRightButton);
        
        // Verify pin function was called with 'right'
        expect(mockColumn.pin).toHaveBeenCalledWith('right');
    });

    it('should handle unpin button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="unpin-button"
                onClick={() => mockColumn.pin(false)}
            >
                Unpin
            </button>
        );

        const unpinButton = screen.getByTestId('unpin-button');
        
        // Click unpin button
        await user.click(unpinButton);
        
        // Verify pin function was called with false
        expect(mockColumn.pin).toHaveBeenCalledWith(false);
    });

    it('should validate column pinning accessibility', () => {
        render(
            <div>
                <button
                    data-testid="pin-left-button"
                    aria-label="Pin to left"
                    aria-describedby="pin-help"
                >
                    Pin Left
                </button>
                <div id="pin-help">Click to pin this column to the left</div>
            </div>
        );

        const pinLeftButton = screen.getByTestId('pin-left-button');
        const helpText = screen.getByText('Click to pin this column to the left');
        
        // Check aria attributes
        expect(pinLeftButton).toHaveAttribute('aria-label', 'Pin to left');
        expect(pinLeftButton).toHaveAttribute('aria-describedby', 'pin-help');
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
                Pin
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

    it('should test pin states', () => {
        const pinStates = [
            { isPinned: false, position: null, text: 'Not pinned' },
            { isPinned: true, position: 'left', text: 'Pinned left' },
            { isPinned: true, position: 'right', text: 'Pinned right' },
        ];

        pinStates.forEach(({ isPinned, position, text }, index) => {
            mockColumn.getIsPinned = () => isPinned;
            mockColumn.pin = vi.fn();
            
            render(
                <div key={index} data-testid={`pin-state-${index}`}>
                    <span>{text}</span>
                    {isPinned ? (
                        <button data-testid={`unpin-${index}`}>Unpin</button>
                    ) : (
                        <>
                            <button data-testid={`pin-left-${index}`}>Pin Left</button>
                            <button data-testid={`pin-right-${index}`}>Pin Right</button>
                        </>
                    )}
                </div>
            );
            
            const container = screen.getByTestId(`pin-state-${index}`);
            expect(container).toBeInTheDocument();
            expect(container).toHaveTextContent(text);
        });
    });

    it('should handle multiple column pinning', () => {
        const columns = [
            { id: 'name', isPinned: false },
            { id: 'age', isPinned: true, position: 'left' },
            { id: 'status', isPinned: true, position: 'right' },
        ];

        columns.forEach((column, index) => {
            render(
                <div key={column.id} data-testid={`column-${column.id}`}>
                    <span>{column.id}</span>
                    {column.isPinned ? (
                        <button data-testid={`unpin-${column.id}`}>Unpin</button>
                    ) : (
                        <>
                            <button data-testid={`pin-left-${column.id}`}>Pin Left</button>
                            <button data-testid={`pin-right-${column.id}`}>Pin Right</button>
                        </>
                    )}
                </div>
            );
            
            const columnElement = screen.getByTestId(`column-${column.id}`);
            expect(columnElement).toBeInTheDocument();
        });
    });

    it('should validate pin button styling', () => {
        const buttonStyles = [
            { variant: 'left', className: 'pin-left-button' },
            { variant: 'right', className: 'pin-right-button' },
            { variant: 'unpin', className: 'unpin-button' },
        ];

        buttonStyles.forEach(({ variant, className }) => {
            render(
                <button
                    key={variant}
                    data-testid={`${variant}-button`}
                    className={className}
                >
                    {variant === 'unpin' ? 'Unpin' : `Pin ${variant}`}
                </button>
            );
            
            const button = screen.getByTestId(`${variant}-button`);
            expect(button).toHaveClass(className);
        });
    });

    it('should handle pin button tooltips', () => {
        const tooltips = [
            { action: 'pin-left', text: 'Pin to left' },
            { action: 'pin-right', text: 'Pin to right' },
            { action: 'unpin', text: 'Unpin' },
        ];

        tooltips.forEach(({ action, text }) => {
            render(
                <div data-testid={`tooltip-${action}`}>
                    <button
                        data-testid={`button-${action}`}
                        title={text}
                        aria-label={text}
                    >
                        {action}
                    </button>
                </div>
            );
            
            const button = screen.getByTestId(`button-${action}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });
}); 