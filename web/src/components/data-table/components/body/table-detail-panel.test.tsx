import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableDetailPanel } from './table-detail-panel';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('../inputs/edit-cell-text-input', () => ({
    EditCellTextInput: ({ cell }: { cell: any }) => (
        <input data-testid={`edit-input-${cell.id}`} defaultValue="Edit Value" />
    ),
}));

/**
 * Test for TableDetailPanel component focusing on detail panel rendering
 */
describe('TableDetailPanel - Detail Panel Rendering', () => {
    let mockTable: any;
    let mockRow: any;
    let mockParentRowRef: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            isLoading: false,
        });
        mockTable.options = {
            ...mockTable.options,
            layoutMode: 'semantic',
            mantineDetailPanelProps: {},
            mantineTableBodyRowProps: {},
            renderDetailPanel: vi.fn(() => <div data-testid="detail-content">Detail Content</div>),
        };
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'col-1' },
            { id: 'col-2' },
            { id: 'col-3' },
        ]);
        mockTable.getTotalSize = vi.fn(() => 300);

        // Create mock row
        mockRow = {
            id: 'row-1',
            getIsExpanded: vi.fn(() => true),
            getIsGrouped: vi.fn(() => false),
            getAllCells: vi.fn(() => [
                { id: 'cell-1', column: { columnDef: { columnDefType: 'data' } } },
                { id: 'cell-2', column: { columnDef: { columnDefType: 'data' } } },
            ]),
        };

        // Create mock parent row ref
        mockParentRowRef = { current: document.createElement('tr') };
    });

    it('should render detail panel when row is expanded', () => {
        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('detail-content')).toBeInTheDocument();
        expect(screen.getByText('Detail Content')).toBeInTheDocument();
    });

    it('should not render detail panel when row is not expanded', () => {
        mockRow.getIsExpanded = vi.fn(() => false);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.queryByTestId('detail-content')).not.toBeInTheDocument();
    });

    it('should not render detail panel when row is grouped', () => {
        mockRow.getIsGrouped = vi.fn(() => true);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.queryByTestId('detail-content')).not.toBeInTheDocument();
    });

    it('should render edit inputs for data cells', () => {
        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('edit-input-cell-1')).toBeInTheDocument();
        expect(screen.getByTestId('edit-input-cell-2')).toBeInTheDocument();
    });

    it('should not render edit inputs for non-data cells', () => {
        mockRow.getAllCells = vi.fn(() => [
            { id: 'cell-1', column: { columnDef: { columnDefType: 'display' } } },
            { id: 'cell-2', column: { columnDef: { columnDefType: 'group' } } },
        ]);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.queryByTestId('edit-input-cell-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('edit-input-cell-2')).not.toBeInTheDocument();
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-detail-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                className={customClassName}
                style={customStyle}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass(customClassName);
        expect(row).toHaveStyle('background-color: rgb(255, 0, 0)');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('flex');
    });

    it('should handle virtual row rendering', () => {
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('absolute top-[var(--ano-parent-row-height)] z-10 translate-y-[var(--ano-virtual-row-start)] transition-none');
    });

    it('should handle row virtualization', () => {
        const rowVirtualizer = {
            measureElement: vi.fn(),
        };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                rowVirtualizer={rowVirtualizer}
            />
        );

        expect(rowVirtualizer.measureElement).toHaveBeenCalled();
    });

    it('should calculate correct colspan', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'col-1' },
            { id: 'col-2' },
            { id: 'col-3' },
            { id: 'col-4' },
        ]);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('colspan', '4');
    });

    it('should handle custom table detail panel props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineDetailPanelProps = vi.fn(() => customProps);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('custom-props-class');
    });

    it('should handle custom table body row props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-row-props-class',
        };
        mockTable.options.mantineTableBodyRowProps = vi.fn(() => customProps);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('custom-row-props-class');
    });

    it('should handle striped rows', () => {
        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                striped="odd"
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('data-striped', 'odd');
    });

    it('should handle parent row height calculation', () => {
        mockParentRowRef.current = {
            getBoundingClientRect: vi.fn(() => ({ height: 50 })),
        };
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': '50px' });
    });

    it('should handle virtual row start calculation', () => {
        const virtualRow = { index: 0, start: 100, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-virtual-row-start': '100px' });
    });

    it('should handle table total size calculation', () => {
        mockTable.getTotalSize = vi.fn(() => 500);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle({ '--ano-inner-width': '500px' });
    });

    it('should handle loading state', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isLoading: true,
        });

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.queryByTestId('detail-content')).not.toBeInTheDocument();
    });

    it('should handle custom render detail panel function', () => {
        const customRenderFunction = vi.fn(({ internalEditComponents, row, table }) => (
            <div data-testid="custom-detail">
                Custom Detail for {row.id}
                {internalEditComponents}
            </div>
        ));
        mockTable.options.renderDetailPanel = customRenderFunction;

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('custom-detail')).toBeInTheDocument();
        expect(screen.getByText('Custom Detail for row-1')).toBeInTheDocument();
        expect(customRenderFunction).toHaveBeenCalledWith({
            internalEditComponents: expect.any(Array),
            row: mockRow,
            table: mockTable,
        });
    });

    it('should handle row virtualization with detail panel', () => {
        const rowVirtualizer = {
            measureElement: vi.fn(),
        };
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                rowVirtualizer={rowVirtualizer}
                virtualRow={virtualRow}
            />
        );

        expect(rowVirtualizer.measureElement).toHaveBeenCalled();
    });

    it('should handle different layout modes', () => {
        const layoutModes = ['semantic', 'grid', 'grid-no-grow'];

        layoutModes.forEach((layoutMode) => {
            mockTable.options.layoutMode = layoutMode;

            render(
                <TableDetailPanel
                    row={mockRow}
                    table={mockTable}
                    parentRowRef={mockParentRowRef}
                    renderedRowIndex={0}
                />
            );

            expect(screen.getByRole('row')).toBeInTheDocument();
        });
    });

    it('should handle empty cells array', () => {
        mockRow.getAllCells = vi.fn(() => []);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('detail-content')).toBeInTheDocument();
    });

    it('should handle cells with undefined columnDef', () => {
        mockRow.getAllCells = vi.fn(() => [
            { id: 'cell-1', column: { columnDef: undefined } },
        ]);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('detail-content')).toBeInTheDocument();
    });

    it('should handle cells with undefined columnDefType', () => {
        mockRow.getAllCells = vi.fn(() => [
            { id: 'cell-1', column: { columnDef: { columnDefType: undefined } } },
        ]);

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('detail-content')).toBeInTheDocument();
    });

    it('should handle parent row ref with null current', () => {
        mockParentRowRef.current = null;
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': 'undefinedpx' });
    });

    it('should handle parent row ref with undefined current', () => {
        mockParentRowRef.current = undefined;
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': 'undefinedpx' });
    });

    it('should handle parent row ref with missing getBoundingClientRect', () => {
        mockParentRowRef.current = {};
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': 'undefinedpx' });
    });

    it('should handle parent row ref with getBoundingClientRect returning null', () => {
        mockParentRowRef.current = {
            getBoundingClientRect: vi.fn(() => null),
        };
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': 'undefinedpx' });
    });

    it('should handle parent row ref with getBoundingClientRect returning undefined', () => {
        mockParentRowRef.current = {
            getBoundingClientRect: vi.fn(() => undefined),
        };
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': 'undefinedpx' });
    });

    it('should handle parent row ref with getBoundingClientRect returning object without height', () => {
        mockParentRowRef.current = {
            getBoundingClientRect: vi.fn(() => ({ width: 100 })),
        };
        const virtualRow = { index: 0, start: 0, size: 50 };

        render(
            <TableDetailPanel
                row={mockRow}
                table={mockTable}
                parentRowRef={mockParentRowRef}
                renderedRowIndex={0}
                virtualRow={virtualRow}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ '--ano-parent-row-height': 'undefinedpx' });
    });
}); 