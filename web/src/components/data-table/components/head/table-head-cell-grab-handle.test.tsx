import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHeadCellGrabHandle } from './table-head-cell-grab-handle';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('../buttons/grab-handle-button', () => ({
    GrabHandleButton: ({ actionIconProps, onDragStart, onDragEnd, table }: { actionIconProps: any; onDragStart: any; onDragEnd: any; table: any }) => (
        <button
            data-testid="grab-handle-button"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            {...actionIconProps}
        >
            Grab Handle
        </button>
    ),
}));

/**
 * Test for TableHeadCellGrabHandle component focusing on drag and drop functionality
 */
describe('TableHeadCellGrabHandle - Drag and Drop Functionality', () => {
    let mockTable: any;
    let mockColumn: any;
    let mockTableHeadCellRef: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            enableColumnOrdering: true,
            mantineColumnDragHandleProps: {
                className: 'default-drag-handle-class',
            },
        };
        mockTable.getState = vi.fn(() => ({
            columnOrder: ['name', 'age', 'email'],
            draggingColumn: null,
            hoveredColumn: null,
        }));
        mockTable.setColumnOrder = vi.fn();
        mockTable.setDraggingColumn = vi.fn();
        mockTable.setHoveredColumn = vi.fn();

        // Create mock column
        mockColumn = {
            id: 'name',
            columnDef: {
                mantineColumnDragHandleProps: {
                    style: { color: 'red' },
                },
            },
            toggleGrouping: vi.fn(),
        };

        // Create mock table head cell ref
        mockTableHeadCellRef = {
            current: document.createElement('th'),
        };
    });

    it('should render grab handle button', () => {
        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
    });

    it('should handle drag start event', () => {
        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        dragEvent.dataTransfer = {
            setDragImage: vi.fn(),
        };

        fireEvent.dragStart(grabHandle, dragEvent);

        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
        expect(dragEvent.dataTransfer.setDragImage).toHaveBeenCalledWith(mockTableHeadCellRef.current, 0, 0);
    });

    it('should handle drag end event with column ordering', () => {
        const mockHoveredColumn = { id: 'age', getIsPinned: vi.fn(() => false) };
        mockColumn.getCanPin = vi.fn(() => true);
        mockColumn.pin = vi.fn();
        mockTable.getState = vi.fn(() => ({
            columnOrder: ['name', 'age', 'email'],
            draggingColumn: mockColumn,
            hoveredColumn: mockHoveredColumn,
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(mockTable.setColumnOrder).toHaveBeenCalled();
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
        expect(mockTable.setHoveredColumn).toHaveBeenCalledWith(null);
    });

    it('should handle drag end event with grouping', () => {
        const mockHoveredColumn = { id: 'drop-zone' };
        mockTable.getState = vi.fn(() => ({
            columnOrder: ['name', 'age', 'email'],
            draggingColumn: mockColumn,
            hoveredColumn: mockHoveredColumn,
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(mockColumn.toggleGrouping).toHaveBeenCalled();
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
        expect(mockTable.setHoveredColumn).toHaveBeenCalledWith(null);
    });

    it('should not reorder when dragging to same column', () => {
        mockTable.getState = vi.fn(() => ({
            columnOrder: ['name', 'age', 'email'],
            draggingColumn: mockColumn,
            hoveredColumn: mockColumn, // Same as dragging column
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(mockTable.setColumnOrder).not.toHaveBeenCalled();
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
        expect(mockTable.setHoveredColumn).toHaveBeenCalledWith(null);
    });

    it('should not reorder when column ordering is disabled', () => {
        mockTable.options.enableColumnOrdering = false;
        const mockHoveredColumn = { id: 'age' };
        mockTable.getState = vi.fn(() => ({
            columnOrder: ['name', 'age', 'email'],
            draggingColumn: mockColumn,
            hoveredColumn: mockHoveredColumn,
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(mockTable.setColumnOrder).not.toHaveBeenCalled();
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
        expect(mockTable.setHoveredColumn).toHaveBeenCalledWith(null);
    });

    it('should apply default drag handle props', () => {
        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        expect(grabHandle).toBeInTheDocument();
    });

    it('should apply column-specific drag handle props', () => {
        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        expect(grabHandle).toBeInTheDocument();
    });

    it('should apply custom className and style', () => {
        render(
            <TableHeadCellGrabHandle
                className="custom-grab-handle-class"
                column={mockColumn}
                style={{ backgroundColor: 'blue' }}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        expect(grabHandle).toHaveClass('custom-grab-handle-class');
        expect(grabHandle).toBeInTheDocument();
    });

    it('should handle function-based drag handle props', () => {
        mockTable.options.mantineColumnDragHandleProps = vi.fn(() => ({
            className: 'function-drag-handle-class',
        }));
        mockColumn.columnDef.mantineColumnDragHandleProps = vi.fn(() => ({
            style: { fontSize: '16px' },
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        expect(grabHandle).toBeInTheDocument();
    });

    it('should handle undefined drag handle props', () => {
        mockTable.options.mantineColumnDragHandleProps = undefined;
        mockColumn.columnDef.mantineColumnDragHandleProps = undefined;

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        expect(screen.getByTestId('grab-handle-button')).toBeInTheDocument();
    });

    it('should handle null table head cell ref', () => {
        mockTableHeadCellRef.current = null;

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        dragEvent.dataTransfer = {
            setDragImage: vi.fn(),
        };

        fireEvent.dragStart(grabHandle, dragEvent);

        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
        expect(dragEvent.dataTransfer.setDragImage).toHaveBeenCalledWith(null, 0, 0);
    });

    it('should handle missing dataTransfer in drag event', () => {
        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        // No dataTransfer property

        expect(() => {
            fireEvent.dragStart(grabHandle, dragEvent);
        }).not.toThrow();

        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
    });

    it('should handle custom onDragStart callback', () => {
        const customOnDragStart = vi.fn();
        mockTable.options.mantineColumnDragHandleProps = {
            onDragStart: customOnDragStart,
        };

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        dragEvent.dataTransfer = {
            setDragImage: vi.fn(),
        };

        fireEvent.dragStart(grabHandle, dragEvent);

        expect(customOnDragStart).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
    });

    it('should handle custom onDragEnd callback', () => {
        const customOnDragEnd = vi.fn();
        mockTable.options.mantineColumnDragHandleProps = {
            onDragEnd: customOnDragEnd,
        };

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(customOnDragEnd).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
    });

    it('should handle column-specific onDragStart callback', () => {
        const customOnDragStart = vi.fn();
        mockColumn.columnDef.mantineColumnDragHandleProps = {
            onDragStart: customOnDragStart,
        };

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        dragEvent.dataTransfer = {
            setDragImage: vi.fn(),
        };

        fireEvent.dragStart(grabHandle, dragEvent);

        expect(customOnDragStart).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
    });

    it('should handle column-specific onDragEnd callback', () => {
        const customOnDragEnd = vi.fn();
        mockColumn.columnDef.mantineColumnDragHandleProps = {
            onDragEnd: customOnDragEnd,
        };

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(customOnDragEnd).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
    });

    it('should handle function-based onDragStart callback', () => {
        const customOnDragStart = vi.fn();
        mockTable.options.mantineColumnDragHandleProps = vi.fn(() => ({
            onDragStart: customOnDragStart,
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        dragEvent.dataTransfer = {
            setDragImage: vi.fn(),
        };

        fireEvent.dragStart(grabHandle, dragEvent);

        expect(customOnDragStart).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
    });

    it('should handle function-based onDragEnd callback', () => {
        const customOnDragEnd = vi.fn();
        mockTable.options.mantineColumnDragHandleProps = vi.fn(() => ({
            onDragEnd: customOnDragEnd,
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        fireEvent.dragEnd(grabHandle, dragEvent);

        expect(customOnDragEnd).toHaveBeenCalledWith(dragEvent);
        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(null);
    });

    it('should handle missing toggleGrouping method', () => {
        delete mockColumn.toggleGrouping;
        const mockHoveredColumn = { id: 'drop-zone' };
        mockTable.getState = vi.fn(() => ({
            columnOrder: ['name', 'age', 'email'],
            draggingColumn: mockColumn,
            hoveredColumn: mockHoveredColumn,
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        expect(() => {
            fireEvent.dragEnd(grabHandle, dragEvent);
        }).not.toThrow();
    });

    it('should handle missing setDragImage method', () => {
        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragstart') as any;
        dragEvent.dataTransfer = {};
        // No setDragImage method

        expect(() => {
            fireEvent.dragStart(grabHandle, dragEvent);
        }).not.toThrow();

        expect(mockTable.setDraggingColumn).toHaveBeenCalledWith(mockColumn);
    });

    it('should handle missing column order in state', () => {
        mockTable.getState = vi.fn(() => ({
            columnOrder: undefined,
            draggingColumn: mockColumn,
            hoveredColumn: { id: 'age' },
        }));

        render(
            <TableHeadCellGrabHandle
                column={mockColumn}
                table={mockTable}
                tableHeadCellRef={mockTableHeadCellRef}
            />
        );

        const grabHandle = screen.getByTestId('grab-handle-button');
        const dragEvent = new Event('dragend') as any;

        expect(() => {
            fireEvent.dragEnd(grabHandle, dragEvent);
        }).not.toThrow();
    });
}); 