import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHeadCell } from './table-head-cell';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child components
vi.mock('./table-head-cell-filter-label', () => ({
    TableHeadCellFilterLabel: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="filter-label" data-header-id={header.id}>
            Filter Label
        </div>
    ),
}));

vi.mock('./table-head-cell-sort-label', () => ({
    TableHeadCellSortLabel: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="sort-label" data-header-id={header.id}>
            Sort Label
        </div>
    ),
}));

vi.mock('./table-head-cell-grab-handle', () => ({
    TableHeadCellGrabHandle: ({ column, table }: { column: any; table: any }) => (
        <div data-testid="grab-handle" data-column-id={column.id}>
            Grab Handle
        </div>
    ),
}));

vi.mock('./table-head-cell-resize-handle', () => ({
    TableHeadCellResizeHandle: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="resize-handle" data-header-id={header.id}>
            Resize Handle
        </div>
    ),
}));

vi.mock('./table-head-cell-filter-container', () => ({
    TableHeadCellFilterContainer: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="filter-container" data-header-id={header.id}>
            Filter Container
        </div>
    ),
}));

vi.mock('../menus/column-action-menu', () => ({
    ColumnActionMenu: ({ header, table }: { header: any; table: any }) => (
        <div data-testid="column-action-menu" data-header-id={header.id}>
            Column Action Menu
        </div>
    ),
}));

/**
 * Test for TableHeadCell component focusing on header cell functionality
 */
describe('TableHeadCell - Header Cell Functionality', () => {
    let mockTable: any;
    let mockHeader: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            columnFilterDisplayMode: 'subheader',
            columnResizeDirection: 'ltr',
            columnResizeMode: 'onChange',
            enableColumnActions: true,
            enableColumnDragging: true,
            enableColumnOrdering: true,
            enableColumnPinning: true,
            enableGrouping: true,
            enableHeaderActionsHoverReveal: true,
            enableMultiSort: true,
            layoutMode: 'table',
            mantineTableHeadCellProps: {
                className: 'default-head-cell-class',
            },
        };
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: false,
            },
            draggingColumn: null,
            grouping: [],
            hoveredColumn: null,
        }));
        mockTable.getVisibleFlatColumns = vi.fn(() => []);
        mockTable.refs = {
            tableHeadCellRefs: {
                current: {},
            },
        };
        mockTable.setHoveredColumn = vi.fn();

        // Create mock column
        mockColumn = {
            id: 'name',
            columnDef: {
                header: 'Name',
                columnDefType: 'data',
                enableColumnActions: true,
                enableColumnDragging: true,
                enableColumnOrdering: true,
                enableGrouping: true,
                mantineTableHeadCellProps: {
                    style: { color: 'red' },
                },
            },
            getCanSort: vi.fn(() => true),
            getCanFilter: vi.fn(() => true),
            getCanResize: vi.fn(() => true),
            getCanPin: vi.fn(() => true),
            getCanGroup: vi.fn(() => true),
            getIsSorted: vi.fn(() => false),
            getIsFiltered: vi.fn(() => false),
            getIsPinned: vi.fn(() => false),
            getIsFirstColumn: vi.fn(() => false),
            getIsLastColumn: vi.fn(() => false),
            getToggleSortingHandler: vi.fn(() => vi.fn()),
        };

        // Create mock header
        mockHeader = {
            id: 'name',
            column: mockColumn,
            isPlaceholder: false,
            subHeaders: [],
        };
    });

    it('should render basic header cell', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByRole('columnheader')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should render placeholder header cell', () => {
        mockHeader.isPlaceholder = true;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
        expect(headerCell).not.toHaveTextContent('Name');
    });

    it('should render filter label when column can filter', () => {
        mockColumn.getIsFiltered = vi.fn(() => true);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-label')).toBeInTheDocument();
    });

    it('should render sort label when column can sort', () => {
        mockColumn.getIsSorted = vi.fn(() => true);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('sort-label')).toBeInTheDocument();
    });

    it('should render grab handle when column dragging is enabled', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('grab-handle')).toBeInTheDocument();
    });

    it('should render resize handle when column can resize', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
    });

    it('should render column action menu when enabled', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('column-action-menu')).toBeInTheDocument();
    });

    it('should render filter container in subheader mode', () => {
        mockColumn.getCanFilter = vi.fn(() => true);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('filter-container')).toBeInTheDocument();
    });

    it('should apply pinned column styles', () => {
        mockColumn.getIsPinned = vi.fn(() => 'left');

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-column-pinned', 'left');
    });

    it('should apply dragging column styles', () => {
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: false,
            },
            draggingColumn: mockColumn,
            grouping: [],
            hoveredColumn: null,
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-dragging-column', 'true');
    });

    it('should apply hovered column styles', () => {
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: false,
            },
            draggingColumn: null,
            grouping: [],
            hoveredColumn: mockColumn,
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-hovered-column-target', 'true');
    });

    it('should apply custom className and style', () => {
        render(
            <TableHeadCell
                className="custom-head-cell-class"
                header={mockHeader}
                style={{ backgroundColor: 'blue' }}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('custom-head-cell-class');
        expect(headerCell).toHaveStyle('background-color: blue');
    });

    it('should handle drag enter event', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        fireEvent.dragEnter(headerCell);

        expect(mockTable.setHoveredColumn).toHaveBeenCalled();
    });

    it('should handle mouse enter and leave events', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        
        fireEvent.mouseEnter(headerCell);
        fireEvent.mouseLeave(headerCell);

        expect(headerCell).toBeInTheDocument();
    });

    it('should handle column header click for sorting', () => {
        const mockToggleHandler = vi.fn();
        mockColumn.getToggleSortingHandler = vi.fn(() => mockToggleHandler);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerContent = screen.getByText('Name').parentElement;
        fireEvent.click(headerContent!);

        expect(mockToggleHandler).toHaveBeenCalled();
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('flex', 'flex-col');
    });

    it('should apply grid-no-grow layout styles', () => {
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('flex', 'flex-col');
    });

    it('should handle column virtualization', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
                { index: 1, start: 100, size: 100 },
            ],
        };

        render(
            <TableHeadCell
                columnVirtualizer={mockColumnVirtualizer}
                header={mockHeader}
                renderedHeaderIndex={0}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-index', '0');
    });

    it('should handle custom header element', () => {
        mockColumn.columnDef.Header = vi.fn(() => <span>Custom Header</span>);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('should handle function header element', () => {
        mockColumn.columnDef.Header = vi.fn(() => 'Function Header');

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByText('Function Header')).toBeInTheDocument();
    });

    it('should handle group column type', () => {
        mockColumn.columnDef.columnDefType = 'group';

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
    });

    it('should handle display column type', () => {
        mockColumn.columnDef.columnDefType = 'display';

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
    });

    it('should handle custom table cell props', () => {
        mockTable.options.mantineTableHeadCellProps = {
            className: 'custom-table-props-class',
            style: { fontSize: '16px' },
        };

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('custom-table-props-class');
    });

    it('should handle function-based table cell props', () => {
        mockTable.options.mantineTableHeadCellProps = vi.fn(() => ({
            className: 'function-table-props-class',
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('function-table-props-class');
    });

    it('should handle column-specific table cell props', () => {
        mockColumn.columnDef.mantineTableHeadCellProps = {
            className: 'column-props-class',
        };

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('column-props-class');
    });

    it('should handle function-based column table cell props', () => {
        mockColumn.columnDef.mantineTableHeadCellProps = vi.fn(() => ({
            className: 'function-column-props-class',
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveClass('function-column-props-class');
    });

    it('should handle custom children prop', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            >
                <span>Custom Children</span>
            </TableHeadCell>
        );

        expect(screen.getByText('Custom Children')).toBeInTheDocument();
    });

    it('should handle header actions hover reveal', () => {
        mockTable.options.enableHeaderActionsHoverReveal = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('column-action-menu')).toBeInTheDocument();
    });

    it('should handle column resizing state', () => {
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: 'name',
            },
            draggingColumn: null,
            grouping: [],
            hoveredColumn: null,
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-resizing', 'ltr');
    });

    it('should handle RTL column resize direction', () => {
        mockTable.options.columnResizeDirection = 'rtl';
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: 'name',
            },
            draggingColumn: null,
            grouping: [],
            hoveredColumn: null,
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-resizing', 'rtl');
    });

    it('should handle first and last pinned column styles', () => {
        mockColumn.getIsPinned = vi.fn(() => 'left');
        mockColumn.getIsFirstColumn = vi.fn(() => true);
        mockColumn.getIsLastColumn = vi.fn(() => false);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-first-right-pinned', undefined);
        expect(headerCell).toHaveAttribute('data-last-left-pinned', 'true');
    });

    it('should handle right pinned column styles', () => {
        mockColumn.getIsPinned = vi.fn(() => 'right');
        mockColumn.getIsFirstColumn = vi.fn(() => true);
        mockColumn.getIsLastColumn = vi.fn(() => false);

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveAttribute('data-first-right-pinned', 'true');
        expect(headerCell).not.toHaveAttribute('data-last-left-pinned');
    });

    it('should handle column alignment', () => {
        mockTable.options.mantineTableHeadCellProps = {
            align: 'center',
        };

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
    });

    it('should handle right alignment', () => {
        mockTable.options.mantineTableHeadCellProps = {
            align: 'right',
        };

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
    });

    it('should handle column width styles', () => {
        mockColumn.columnDef.minSize = 100;
        mockColumn.columnDef.grow = 1;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveStyle('min-width: 100px');
    });

    it('should handle grid layout with grow value', () => {
        mockTable.options.layoutMode = 'grid';
        mockColumn.columnDef.grow = 2;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveStyle('flex: 2 0 auto');
    });

    it('should handle grid-no-grow layout with grow value', () => {
        mockTable.options.layoutMode = 'grid-no-grow';
        mockColumn.columnDef.grow = 0.5;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toHaveStyle('flex: 0.5 0 auto');
    });

    it('should handle column pinning disabled', () => {
        mockTable.options.enableColumnPinning = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).not.toHaveAttribute('data-column-pinned');
    });

    it('should handle group column pinning disabled', () => {
        mockColumn.columnDef.columnDefType = 'group';

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).not.toHaveAttribute('data-column-pinned');
    });

    it('should handle column actions disabled', () => {
        mockTable.options.enableColumnActions = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('column-action-menu')).not.toBeInTheDocument();
    });

    it('should handle column-specific actions disabled', () => {
        mockColumn.columnDef.enableColumnActions = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('column-action-menu')).not.toBeInTheDocument();
    });

    it('should handle column dragging disabled', () => {
        mockTable.options.enableColumnDragging = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column-specific dragging disabled', () => {
        mockColumn.columnDef.enableColumnDragging = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column ordering disabled', () => {
        mockTable.options.enableColumnOrdering = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column-specific ordering disabled', () => {
        mockColumn.columnDef.enableColumnOrdering = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column grouping disabled', () => {
        mockTable.options.enableGrouping = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column-specific grouping disabled', () => {
        mockColumn.columnDef.enableGrouping = false;

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column in grouping state', () => {
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: false,
            },
            draggingColumn: null,
            grouping: ['name'],
            hoveredColumn: null,
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('grab-handle')).not.toBeInTheDocument();
    });

    it('should handle column resizing state', () => {
        mockTable.getState = vi.fn(() => ({
            columnSizingInfo: {
                isResizingColumn: 'name',
            },
            draggingColumn: null,
            grouping: [],
            hoveredColumn: null,
        }));

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('column-action-menu')).not.toBeInTheDocument();
    });

    it('should handle header cell ref assignment', () => {
        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
    });

    it('should handle custom ref prop', () => {
        const customRef = { current: null };
        mockTable.options.mantineTableHeadCellProps = {
            ref: customRef,
        };

        render(
            <TableHeadCell
                header={mockHeader}
                table={mockTable}
            />
        );

        const headerCell = screen.getByRole('columnheader');
        expect(headerCell).toBeInTheDocument();
    });
}); 