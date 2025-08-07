import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableBodyCell } from './table-body-cell';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child components
vi.mock('./table-body-cell-value', () => ({
    default: ({ cell }: { cell: any }) => <div data-testid="cell-value">{cell.renderValue()}</div>,
}));

vi.mock('../buttons/copy-button', () => ({
    CopyButton: ({ children }: { children: React.ReactNode }) => <div data-testid="copy-button">{children}</div>,
}));

vi.mock('../inputs/edit-cell-text-input', () => ({
    EditCellTextInput: () => <div data-testid="edit-input">Edit Input</div>,
}));

/**
 * Test for TableBodyCell component focusing on cell rendering and interactions
 */
describe('TableBodyCell - Cell Rendering and Interactions', () => {
    let mockTable: any;
    let mockCell: any;
    let mockRow: any;
    let mockColumn: any;
    let mockRowRef: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            columnSizingInfo: null,
            creatingRow: null,
            density: 'md',
            draggingColumn: null,
            editingCell: null,
            editingRow: null,
            hoveredColumn: null,
            isLoading: false,
            showSkeletons: false,
        });
        mockTable.options = {
            ...mockTable.options,
            columnResizeDirection: 'ltr',
            columnResizeMode: 'onChange',
            createDisplayMode: 'modal',
            editDisplayMode: 'cell',
            enableClickToCopy: true,
            enableColumnOrdering: true,
            enableColumnPinning: true,
            enableEditing: true,
            enableGrouping: true,
            layoutMode: 'semantic',
            mantineSkeletonProps: {},
            mantineTableBodyCellProps: {},
        };
        mockTable.setEditingCell = vi.fn();
        mockTable.setHoveredColumn = vi.fn();
        mockTable.refs = {
            editInputRefs: { current: {} },
        };

        // Create mock column
        mockColumn = {
            id: 'name',
            getSize: vi.fn(() => 150),
            getIsPinned: vi.fn(() => false),
            getStart: vi.fn(() => 0),
            getAfter: vi.fn(() => 150),
            columnDef: {
                columnDefType: 'data',
                minSize: 30,
                grow: 1,
                enableEditing: true,
                enableClickToCopy: true,
                enableCellHoverReveal: false,
                mantineTableBodyCellProps: {},
            },
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
            getIsGrouped: vi.fn(() => false),
        };

        // Create mock cell
        mockCell = {
            id: 'cell-1',
            getValue: vi.fn(() => 'Test Value'),
            renderValue: vi.fn(() => 'Test Value'),
            getIsPlaceholder: vi.fn(() => false),
            getIsGrouped: vi.fn(() => false),
            column: mockColumn,
            row: mockRow,
        };

        // Create mock row ref
        mockRowRef = { current: document.createElement('tr') };
    });

    it('should render basic cell with value', () => {
        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('cell-value')).toBeInTheDocument();
        expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('should render skeleton when loading', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isLoading: true,
            showSkeletons: false,
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });

    it('should render skeleton when showSkeletons is true', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isLoading: false,
            showSkeletons: true,
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });

    it('should render edit input when cell is being edited', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            editingCell: { id: 'cell-1' },
            editDisplayMode: 'cell',
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });

    it('should render copy button when click to copy is enabled', () => {
        mockColumn.columnDef.enableClickToCopy = true;

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    it('should not render copy button when click to copy is disabled', () => {
        mockColumn.columnDef.enableClickToCopy = false;

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
    });

    it('should handle double click to start editing', async () => {
        const user = userEvent.setup();
        mockTable.options.editDisplayMode = 'cell';

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        await user.dblClick(cell);

        expect(mockTable.setEditingCell).toHaveBeenCalledWith(mockCell);
    });

    it('should not start editing on double click when editing is disabled', async () => {
        const user = userEvent.setup();
        mockTable.options.enableEditing = false;

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        await user.dblClick(cell);

        expect(mockTable.setEditingCell).not.toHaveBeenCalled();
    });

    it('should not start editing on double click when column editing is disabled', async () => {
        const user = userEvent.setup();
        mockColumn.columnDef.enableEditing = false;

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        await user.dblClick(cell);

        expect(mockTable.setEditingCell).not.toHaveBeenCalled();
    });

    it('should handle drag enter for column ordering', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            draggingColumn: { id: 'other-column' },
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        fireEvent.dragEnter(cell);

        expect(mockTable.setHoveredColumn).toHaveBeenCalledWith(mockColumn);
    });

    it('should not handle drag enter when column ordering is disabled', () => {
        mockTable.options.enableColumnOrdering = false;
        mockTable.getState = vi.fn().mockReturnValue({
            draggingColumn: { id: 'other-column' },
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        fireEvent.dragEnter(cell);

        expect(mockTable.setHoveredColumn).not.toHaveBeenCalled();
    });

    it('should apply pinned column styles', () => {
        mockColumn.getIsPinned = vi.fn(() => 'left');
        mockColumn.getStart = vi.fn(() => 100);

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-column-pinned', 'left');
        expect(cell).toHaveStyle({ '--ano-table-cell-left': '100px' });
    });

    it('should apply dragging column styles', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            draggingColumn: { id: 'name' },
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-dragging-column', 'true');
    });

    it('should apply hovered column styles', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            hoveredColumn: { id: 'name' },
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-hovered-column-target', 'true');
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-cell-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
                className={customClassName}
                style={customStyle}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass(customClassName);
        expect(cell).toHaveStyle('background-color: red');
    });

    it('should handle cell hover reveal when enabled', () => {
        mockColumn.columnDef.enableCellHoverReveal = true;

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('overflow-visible');
    });

    it('should show grouped row count when cell is grouped', () => {
        mockCell.getIsGrouped = vi.fn(() => true);
        mockRow.subRows = [{ id: 'sub-1' }, { id: 'sub-2' }];

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('should apply density-based styles', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            density: 'xs',
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('whitespace-nowrap');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('flex items-center justify-start');
    });

    it('should handle virtual cell rendering', () => {
        const virtualCell = { index: 0, start: 0, size: 100 };

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
                virtualCell={virtualCell}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('transition-none');
    });

    it('should handle placeholder cells', () => {
        mockCell.getIsPlaceholder = vi.fn(() => true);

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        // Should not be editable when placeholder
        const cell = screen.getByRole('cell');
        expect(cell).not.toHaveClass('cursor-pointer');
    });

    it('should handle custom table cell props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineTableBodyCellProps = vi.fn(() => customProps);

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('custom-props-class');
    });

    it('should handle column-specific table cell props', () => {
        const customProps = {
            className: 'column-specific-class',
        };
        mockColumn.columnDef.mantineTableBodyCellProps = vi.fn(() => customProps);

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('column-specific-class');
    });

    it('should handle resizing styles', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            columnSizingInfo: {
                isResizingColumn: 'name',
            },
        });

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-resizing', 'ltr');
    });

    it('should handle last row styles', () => {
        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={4}
                numRows={5}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-last-row', 'true');
    });

    it('should handle first and last pinned column styles', () => {
        mockColumn.getIsPinned = vi.fn(() => 'left');
        mockColumn.getIsFirstColumn = vi.fn(() => false);
        mockColumn.getIsLastColumn = vi.fn(() => true);

        render(
            <TableBodyCell
                cell={mockCell}
                table={mockTable}
                rowRef={mockRowRef}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-last-left-pinned', 'true');
    });
}); 