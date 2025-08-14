import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import TableBodyEmptyRow from './table-body-empty-row';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

/**
 * Test for TableBodyEmptyRow component focusing on empty state rendering
 */
describe('TableBodyEmptyRow - Empty State Rendering', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [],
            globalFilter: '',
        });
        mockTable.options = {
            ...mockTable.options,
            layoutMode: 'semantic',
            localization: {
                noResultsFound: 'No results found',
                noRecordsToDisplay: 'No records to display',
            },
            renderDetailPanel: false,
            renderEmptyRowsFallback: undefined,
        };
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'col-1' },
            { id: 'col-2' },
            { id: 'col-3' },
        ]);
        mockTable.refs = {
            tablePaperRef: { current: { clientWidth: 800 } },
        };
    });

    it('should render basic empty row', () => {
        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByRole('row')).toBeInTheDocument();
        expect(screen.getByText('No records to display')).toBeInTheDocument();
    });

    it('should render no results found when filters are active', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [{ id: 'name', value: 'test' }],
            globalFilter: '',
        });

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render no results found when global filter is active', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [],
            globalFilter: 'search term',
        });

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render no results found when both filters are active', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [{ id: 'name', value: 'test' }],
            globalFilter: 'search term',
        });

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render custom empty rows fallback', () => {
        const customFallback = vi.fn(() => <div data-testid="custom-fallback">Custom Empty State</div>);
        mockTable.options.renderEmptyRowsFallback = customFallback;

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.getByText('Custom Empty State')).toBeInTheDocument();
        expect(customFallback).toHaveBeenCalledWith({ table: mockTable });
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-empty-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableBodyEmptyRow
                table={mockTable}
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
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveStyle({ display: 'grid' });
    });

    it('should handle detail panel column', () => {
        mockTable.options.renderDetailPanel = true;

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        expect(cells).toHaveLength(2); // detail panel cell + main cell
    });

    it('should handle detail panel with grid layout', () => {
        mockTable.options.renderDetailPanel = true;
        mockTable.options.layoutMode = 'grid';

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        cells.forEach(cell => {
            expect(cell).toHaveStyle({ display: 'grid' });
        });
    });

    it('should calculate correct colspan for main cell', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'col-1' },
            { id: 'col-2' },
            { id: 'col-3' },
            { id: 'col-4' },
        ]);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        const mainCell = cells[cells.length - 1]; // Last cell is the main one
        expect(mainCell).toHaveAttribute('colspan', '4');
    });

    it('should handle table paper ref for width calculation', () => {
        mockTable.refs.tablePaperRef.current = { clientWidth: 1200 };

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const message = screen.getByText('No records to display');
        expect(message).toHaveStyle({ maxWidth: 'min(100vw, 1200px)' });
    });

    it('should handle table paper ref fallback width', () => {
        mockTable.refs.tablePaperRef.current = null;

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const message = screen.getByText('No records to display');
        expect(message).toHaveStyle({ maxWidth: 'min(100vw, 360px)' });
    });

    it('should handle custom localization messages', () => {
        mockTable.options.localization = {
            noResultsFound: 'Custom no results message',
            noRecordsToDisplay: 'Custom no records message',
        };

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByText('Custom no records message')).toBeInTheDocument();
    });

    it('should handle filters with custom localization', () => {
        mockTable.options.localization = {
            noResultsFound: 'Custom no results message',
            noRecordsToDisplay: 'Custom no records message',
        };
        mockTable.getState = vi.fn().mockReturnValue({
            columnFilters: [{ id: 'name', value: 'test' }],
            globalFilter: '',
        });

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        expect(screen.getByText('Custom no results message')).toBeInTheDocument();
    });

    it('should handle different layout modes', () => {
        const layoutModes = ['semantic', 'grid', 'grid-no-grow'];

        layoutModes.forEach((layoutMode) => {
            mockTable.options.layoutMode = layoutMode;

            render(
                <TableBodyEmptyRow
                    table={mockTable}
                />
            );

            expect(screen.getByRole('row')).toBeInTheDocument();
        });
    });

    it('should handle empty column list', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => []);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        const mainCell = cells[cells.length - 1];
        expect(mainCell).toHaveAttribute('colspan', '0');
    });

    it('should handle single column', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => [{ id: 'col-1' }]);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        const mainCell = cells[cells.length - 1];
        expect(mainCell).toHaveAttribute('colspan', '1');
    });

    it('should handle multiple columns', () => {
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'col-1' },
            { id: 'col-2' },
            { id: 'col-3' },
            { id: 'col-4' },
            { id: 'col-5' },
        ]);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        const mainCell = cells[cells.length - 1];
        expect(mainCell).toHaveAttribute('colspan', '5');
    });

    it('should handle detail panel with single column', () => {
        mockTable.options.renderDetailPanel = true;
        mockTable.getVisibleLeafColumns = vi.fn(() => [{ id: 'col-1' }]);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        expect(cells).toHaveLength(2); // detail panel + main cell
        const mainCell = cells[1];
        expect(mainCell).toHaveAttribute('colspan', '1');
    });

    it('should handle detail panel with multiple columns', () => {
        mockTable.options.renderDetailPanel = true;
        mockTable.getVisibleLeafColumns = vi.fn(() => [
            { id: 'col-1' },
            { id: 'col-2' },
            { id: 'col-3' },
        ]);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const cells = screen.getAllByRole('cell');
        expect(cells).toHaveLength(2); // detail panel + main cell
        const mainCell = cells[1];
        expect(mainCell).toHaveAttribute('colspan', '3');
    });

    it('should apply proper styling to empty message', () => {
        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const message = screen.getByText('No records to display');
        expect(message).toHaveClass('text-muted-foreground w-full py-8 text-center italic');
    });

    it('should handle custom table body row props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineTableBodyRowProps = vi.fn(() => customProps);

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('custom-props-class');
    });

    it('should handle different table paper widths', () => {
        const testWidths = [360, 800, 1200, 1920];

        testWidths.forEach((width) => {
            mockTable.refs.tablePaperRef.current = { clientWidth: width };

            render(
                <TableBodyEmptyRow
                    table={mockTable}
                />
            );

            const message = screen.getByText('No records to display');
            expect(message).toHaveStyle({ maxWidth: `min(100vw, ${width}px)` });
        });
    });

    it('should handle table paper ref with zero width', () => {
        mockTable.refs.tablePaperRef.current = { clientWidth: 0 };

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const message = screen.getByText('No records to display');
        expect(message).toHaveStyle({ maxWidth: 'min(100vw, 0px)' });
    });

    it('should handle table paper ref with negative width', () => {
        mockTable.refs.tablePaperRef.current = { clientWidth: -100 };

        render(
            <TableBodyEmptyRow
                table={mockTable}
            />
        );

        const message = screen.getByText('No records to display');
        expect(message).toHaveStyle({ maxWidth: 'min(100vw, -100px)' });
    });
}); 