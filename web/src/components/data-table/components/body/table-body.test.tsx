import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableBody } from './table-body';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child components
vi.mock('./table-body-row', () => ({
    TableBodyRow: ({ row }: { row: any }) => <tr data-testid={`row-${row.id}`}>Row {row.id}</tr>,
    Memo_TableBodyRow: ({ row }: { row: any }) => <tr data-testid={`memo-row-${row.id}`}>Memo Row {row.id}</tr>,
}));

vi.mock('./table-body-empty-row', () => ({
    default: () => <tr data-testid="empty-row">No data available</tr>,
}));

// Mock hooks
vi.mock('../../hooks/use-row-virtualizer', () => ({
    useRowVirtualizer: vi.fn(() => null),
}));

vi.mock('../../hooks/use-rows', () => ({
    useRows: vi.fn(() => []),
}));

/**
 * Test for TableBody component focusing on body rendering and row management
 */
describe('TableBody - Body Rendering and Row Management', () => {
    let mockTable: any;
    let mockRows: any[];

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: false,
            rowPinning: { top: [], bottom: [] },
        });
        mockTable.options = {
            ...mockTable.options,
            enableStickyFooter: false,
            enableStickyHeader: false,
            layoutMode: 'semantic',
            mantineTableBodyProps: {},
            memoMode: 'rows',
            renderDetailPanel: undefined,
            rowPinningDisplayMode: 'top-and-bottom',
        };
        mockTable.getBottomRows = vi.fn(() => []);
        mockTable.getIsSomeRowsPinned = vi.fn(() => false);
        mockTable.getRowModel = vi.fn(() => ({ rows: [] }));
        mockTable.getTopRows = vi.fn(() => []);
        mockTable.getVisibleLeafColumns = vi.fn(() => [{ id: 'col-1' }, { id: 'col-2' }]);
        mockTable.getTotalSize = vi.fn(() => 200);
        mockTable.refs = {
            tableFooterRef: { current: null },
            tableHeadRef: { current: null },
            tablePaperRef: { current: { clientWidth: 800 } },
        };

        // Create mock rows
        mockRows = [
            { id: 'row-1', index: 0 },
            { id: 'row-2', index: 1 },
            { id: 'row-3', index: 2 },
        ];

        // Mock the hooks
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue(mockRows);
    });

    it('should render basic table body', () => {
        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByRole('rowgroup')).toBeInTheDocument();
    });

    it('should render empty row when no data', () => {
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue([]);

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByTestId('empty-row')).toBeInTheDocument();
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render rows when data is available', () => {
        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
        expect(screen.getByTestId('row-row-2')).toBeInTheDocument();
        expect(screen.getByTestId('row-row-3')).toBeInTheDocument();
    });

    it('should render memoized rows when memo mode is rows', () => {
        mockTable.options.memoMode = 'rows';

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByTestId('memo-row-row-1')).toBeInTheDocument();
        expect(screen.getByTestId('memo-row-row-2')).toBeInTheDocument();
        expect(screen.getByTestId('memo-row-row-3')).toBeInTheDocument();
    });

    it('should render top pinned rows', () => {
        const pinnedRows = [{ id: 'pinned-1', index: 0 }];
        mockTable.getTopRows = vi.fn(() => pinnedRows);
        mockTable.getIsSomeRowsPinned = vi.fn(() => true);

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByTestId('row-pinned-1')).toBeInTheDocument();
    });

    it('should render bottom pinned rows', () => {
        const pinnedRows = [{ id: 'pinned-1', index: 0 }];
        mockTable.getBottomRows = vi.fn(() => pinnedRows);
        mockTable.getIsSomeRowsPinned = vi.fn(() => true);

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByTestId('row-pinned-1')).toBeInTheDocument();
    });

    it('should not render pinned rows when using sticky mode', () => {
        mockTable.options.rowPinningDisplayMode = 'sticky';
        const pinnedRows = [{ id: 'pinned-1', index: 0 }];
        mockTable.getTopRows = vi.fn(() => pinnedRows);
        mockTable.getIsSomeRowsPinned = vi.fn(() => true);

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('row-pinned-1')).not.toBeInTheDocument();
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveClass('grid');
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-body-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableBody
                table={mockTable}
                className={customClassName}
                style={customStyle}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveClass(customClassName);
        expect(tbody).toHaveStyle('background-color: red');
    });

    it('should handle sticky header with fullscreen', () => {
        mockTable.options.enableStickyHeader = true;
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });
        mockTable.refs.tableHeadRef.current = { clientHeight: 50 };

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveStyle({ '--ano-table-head-height': '50px' });
    });

    it('should handle sticky footer', () => {
        mockTable.options.enableStickyFooter = true;
        mockTable.refs.tableFooterRef.current = { clientHeight: 30 };

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveStyle({ '--ano-table-footer-height': '30px' });
    });

    it('should handle row virtualization', () => {
        const { useRowVirtualizer } = require('../../hooks/use-row-virtualizer');
        const virtualRows = [
            { index: 0, start: 0, size: 50 },
            { index: 1, start: 50, size: 50 },
        ];
        useRowVirtualizer.mockReturnValue({
            virtualRows,
            measureElement: vi.fn(),
        });

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveClass('h-[var(--ano-table-body-height)]');
    });

    it('should handle custom table body props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineTableBodyProps = vi.fn(() => customProps);

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveClass('custom-props-class');
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
            <TableBody
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        expect(screen.getByRole('rowgroup')).toBeInTheDocument();
    });

    it('should handle custom children', () => {
        const customChildren = <tr data-testid="custom-child">Custom Child</tr>;

        render(
            <TableBody
                table={mockTable}
                children={customChildren}
            />
        );

        expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('should handle render empty rows fallback', () => {
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue([]);
        
        const customFallback = vi.fn(() => <tr data-testid="custom-fallback">Custom Fallback</tr>);
        mockTable.options.renderEmptyRowsFallback = customFallback;

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(customFallback).toHaveBeenCalledWith({ table: mockTable });
    });

    it('should handle pinned row IDs', () => {
        const pinnedRowIds = ['row-1', 'row-2'];
        mockTable.getRowModel = vi.fn(() => ({
            rows: [
                { id: 'row-1', getIsPinned: vi.fn(() => 'top') },
                { id: 'row-2', getIsPinned: vi.fn(() => 'bottom') },
            ],
        }));

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByRole('rowgroup')).toBeInTheDocument();
    });

    it('should handle virtualization with detail panel', () => {
        const { useRowVirtualizer } = require('../../hooks/use-row-virtualizer');
        const virtualRows = [
            { index: 0, start: 0, size: 50 },
            { index: 1, start: 50, size: 50 },
        ];
        useRowVirtualizer.mockReturnValue({
            virtualRows,
            measureElement: vi.fn(),
        });
        mockTable.options.renderDetailPanel = vi.fn(() => <div>Detail Content</div>);

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByRole('rowgroup')).toBeInTheDocument();
    });

    it('should handle empty rows fallback with filters', () => {
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue([]);
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [{ id: 'name', value: 'test' }],
            globalFilter: '',
        });

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle empty rows fallback with global filter', () => {
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue([]);
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [],
            globalFilter: 'search term',
        });

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle table paper ref for empty state width', () => {
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue([]);
        mockTable.refs.tablePaperRef.current = { clientWidth: 1200 };

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle table paper ref fallback width', () => {
        const { useRows } = require('../../hooks/use-rows');
        useRows.mockReturnValue([]);
        mockTable.refs.tablePaperRef.current = null;

        render(
            <TableBody
                table={mockTable}
            />
        );

        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle different layout modes', () => {
        const layoutModes = ['semantic', 'grid', 'grid-no-grow'];

        layoutModes.forEach((layoutMode) => {
            mockTable.options.layoutMode = layoutMode;

            render(
                <TableBody
                    table={mockTable}
                />
            );

            expect(screen.getByRole('rowgroup')).toBeInTheDocument();
        });
    });

    it('should handle row virtualization with different row counts', () => {
        const { useRowVirtualizer } = require('../../hooks/use-row-virtualizer');
        const { useRows } = require('../../hooks/use-rows');
        
        const testCases = [
            { rows: [], virtualRows: [] },
            { rows: [{ id: 'row-1' }], virtualRows: [{ index: 0, start: 0, size: 50 }] },
            { rows: [{ id: 'row-1' }, { id: 'row-2' }], virtualRows: [{ index: 0, start: 0, size: 50 }, { index: 1, start: 50, size: 50 }] },
        ];

        testCases.forEach(({ rows, virtualRows }) => {
            useRows.mockReturnValue(rows);
            useRowVirtualizer.mockReturnValue({
                virtualRows,
                measureElement: vi.fn(),
            });

            render(
                <TableBody
                    table={mockTable}
                />
            );

            expect(screen.getByRole('rowgroup')).toBeInTheDocument();
        });
    });

    it('should handle sticky pinned rows positioning', () => {
        mockTable.options.rowPinningDisplayMode = 'sticky';
        mockTable.options.enableStickyHeader = true;
        mockTable.options.enableStickyFooter = true;
        mockTable.refs.tableHeadRef.current = { clientHeight: 50 };
        mockTable.refs.tableFooterRef.current = { clientHeight: 30 };

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toBeInTheDocument();
    });

    it('should handle fullscreen mode with sticky elements', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });
        mockTable.options.enableStickyHeader = true;
        mockTable.refs.tableHeadRef.current = { clientHeight: 50 };

        render(
            <TableBody
                table={mockTable}
            />
        );

        const tbody = screen.getByRole('rowgroup');
        expect(tbody).toHaveStyle({ '--ano-table-head-height': '50px' });
    });
}); 