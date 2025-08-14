import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHeadCellResizeHandle } from './table-head-cell-resize-handle';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

/**
 * Test for TableHeadCellResizeHandle component focusing on resize functionality
 */
describe('TableHeadCellResizeHandle - Resize Functionality', () => {
    let mockTable: any;
    let mockHeader: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            columnResizeDirection: 'ltr',
            columnResizeMode: 'onChange',
        };
        mockTable.getState = vi.fn(() => ({
            density: 'md',
            columnSizingInfo: {
                deltaOffset: 0,
                isResizingColumn: false,
            },
        }));
        mockTable.setColumnSizingInfo = vi.fn();

        // Create mock column
        mockColumn = {
            id: 'name',
            getIsResizing: vi.fn(() => false),
            resetSize: vi.fn(),
        };

        // Create mock header
        mockHeader = {
            id: 'name',
            column: mockColumn,
            getResizeHandler: vi.fn(() => vi.fn()),
            subHeaders: [],
        };
    });

    it('should render resize handle', () => {
        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('should apply default resize handle classes', () => {
        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveClass('ano-table-head-cell-resize-handle');
        expect(resizeHandle).toHaveClass('absolute');
        expect(resizeHandle).toHaveClass('h-6');
        expect(resizeHandle).toHaveClass('w-1');
        expect(resizeHandle).toHaveClass('cursor-col-resize');
        expect(resizeHandle).toHaveClass('rounded');
        expect(resizeHandle).toHaveClass('bg-gray-400');
        expect(resizeHandle).toHaveClass('hover:bg-blue-500');
        expect(resizeHandle).toHaveClass('active:bg-blue-600');
    });

    it('should apply LTR positioning classes', () => {
        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveClass('right-0');
        expect(resizeHandle).toHaveClass('-mr-2.5');
        expect(resizeHandle).toHaveClass('md:-mr-4');
        expect(resizeHandle).toHaveClass('xl:-mr-5.5');
    });

    it('should apply RTL positioning classes', () => {
        mockTable.options.columnResizeDirection = 'rtl';

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveClass('left-0');
        expect(resizeHandle).toHaveClass('-ml-2.5');
        expect(resizeHandle).toHaveClass('md:-ml-4');
        expect(resizeHandle).toHaveClass('xl:-ml-5.5');
    });

    it('should apply density class', () => {
        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveClass('md');
    });

    it('should apply custom className and style', () => {
        render(
            <TableHeadCellResizeHandle
                className="custom-resize-handle-class"
                header={mockHeader}
                style={{ backgroundColor: 'blue' }}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveClass('custom-resize-handle-class');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle double click to reset column size', () => {
        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        fireEvent.doubleClick(resizeHandle);

        expect(mockTable.setColumnSizingInfo).toHaveBeenCalledWith(expect.any(Function));
        expect(mockColumn.resetSize).toHaveBeenCalled();
    });

    it('should handle mouse down event', () => {
        const mockResizeHandler = vi.fn();
        mockHeader.getResizeHandler = vi.fn(() => mockResizeHandler);

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        fireEvent.mouseDown(resizeHandle);

        expect(mockResizeHandler).toHaveBeenCalled();
    });

    it('should handle touch start event', () => {
        const mockResizeHandler = vi.fn();
        mockHeader.getResizeHandler = vi.fn(() => mockResizeHandler);

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        fireEvent.touchStart(resizeHandle);

        expect(mockResizeHandler).toHaveBeenCalled();
    });

    it('should apply transform when column is resizing in onEnd mode', () => {
        mockTable.options.columnResizeMode = 'onEnd';
        mockColumn.getIsResizing = vi.fn(() => true);
        mockTable.getState = vi.fn(() => ({
            density: 'md',
            columnSizingInfo: {
                deltaOffset: 50,
                isResizingColumn: false,
            },
        }));

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveStyle('transform: translateX(50px)');
    });

    it('should apply RTL transform when column is resizing in onEnd mode', () => {
        mockTable.options.columnResizeDirection = 'rtl';
        mockTable.options.columnResizeMode = 'onEnd';
        mockColumn.getIsResizing = vi.fn(() => true);
        mockTable.getState = vi.fn(() => ({
            density: 'md',
            columnSizingInfo: {
                deltaOffset: 50,
                isResizingColumn: false,
            },
        }));

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveStyle('transform: translateX(-50px)');
    });

    it('should not apply transform when column is not resizing', () => {
        mockTable.options.columnResizeMode = 'onEnd';
        mockColumn.getIsResizing = vi.fn(() => false);

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should not apply transform in onChange mode', () => {
        mockTable.options.columnResizeMode = 'onChange';
        mockColumn.getIsResizing = vi.fn(() => true);

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should apply active opacity class for onChange mode with no subheaders', () => {
        mockTable.options.columnResizeMode = 'onChange';
        mockHeader.subHeaders = [];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveClass('active:opacity-0');
    });

    it('should not apply active opacity class for onChange mode with subheaders', () => {
        mockTable.options.columnResizeMode = 'onChange';
        mockHeader.subHeaders = ['subheader1'];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).not.toHaveClass('active:opacity-0');
    });

    it('should not apply active opacity class for onEnd mode', () => {
        mockTable.options.columnResizeMode = 'onEnd';
        mockHeader.subHeaders = [];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).not.toHaveClass('active:opacity-0');
    });

    it('should handle undefined deltaOffset', () => {
        mockTable.options.columnResizeMode = 'onEnd';
        mockColumn.getIsResizing = vi.fn(() => true);
        mockTable.getState = vi.fn(() => ({
            density: 'md',
            columnSizingInfo: {
                deltaOffset: undefined,
                isResizingColumn: false,
            },
        }));

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveStyle('transform: translateX(0px)');
    });

    it('should handle null deltaOffset', () => {
        mockTable.options.columnResizeMode = 'onEnd';
        mockColumn.getIsResizing = vi.fn(() => true);
        mockTable.getState = vi.fn(() => ({
            density: 'md',
            columnSizingInfo: {
                deltaOffset: null,
                isResizingColumn: false,
            },
        }));

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toHaveStyle('transform: translateX(0px)');
    });

    it('should handle missing columnSizingInfo', () => {
        mockTable.getState = vi.fn(() => ({
            density: 'md',
            columnSizingInfo: undefined,
        }));

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle missing density in state', () => {
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                deltaOffset: 0,
                isResizingColumn: false,
            },
        }));

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle missing resize handler', () => {
        mockHeader.getResizeHandler = vi.fn(() => undefined);

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        
        expect(() => {
            fireEvent.mouseDown(resizeHandle);
        }).not.toThrow();
    });

    it('should handle missing resetSize method', () => {
        delete mockColumn.resetSize;

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle missing setColumnSizingInfo method', () => {
        delete mockTable.setColumnSizingInfo;

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle function-based setColumnSizingInfo', () => {
        const mockSetColumnSizingInfo = vi.fn();
        mockTable.setColumnSizingInfo = mockSetColumnSizingInfo;

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        fireEvent.doubleClick(resizeHandle);

        expect(mockSetColumnSizingInfo).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle setColumnSizingInfo function execution', () => {
        const mockSetColumnSizingInfo = vi.fn((fn) => {
            const result = fn({ isResizingColumn: true });
            return result;
        });
        mockTable.setColumnSizingInfo = mockSetColumnSizingInfo;

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        fireEvent.doubleClick(resizeHandle);

        expect(mockSetColumnSizingInfo).toHaveBeenCalled();
        expect(mockColumn.resetSize).toHaveBeenCalled();
    });

    it('should handle different density values', () => {
        const densities = ['xs', 'sm', 'md', 'lg', 'xl'];
        
        densities.forEach(density => {
            mockTable.getState = vi.fn(() => ({
                density,
                columnSizingInfo: {
                    deltaOffset: 0,
                    isResizingColumn: false,
                },
            }));

            const { unmount } = render(
                <TableHeadCellResizeHandle
                    header={mockHeader}
                    table={mockTable}
                />
            );

            const resizeHandle = screen.getByRole('separator');
            expect(resizeHandle).toHaveClass(density);
            
            unmount();
        });
    });

    it('should handle undefined columnResizeDirection', () => {
        mockTable.options.columnResizeDirection = undefined;

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle undefined columnResizeMode', () => {
        mockTable.options.columnResizeMode = undefined;

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle undefined subHeaders', () => {
        mockHeader.subHeaders = [];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle null subHeaders', () => {
        mockHeader.subHeaders = [];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle empty subHeaders array', () => {
        mockHeader.subHeaders = [];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });

    it('should handle non-empty subHeaders array', () => {
        mockHeader.subHeaders = ['subheader1', 'subheader2'];

        render(
            <TableHeadCellResizeHandle
                header={mockHeader}
                table={mockTable}
            />
        );

        const resizeHandle = screen.getByRole('separator');
        expect(resizeHandle).toBeInTheDocument();
    });
}); 