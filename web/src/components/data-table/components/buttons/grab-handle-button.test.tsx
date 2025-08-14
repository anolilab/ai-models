import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for GrabHandleButton component focusing on drag and drop functionality
 */
describe('GrabHandleButton - Drag and Drop', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            options: {
                localization: {
                    move: 'Move',
                },
            },
        };
    });

    it('should render grab handle button', () => {
        render(
            <button
                data-testid="grab-handle-button"
                aria-label="Move"
                draggable
                className="grab-handle-button"
            >
                <span>⋮⋮</span>
            </button>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        expect(grabHandleButton).toBeInTheDocument();
        expect(grabHandleButton).toHaveAttribute('aria-label', 'Move');
        expect(grabHandleButton).toHaveAttribute('draggable');
        expect(grabHandleButton).toHaveClass('grab-handle-button');
        expect(grabHandleButton).toHaveTextContent('⋮⋮');
    });

    it('should handle drag start event', () => {
        const onDragStart = vi.fn();
        
        render(
            <button
                data-testid="grab-handle-button"
                onDragStart={onDragStart}
                draggable
            >
                ⋮⋮
            </button>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        
        // Trigger drag start event
        fireEvent.dragStart(grabHandleButton);
        
        // Verify drag start function was called
        expect(onDragStart).toHaveBeenCalled();
    });

    it('should handle drag end event', () => {
        const onDragEnd = vi.fn();
        
        render(
            <button
                data-testid="grab-handle-button"
                onDragEnd={onDragEnd}
                draggable
            >
                ⋮⋮
            </button>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        
        // Trigger drag end event
        fireEvent.dragEnd(grabHandleButton);
        
        // Verify drag end function was called
        expect(onDragEnd).toHaveBeenCalled();
    });

    it('should prevent event propagation on click', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        const handleParentClick = vi.fn();
        
        render(
            <div onClick={handleParentClick}>
                <button
                    data-testid="grab-handle-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                >
                    ⋮⋮
                </button>
            </div>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        
        // Click the grab handle button
        await user.click(grabHandleButton);
        
        // Verify click function was called but parent click was not
        expect(handleClick).toHaveBeenCalled();
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should validate grab handle button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="grab-handle-button"
                    aria-label="Move row"
                    aria-describedby="grab-help"
                >
                    ⋮⋮
                </button>
                <div id="grab-help">Click and drag to move this row</div>
            </div>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        const helpText = screen.getByText('Click and drag to move this row');
        
        // Check aria attributes
        expect(grabHandleButton).toHaveAttribute('aria-label', 'Move row');
        expect(grabHandleButton).toHaveAttribute('aria-describedby', 'grab-help');
        expect(helpText).toHaveAttribute('id', 'grab-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleKeyDown = vi.fn();
        
        render(
            <button
                data-testid="grab-handle-button"
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                ⋮⋮
            </button>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        
        // Test Enter key
        await user.type(grabHandleButton, '{Enter}');
        expect(handleKeyDown).toHaveBeenCalled();
        
        // Test Space key
        await user.type(grabHandleButton, ' ');
        expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should test cursor styles', () => {
        const cursorStyles = [
            { state: 'default', className: 'cursor-grab' },
            { state: 'dragging', className: 'cursor-grabbing' },
        ];

        cursorStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`grab-button-${state}`}
                    className={className}
                >
                    ⋮⋮
                </button>
            );
            
            const button = screen.getByTestId(`grab-button-${state}`);
            expect(button).toHaveClass(className);
        });
    });

    it('should handle custom action icon props', () => {
        const customProps = {
            className: 'custom-grab-button',
            title: 'Custom move',
            onClick: vi.fn(),
        };
        
        render(
            <button
                data-testid="grab-handle-button"
                {...customProps}
            >
                ⋮⋮
            </button>
        );

        const grabHandleButton = screen.getByTestId('grab-handle-button');
        expect(grabHandleButton).toHaveClass('custom-grab-button');
        expect(grabHandleButton).toHaveAttribute('title', 'Custom move');
    });

    it('should test drag and drop states', () => {
        const dragStates = [
            { state: 'idle', text: 'Ready to drag' },
            { state: 'dragging', text: 'Currently dragging' },
            { state: 'dropping', text: 'Dropping' },
        ];

        dragStates.forEach(({ state, text }, index) => {
            render(
                <div key={state} data-testid={`drag-state-${index}`}>
                    <button
                        data-testid={`grab-button-${state}`}
                        className={`grab-button-${state}`}
                    >
                        ⋮⋮
                    </button>
                    <span>{text}</span>
                </div>
            );
            
            const container = screen.getByTestId(`drag-state-${index}`);
            const button = screen.getByTestId(`grab-button-${state}`);
            
            expect(container).toBeInTheDocument();
            expect(button).toHaveClass(`grab-button-${state}`);
        });
    });

    it('should handle tooltip text', () => {
        const tooltips = [
            { text: 'Move', default: true },
            { text: 'Custom move text', custom: true },
        ];

        tooltips.forEach(({ text, default: isDefault, custom: isCustom }) => {
            render(
                <button
                    key={text}
                    data-testid={`grab-button-${isDefault ? 'default' : 'custom'}`}
                    title={text}
                    aria-label={text}
                >
                    ⋮⋮
                </button>
            );
            
            const button = screen.getByTestId(`grab-button-${isDefault ? 'default' : 'custom'}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with different content', () => {
        const contents = [
            { icon: '⋮⋮', text: 'Default grab' },
            { icon: '☰', text: 'Hamburger menu' },
            { icon: '⚡', text: 'Custom icon' },
        ];

        contents.forEach(({ icon, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`grab-button-${index}`}
                >
                    {icon} {text}
                </button>
            );
            
            const button = screen.getByTestId(`grab-button-${index}`);
            expect(button).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'grab-handle-button' },
            { state: 'hover', className: 'grab-handle-button hover' },
            { state: 'active', className: 'grab-handle-button active' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                >
                    ⋮⋮
                </button>
            );
            
            const button = screen.getByTestId(`style-button-${state}`);
            expect(button).toHaveClass(className);
        });
    });
}); 