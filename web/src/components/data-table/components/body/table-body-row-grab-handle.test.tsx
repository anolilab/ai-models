import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableBodyRowGrabHandle } from './table-body-row-grab-handle';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('../buttons/grab-handle-button', () => ({
    GrabHandleButton: ({ onDragStart, onDragEnd }: { onDragStart: any; onDragEnd: any }) => (
        <button
            data-testid="grab-handle-button"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            Grab Handle
        </button>
    ),
}));

/**
 * Test for TableBodyRowGrabHandle component focusing on drag functionality
 */
describe('TableBodyRowGrabHandle - Drag Functionality', () => {
    let mockTable: any;
    let mockRow: any;
    let mockRowRef: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            ...mockTable.options,
            mantineRowDragHandleProps: {},
        };
        mockTable.setDraggingRow = vi.fn();
        mockTable.setHoveredRow = vi.fn();

        // Create mock row
        mockRow = {
            id: 'row-1',
        };

        // Create mock row ref
        mockRowRef = { current: document.createElement('tr') };
    });

    it('should render grab handle button', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
        expect(screen.getByText('Grab Handle')).toBeInTheDocument();
    });

    it('should handle drag start', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: {
                setDragImage: vi.fn(),
            },
        });

        fireEvent(button, dragEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(mockRow);
    });

    it('should handle drag end', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend', { bubbles: true });

        fireEvent(button, dragEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(null);
        expect(mockTable.setHoveredRow).toHaveBeenCalledWith(null);
    });

    it('should set drag image on drag start', () => {
        const mockSetDragImage = vi.fn();
        const mockDataTransfer = {
            setDragImage: mockSetDragImage,
        };

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: mockDataTransfer,
        });

        fireEvent(button, dragEvent);

        expect(mockSetDragImage).toHaveBeenCalledWith(mockRowRef.current, 0, 0);
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-grab-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
                className={customClassName}
                style={customStyle}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        expect(button).toHaveClass(customClassName);
        expect(button).toHaveStyle('background-color: red');
    });

    it('should handle custom table row drag handle props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
            onDragStart: vi.fn(),
            onDragEnd: vi.fn(),
        };
        mockTable.options.mantineRowDragHandleProps = vi.fn(() => customProps);

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
    });

    it('should call custom onDragStart when provided', () => {
        const customOnDragStart = vi.fn();
        mockTable.options.mantineRowDragHandleProps = vi.fn(() => ({
            onDragStart: customOnDragStart,
        }));

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: {
                setDragImage: vi.fn(),
            },
        });

        fireEvent(button, dragEvent);

        expect(customOnDragStart).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(mockRow);
    });

    it('should call custom onDragEnd when provided', () => {
        const customOnDragEnd = vi.fn();
        mockTable.options.mantineRowDragHandleProps = vi.fn(() => ({
            onDragEnd: customOnDragEnd,
        }));

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend', { bubbles: true });

        fireEvent(button, dragEvent);

        expect(customOnDragEnd).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(null);
        expect(mockTable.setHoveredRow).toHaveBeenCalledWith(null);
    });

    it('should pass correct props to GrabHandleButton', () => {
        const { GrabHandleButton } = require('../buttons/grab-handle-button');
        const mockGrabHandleButton = vi.fn(({ actionIconProps, onDragStart, onDragEnd, table }) => (
            <button data-testid="grab-handle-button">
                Grab Handle for {table.options.data?.length || 0} rows
            </button>
        ));
        GrabHandleButton.mockImplementation(mockGrabHandleButton);

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(mockGrabHandleButton).toHaveBeenCalledWith(
            expect.objectContaining({
                actionIconProps: expect.any(Object),
                onDragStart: expect.any(Function),
                onDragEnd: expect.any(Function),
                table: mockTable,
            }),
            expect.anything()
        );
    });

    it('should handle row ref with null current', () => {
        mockRowRef.current = null;

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: {
                setDragImage: vi.fn(),
            },
        });

        fireEvent(button, dragEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(mockRow);
    });

    it('should handle row ref with undefined current', () => {
        mockRowRef.current = undefined;

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: {
                setDragImage: vi.fn(),
            },
        });

        fireEvent(button, dragEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(mockRow);
    });

    it('should handle custom table row drag handle props with function', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineRowDragHandleProps = vi.fn(() => customProps);

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
        expect(mockTable.options.mantineRowDragHandleProps).toHaveBeenCalledWith({
            row: mockRow,
            table: mockTable,
        });
    });

    it('should handle custom table row drag handle props with object', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineRowDragHandleProps = customProps;

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
    });

    it('should handle undefined mantineRowDragHandleProps', () => {
        mockTable.options.mantineRowDragHandleProps = undefined;

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
    });

    it('should handle null mantineRowDragHandleProps', () => {
        mockTable.options.mantineRowDragHandleProps = null;

        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
    });

    it('should handle drag events with missing dataTransfer', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });

        fireEvent(button, dragEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(mockRow);
    });

    it('should handle drag events with missing setDragImage', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: {},
        });

        fireEvent(button, dragEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledWith(mockRow);
    });

    it('should handle multiple drag start events', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');

        // First drag start
        const dragEvent1 = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent1, 'dataTransfer', {
            value: { setDragImage: vi.fn() },
        });
        fireEvent(button, dragEvent1);

        // Second drag start
        const dragEvent2 = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent2, 'dataTransfer', {
            value: { setDragImage: vi.fn() },
        });
        fireEvent(button, dragEvent2);

        expect(mockTable.setDraggingRow).toHaveBeenCalledTimes(2);
        expect(mockTable.setDraggingRow).toHaveBeenNthCalledWith(1, mockRow);
        expect(mockTable.setDraggingRow).toHaveBeenNthCalledWith(2, mockRow);
    });

    it('should handle multiple drag end events', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');

        // First drag end
        const dragEvent1 = new Event('dragend', { bubbles: true });
        fireEvent(button, dragEvent1);

        // Second drag end
        const dragEvent2 = new Event('dragend', { bubbles: true });
        fireEvent(button, dragEvent2);

        expect(mockTable.setDraggingRow).toHaveBeenCalledTimes(2);
        expect(mockTable.setDraggingRow).toHaveBeenNthCalledWith(1, null);
        expect(mockTable.setDraggingRow).toHaveBeenNthCalledWith(2, null);
        expect(mockTable.setHoveredRow).toHaveBeenCalledTimes(2);
        expect(mockTable.setHoveredRow).toHaveBeenNthCalledWith(1, null);
        expect(mockTable.setHoveredRow).toHaveBeenNthCalledWith(2, null);
    });

    it('should handle drag start followed by drag end', () => {
        render(
            <TableBodyRowGrabHandle
                row={mockRow}
                table={mockTable}
                rowRef={mockRowRef}
            />
        );

        const button = screen.getByTestId('grab-handle-button');

        // Drag start
        const dragStartEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragStartEvent, 'dataTransfer', {
            value: { setDragImage: vi.fn() },
        });
        fireEvent(button, dragStartEvent);

        // Drag end
        const dragEndEvent = new Event('dragend', { bubbles: true });
        fireEvent(button, dragEndEvent);

        expect(mockTable.setDraggingRow).toHaveBeenCalledTimes(2);
        expect(mockTable.setDraggingRow).toHaveBeenNthCalledWith(1, mockRow);
        expect(mockTable.setDraggingRow).toHaveBeenNthCalledWith(2, null);
        expect(mockTable.setHoveredRow).toHaveBeenCalledWith(null);
    });
}); 