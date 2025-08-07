import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableHead } from './table-head';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child components
vi.mock('./table-head-row', () => ({
    TableHeadRow: ({ headerGroup, table, columnVirtualizer }: { headerGroup: any; table: any; columnVirtualizer?: any }) => (
        <tr data-testid={`head-row-${headerGroup.id}`}>
            <td>Header Row {headerGroup.id}</td>
            {columnVirtualizer && <td data-testid="virtualizer-present">Virtualizer</td>}
        </tr>
    ),
}));

vi.mock('../toolbar/toolbar-alert-banner', () => ({
    ToolbarAlertBanner: ({ table }: { table: any }) => (
        <div data-testid="alert-banner">
            Alert Banner
        </div>
    ),
}));

/**
 * Test for TableHead component focusing on header functionality
 */
describe('TableHead - Header Functionality', () => {
    let mockTable: any;
    let mockHeaderGroups: any[];

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            enableStickyHeader: false,
            layoutMode: 'table',
            mantineTableHeadProps: {
                className: 'default-head-class',
            },
            positionToolbarAlertBanner: 'head-overlay',
        };
        mockTable.getState = vi.fn(() => ({
            isFullScreen: false,
            showAlertBanner: false,
        }));
        mockTable.getHeaderGroups = vi.fn(() => mockHeaderGroups);
        mockTable.getSelectedRowModel = vi.fn(() => ({
            rows: [],
        }));
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'name' },
            { id: 'age' },
            { id: 'email' },
        ]);
        mockTable.refs = {
            tableHeadRef: {
                current: null,
            },
        };

        // Create mock header groups
        mockHeaderGroups = [
            {
                id: 'header-group-1',
                headers: [
                    { id: 'name', column: { id: 'name', columnDef: { header: 'Name' } } },
                    { id: 'age', column: { id: 'age', columnDef: { header: 'Age' } } },
                ],
            },
            {
                id: 'header-group-2',
                headers: [
                    { id: 'email', column: { id: 'email', columnDef: { header: 'Email' } } },
                ],
            },
        ];
    });

    it('should render basic table head', () => {
        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.getByRole('rowgroup')).toBeInTheDocument();
        expect(screen.getByTestId('head-row-header-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('head-row-header-group-2')).toBeInTheDocument();
    });

    it('should render header rows with correct content', () => {
        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.getByText('Header Row header-group-1')).toBeInTheDocument();
        expect(screen.getByText('Header Row header-group-2')).toBeInTheDocument();
    });

    it('should apply sticky header styles when enabled', () => {
        mockTable.options.enableStickyHeader = true;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('sticky', 'top-0', 'z-30');
    });

    it('should apply sticky header styles when in fullscreen', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: true,
            showAlertBanner: false,
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('sticky', 'top-0', 'z-30');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('grid');
    });

    it('should apply grid-no-grow layout styles', () => {
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('grid');
    });

    it('should apply custom className and style', () => {
        render(
            <TableHead
                className="custom-head-class"
                style={{ backgroundColor: 'blue' }}
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('custom-head-class');
        expect(tableHead).toHaveStyle('background-color: blue');
    });

    it('should handle custom table head props', () => {
        mockTable.options.mantineTableHeadProps = {
            className: 'custom-table-props-class',
            style: { fontSize: '16px' },
        };

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('custom-table-props-class');
    });

    it('should handle function-based table head props', () => {
        mockTable.options.mantineTableHeadProps = vi.fn(() => ({
            className: 'function-table-props-class',
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toHaveClass('function-table-props-class');
    });

    it('should handle column virtualizer', () => {
        const mockColumnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
                { index: 1, start: 100, size: 100 },
            ],
        };

        render(
            <TableHead
                columnVirtualizer={mockColumnVirtualizer}
                table={mockTable}
            />
        );

        expect(screen.getAllByTestId('virtualizer-present')).toHaveLength(2);
    });

    it('should handle undefined column virtualizer', () => {
        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('virtualizer-present')).not.toBeInTheDocument();
    });

    it('should handle null column virtualizer', () => {
        render(
            <TableHead
                columnVirtualizer={null}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('virtualizer-present')).not.toBeInTheDocument();
    });

    it('should render alert banner when showAlertBanner is true', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: false,
            showAlertBanner: true,
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.getByTestId('alert-banner')).toBeInTheDocument();
    });

    it('should render alert banner when selected rows exist', () => {
        mockTable.getSelectedRowModel = vi.fn(() => ({
            rows: [{ id: 'row-1' }],
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.getByTestId('alert-banner')).toBeInTheDocument();
    });

    it('should not render alert banner when showAlertBanner is false and no selected rows', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: false,
            showAlertBanner: false,
        }));
        mockTable.getSelectedRowModel = vi.fn(() => ({
            rows: [],
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('alert-banner')).not.toBeInTheDocument();
    });

    it('should handle different alert banner positions', () => {
        mockTable.options.positionToolbarAlertBanner = 'top';

        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('alert-banner')).not.toBeInTheDocument();
    });

    it('should handle empty header groups', () => {
        mockTable.getHeaderGroups = vi.fn(() => []);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined header groups', () => {
        mockTable.getHeaderGroups = vi.fn(() => undefined);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle null header groups', () => {
        mockTable.getHeaderGroups = vi.fn(() => null);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined layoutMode', () => {
        mockTable.options.layoutMode = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined mantineTableHeadProps', () => {
        mockTable.options.mantineTableHeadProps = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle null mantineTableHeadProps', () => {
        mockTable.options.mantineTableHeadProps = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined enableStickyHeader', () => {
        mockTable.options.enableStickyHeader = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).not.toHaveClass('sticky', 'top-0', 'z-30');
    });

    it('should handle null enableStickyHeader', () => {
        mockTable.options.enableStickyHeader = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).not.toHaveClass('sticky', 'top-0', 'z-30');
    });

    it('should handle undefined isFullScreen', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: undefined,
            showAlertBanner: false,
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).not.toHaveClass('sticky', 'top-0', 'z-30');
    });

    it('should handle null isFullScreen', () => {
        mockTable.getState = vi.fn(() => ({
            isFullScreen: null,
            showAlertBanner: false,
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).not.toHaveClass('sticky', 'top-0', 'z-30');
    });

    it('should handle table head ref assignment', () => {
        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle custom ref prop', () => {
        const customRef = { current: null };
        mockTable.options.mantineTableHeadProps = {
            ref: customRef,
        };

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle function-based ref prop', () => {
        const customRef = { current: null };
        mockTable.options.mantineTableHeadProps = vi.fn(() => ({
            ref: customRef,
        }));

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing getHeaderGroups method', () => {
        delete mockTable.getHeaderGroups;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getHeaderGroups returning undefined', () => {
        mockTable.getHeaderGroups = vi.fn(() => undefined);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getHeaderGroups returning null', () => {
        mockTable.getHeaderGroups = vi.fn(() => null);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing getSelectedRowModel method', () => {
        delete mockTable.getSelectedRowModel;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getSelectedRowModel returning undefined', () => {
        mockTable.getSelectedRowModel = vi.fn(() => undefined);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getSelectedRowModel returning null', () => {
        mockTable.getSelectedRowModel = vi.fn(() => null);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing getVisibleLeafColumns method', () => {
        delete mockTable.getVisibleLeafColumns;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getVisibleLeafColumns returning undefined', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => undefined);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getVisibleLeafColumns returning null', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => null);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing refs', () => {
        delete mockTable.refs;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined refs', () => {
        mockTable.refs = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle null refs', () => {
        mockTable.refs = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing tableHeadRef', () => {
        delete mockTable.refs.tableHeadRef;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined tableHeadRef', () => {
        mockTable.refs.tableHeadRef = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle null tableHeadRef', () => {
        mockTable.refs.tableHeadRef = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing options', () => {
        delete mockTable.options;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle undefined options', () => {
        mockTable.options = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle null options', () => {
        mockTable.options = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle missing getState method', () => {
        delete mockTable.getState;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getState returning undefined', () => {
        mockTable.getState = vi.fn(() => undefined);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle getState returning null', () => {
        mockTable.getState = vi.fn(() => null);

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle multiple header groups', () => {
        mockHeaderGroups.push({
            id: 'header-group-3',
            headers: [
                { id: 'status', column: { id: 'status', columnDef: { header: 'Status' } } },
            ],
        });

        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.getByTestId('head-row-header-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('head-row-header-group-2')).toBeInTheDocument();
        expect(screen.getByTestId('head-row-header-group-3')).toBeInTheDocument();
    });

    it('should handle header groups with empty headers', () => {
        mockHeaderGroups[0].headers = [];

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle header groups with undefined headers', () => {
        mockHeaderGroups[0].headers = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle header groups with null headers', () => {
        mockHeaderGroups[0].headers = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle different header group IDs', () => {
        mockHeaderGroups[0].id = 'custom-header-group';

        render(
            <TableHead
                table={mockTable}
            />
        );

        expect(screen.getByTestId('head-row-custom-header-group')).toBeInTheDocument();
    });

    it('should handle undefined header group ID', () => {
        mockHeaderGroups[0].id = undefined;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle null header group ID', () => {
        mockHeaderGroups[0].id = null;

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });

    it('should handle empty header group ID', () => {
        mockHeaderGroups[0].id = '';

        render(
            <TableHead
                table={mockTable}
            />
        );

        const tableHead = screen.getByRole('rowgroup');
        expect(tableHead).toBeInTheDocument();
    });
}); 