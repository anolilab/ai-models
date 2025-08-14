import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHeadRow } from './table-head-row';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('./table-head-cell', () => ({
    TableHeadCell: ({ header, table, columnVirtualizer, renderedHeaderIndex }: { header: any; table: any; columnVirtualizer?: any; renderedHeaderIndex?: number }) => (
        <th data-testid={`head-cell-${header.id}`} data-index={renderedHeaderIndex}>
            {header.column.columnDef.header}
            {columnVirtualizer && <span data-testid="virtualizer-present">Virtualizer</span>}
        </th>
    ),
}));

/**
 * Test for TableHeadRow component focusing on header row functionality
 */
describe('TableHeadRow - Header Row Functionality', () => {
    let mockTable: any;
    let mockHeaderGroup: any;
    let mockHeaders: any[];

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            enableStickyHeader: false,
            layoutMode: 'table',
            mantineTableHeadRowProps: {
                className: 'default-head-row-class',
            },
        };
        mockTable.getState = vi.fn(() => ({
            isFullScreen: false,
        }));

        // Create mock headers
        mockHeaders = [
            {
                id: 'name',
                column: {
                    id: 'name',
                    columnDef: { header: 'Name' },
                },
            },
            {
                id: 'age',
                column: {
                    id: 'age',
                    columnDef: { header: 'Age' },
                },
            },
            {
                id: 'email',
                column: {
                    id: 'email',
                    columnDef: { header: 'Email' },
                },
            },
        ];

        // Create mock header group
        mockHeaderGroup = {
            id: 'header-group-1',
            headers: mockHeaders,
        };
    });

    it('should render basic header row', () => {
        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByRole('row')).toBeInTheDocument();
        expect(screen.getByTestId('head-cell-name')).toBeInTheDocument();
        expect(screen.getByTestId('head-cell-age')).toBeInTheDocument();
        expect(screen.getByTestId('head-cell-email')).toBeInTheDocument();
    });

    it('should render header cells with correct content', () => {
        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should apply sticky header styles when enabled', () => {
        mockTable.options.enableStickyHeader = true;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('sticky', 'top-0');
    });

    it('should apply sticky header styles when in fullscreen', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: true,
        }));

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('sticky', 'top-0');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('flex');
    });

    it('should apply grid-no-grow layout styles', () => {
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('flex');
    });

    it('should apply custom className and style', () => {
        render(
            <TableHeadRow
                className="custom-head-row-class"
                headerGroup={mockHeaderGroup}
                style={{ backgroundColor: 'blue' }}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('custom-head-row-class');
        expect(headerRow).toHaveStyle('background-color: blue');
    });

    it('should handle custom table head row props', () => {
        mockTable.options.mantineTableHeadRowProps = {
            className: 'custom-table-props-class',
            style: { fontSize: '16px' },
        };

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('custom-table-props-class');
    });

    it('should handle function-based table head row props', () => {
        mockTable.options.mantineTableHeadRowProps = vi.fn(() => ({
            className: 'function-table-props-class',
        }));

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toHaveClass('function-table-props-class');
    });

    it('should handle column virtualization with virtual columns', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
                { index: 1, start: 100, size: 100 },
            ],
            virtualPaddingLeft: 50,
            virtualPaddingRight: 50,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getAllByTestId('virtualizer-present')).toHaveLength(2);
    });

    it('should handle column virtualization without virtual columns', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [],
            virtualPaddingLeft: 0,
            virtualPaddingRight: 0,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('virtualizer-present')).not.toBeInTheDocument();
    });

    it('should handle column virtualization with only left padding', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
            ],
            virtualPaddingLeft: 50,
            virtualPaddingRight: 0,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('virtualizer-present')).toBeInTheDocument();
    });

    it('should handle column virtualization with only right padding', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
            ],
            virtualPaddingLeft: 0,
            virtualPaddingRight: 50,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('virtualizer-present')).toBeInTheDocument();
    });

    it('should handle column virtualization with zero padding', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
            ],
            virtualPaddingLeft: 0,
            virtualPaddingRight: 0,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('virtualizer-present')).toBeInTheDocument();
    });

    it('should handle empty headers array', () => {
        mockHeaderGroup.headers = [];

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined headers', () => {
        mockHeaderGroup.headers = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle null headers', () => {
        mockHeaderGroup.headers = null;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined layoutMode', () => {
        mockTable.options.layoutMode = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined mantineTableHeadRowProps', () => {
        mockTable.options.mantineTableHeadRowProps = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle null mantineTableHeadRowProps', () => {
        mockTable.options.mantineTableHeadRowProps = null;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined columnVirtualizer', () => {
        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle null columnVirtualizer', () => {
        render(
            <TableHeadRow
                columnVirtualizer={null}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle virtual columns with missing index', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { start: 0, size: 100 }, // Missing index
            ],
            virtualPaddingLeft: 0,
            virtualPaddingRight: 0,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle virtual columns with invalid index', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 999, start: 0, size: 100 }, // Invalid index
            ],
            virtualPaddingLeft: 0,
            virtualPaddingRight: 0,
        };

        render(
            <TableHeadRow
                columnVirtualizer={mockColumnVirtualizer}
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle single header', () => {
        mockHeaderGroup.headers = [mockHeaders[0]];

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('head-cell-name')).toBeInTheDocument();
        expect(screen.queryByTestId('head-cell-age')).not.toBeInTheDocument();
        expect(screen.queryByTestId('head-cell-email')).not.toBeInTheDocument();
    });

    it('should handle multiple headers', () => {
        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('head-cell-name')).toBeInTheDocument();
        expect(screen.getByTestId('head-cell-age')).toBeInTheDocument();
        expect(screen.getByTestId('head-cell-email')).toBeInTheDocument();
    });

    it('should handle headers with undefined column', () => {
        mockHeaders[0].column = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle headers with undefined columnDef', () => {
        mockHeaders[0].column.columnDef = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle headers with undefined header', () => {
        mockHeaders[0].column.columnDef.header = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle headers with null header', () => {
        mockHeaders[0].column.columnDef.header = null;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle headers with empty header', () => {
        mockHeaders[0].column.columnDef.header = '';

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle headers with number header', () => {
        mockHeaders[0].column.columnDef.header = 42;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle headers with boolean header', () => {
        mockHeaders[0].column.columnDef.header = true;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('should handle different header group IDs', () => {
        mockHeaderGroup.id = 'custom-header-group';

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined header group ID', () => {
        mockHeaderGroup.id = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle null header group ID', () => {
        mockHeaderGroup.id = null;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle empty header group ID', () => {
        mockHeaderGroup.id = '';

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined enableStickyHeader', () => {
        mockTable.options.enableStickyHeader = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).not.toHaveClass('sticky', 'top-0');
    });

    it('should handle null enableStickyHeader', () => {
        mockTable.options.enableStickyHeader = null;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).not.toHaveClass('sticky', 'top-0');
    });

    it('should handle undefined isFullScreen', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: undefined,
        }));

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).not.toHaveClass('sticky', 'top-0');
    });

    it('should handle null isFullScreen', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: null,
        }));

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).not.toHaveClass('sticky', 'top-0');
    });

    it('should handle missing getState method', () => {
        delete mockTable.getState;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle getState returning undefined', () => {
        mockTable.getState = vi.fn(() => undefined);

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle getState returning null', () => {
        mockTable.getState = vi.fn(() => null);

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle missing options', () => {
        delete mockTable.options;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle undefined options', () => {
        mockTable.options = undefined;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });

    it('should handle null options', () => {
        mockTable.options = null;

        render(
            <TableHeadRow
                headerGroup={mockHeaderGroup}
                table={mockTable}
            />
        );

        const headerRow = screen.getByRole('row');
        expect(headerRow).toBeInTheDocument();
    });
}); 