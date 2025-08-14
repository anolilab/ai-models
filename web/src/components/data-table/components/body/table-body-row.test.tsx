import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableBodyRow } from './table-body-row';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child components
vi.mock('./table-body-cell', () => ({
    TableBodyCell: ({ cell }: { cell: any }) => <td data-testid={`cell-${cell.id}`}>{cell.renderValue()}</td>,
    Memo_TableBodyCell: ({ cell }: { cell: any }) => <td data-testid={`memo-cell-${cell.id}`}>{cell.renderValue()}</td>,
}));

vi.mock('./table-detail-panel', () => ({
    TableDetailPanel: () => <tr data-testid="detail-panel">Detail Panel</tr>,
}));

/**
 * Test for TableBodyRow component focusing on row rendering and interactions
 */
describe('TableBodyRow - Row Rendering and Interactions', () => {
    let mockTable: any;
    let mockRow: any;
    let mockCells: any[];

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            density: 'md',
            draggingColumn: null,
            draggingRow: null,
            editingCell: null,
            editingRow: null,
            hoveredRow: null,
            isFullScreen: false,
            rowPinning: { top: [], bottom: [] },
        });
        mockTable.options = {
            ...mockTable.options,
            enableRowOrdering: true,
            enableRowPinning: true,
            enableStickyFooter: false,
            enableStickyHeader: false,
            layoutMode: 'semantic',
            mantineTableBodyRowProps: {},
            memoMode: 'rows',
            renderDetailPanel: undefined,
            rowPinningDisplayMode: 'top-and-bottom',
        };
        mockTable.setHoveredRow = vi.fn();
        mockTable.refs = {
            tableFooterRef: { current: null },
            tableHeadRef: { current: null },
        };

        // Create mock cells
        mockCells = [
            {
                id: 'cell-1',
                renderValue: vi.fn(() => 'Cell 1'),
                column: { id: 'col-1' },
            },
            {
                id: 'cell-2',
                renderValue: vi.fn(() => 'Cell 2'),
                column: { id: 'col-2' },
            },
        ];

        // Create mock row
        mockRow = {
            id: 'row-1',
            index: 0,
            getVisibleCells: vi.fn(() => mockCells),
            getIsGrouped: vi.fn(() => false),
            getIsPinned: vi.fn(() => false),
            getIsSelected: vi.fn(() => false),
            getCanSelectSubRows: vi.fn(() => false),
            getIsAllSubRowsSelected: vi.fn(() => false),
            subRows: [],
        };
    });

    it('should render basic row with cells', () => {
        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('cell-cell-1')).toBeInTheDocument();
        expect(screen.getByTestId('cell-cell-2')).toBeInTheDocument();
        expect(screen.getByText('Cell 1')).toBeInTheDocument();
        expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });

    it('should render memoized cells when memo mode is cells', () => {
        mockTable.options.memoMode = 'cells';
        mockTable.getState = vi.fn().mockReturnValue({
            draggingColumn: null,
            draggingRow: null,
            editingCell: null,
            editingRow: null,
        });

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('memo-cell-cell-1')).toBeInTheDocument();
        expect(screen.getByTestId('memo-cell-cell-2')).toBeInTheDocument();
    });

    it('should render detail panel when enabled', () => {
        mockTable.options.renderDetailPanel = vi.fn(() => <div>Detail Content</div>);
        mockRow.getIsExpanded = vi.fn(() => true);

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
    });

    it('should not render detail panel when row is grouped', () => {
        mockTable.options.renderDetailPanel = vi.fn(() => <div>Detail Content</div>);
        mockRow.getIsGrouped = vi.fn(() => true);
        mockRow.getIsExpanded = vi.fn(() => true);

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });

    it('should handle drag enter for row ordering', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            draggingRow: { id: 'other-row' },
        });

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        fireEvent.dragEnter(row);

        expect(mockTable.setHoveredRow).toHaveBeenCalledWith(mockRow);
    });

    it('should not handle drag enter when row ordering is disabled', () => {
        mockTable.options.enableRowOrdering = false;
        mockTable.getState = vi.fn().mockReturnValue({
            draggingRow: { id: 'other-row' },
        });

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        fireEvent.dragEnter(row);

        expect(mockTable.setHoveredRow).not.toHaveBeenCalled();
    });

    it('should apply pinned row styles', () => {
        mockRow.getIsPinned = vi.fn(() => 'top');

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-row-pinned', 'top');
    });

    it('should apply sticky pinned row styles', () => {
        mockTable.options.rowPinningDisplayMode = 'sticky';
        mockRow.getIsPinned = vi.fn(() => 'top');

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                pinnedRowIds={['row-1']}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-row-pinned', 'sticky');
    });

    it('should apply dragging row styles', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            draggingRow: { id: 'row-1' },
        });

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-dragging-row', 'true');
    });

    it('should apply hovered row styles', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            hoveredRow: { id: 'row-1' },
        });

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-hovered-row-target', 'true');
    });

    it('should apply selected row styles', () => {
        // Mock the getIsRowSelected utility
        vi.doMock('../../utils/row-utils', () => ({
            getIsRowSelected: vi.fn(() => true),
        }));

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-selected', 'true');
    });

    it('should apply striped row styles', () => {
        mockTable.options.mantineTableBodyRowProps = {
            striped: 'odd',
        };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={1} // odd index
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-striped', 'odd');
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-row-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
                className={customClassName}
                style={customStyle}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass(customClassName);
        expect(row).toHaveStyle('background-color: red');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('flex');
    });

    it('should handle virtual row rendering', () => {
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('absolute top-0 translate-y-[calc(var(--ano-virtual-row-start)*1px)] transform transition-none will-change-transform');
    });

    it('should handle column virtualizer', () => {
        const columnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
                { index: 1, start: 100, size: 100 },
            ],
            virtualPaddingLeft: 0,
            virtualPaddingRight: 0,
        };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
                columnVirtualizer={columnVirtualizer}
            />
        );

        expect(screen.getByTestId('cell-cell-1')).toBeInTheDocument();
        expect(screen.getByTestId('cell-cell-2')).toBeInTheDocument();
    });

    it('should handle custom table row props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineTableBodyRowProps = vi.fn(() => customProps);

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('custom-props-class');
    });

    it('should handle row depth and expansion', () => {
        mockRow.depth = 2;
        mockRow.getIsExpanded = vi.fn(() => true);

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toBeInTheDocument();
    });

    it('should handle row with children', () => {
        mockRow.children = [
            { id: 'child-1', getVisibleCells: vi.fn(() => []) },
        ];

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByRole('row')).toBeInTheDocument();
    });

    it('should handle row virtualization with detail panel', () => {
        mockTable.options.renderDetailPanel = vi.fn(() => <div>Detail Content</div>);
        const rowVirtualizer = {
            measureElement: vi.fn(),
        };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
                rowVirtualizer={rowVirtualizer}
            />
        );

        expect(screen.getByRole('row')).toBeInTheDocument();
    });

    it('should handle pinned row positioning', () => {
        mockRow.getIsPinned = vi.fn(() => 'top');
        mockTable.options.enableStickyHeader = true;
        mockTable.refs.tableHeadRef.current = { clientHeight: 50 };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                pinnedRowIds={['row-1']}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-pinned-row-top': '49px' });
    });

    it('should handle bottom pinned row positioning', () => {
        mockRow.getIsPinned = vi.fn(() => 'bottom');
        mockTable.options.enableStickyFooter = true;
        mockTable.refs.tableFooterRef.current = { clientHeight: 30 };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                pinnedRowIds={['row-1']}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-pinned-row-bottom': '29px' });
    });

    it('should handle fullscreen mode', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });
        mockTable.options.enableStickyHeader = true;
        mockTable.refs.tableHeadRef.current = { clientHeight: 50 };

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toBeInTheDocument();
    });

    it('should handle row with custom children', () => {
        const customChildren = <td data-testid="custom-child">Custom Child</td>;

        render(
            <TableBodyRow
                row={mockRow}
                table={mockTable}
                renderedRowIndex={0}
                children={customChildren}
            />
        );

        expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('should handle row with different density states', () => {
        const densities = ['xs', 'sm', 'md', 'lg', 'xl'];

        densities.forEach((density) => {
            mockTable.getState = vi.fn().mockReturnValue({
                density,
            });

            render(
                <TableBodyRow
                    row={mockRow}
                    table={mockTable}
                    renderedRowIndex={0}
                />
            );

            expect(screen.getByRole('row')).toBeInTheDocument();
        });
    });
}); 