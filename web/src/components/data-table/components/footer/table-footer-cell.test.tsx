import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableFooterCell } from './table-footer-cell';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

/**
 * Test for TableFooterCell component focusing on footer cell rendering and styling
 */
describe('TableFooterCell - Footer Cell Rendering and Styling', () => {
    let mockTable: any;
    let mockFooter: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            ...mockTable.options,
            enableColumnPinning: true,
            layoutMode: 'semantic',
            mantineTableFooterCellProps: {},
        };

        // Create mock column
        mockColumn = {
            id: 'col-1',
            getIsPinned: vi.fn(() => false),
            getIsFirstColumn: vi.fn(() => false),
            getIsLastColumn: vi.fn(() => false),
            columnDef: {
                columnDefType: 'data',
                minSize: 100,
                grow: 1,
                footer: 'Footer Text',
                mantineTableFooterCellProps: {},
            },
        };

        // Create mock footer
        mockFooter = {
            id: 'footer-1',
            colSpan: 1,
            isPlaceholder: false,
            column: mockColumn,
        };
    });

    it('should render basic footer cell', () => {
        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.getByText('Footer Text')).toBeInTheDocument();
    });

    it('should render placeholder footer cell', () => {
        mockFooter.isPlaceholder = true;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.queryByText('Footer Text')).not.toBeInTheDocument();
    });

    it('should render footer cell with custom footer function', () => {
        const customFooter = vi.fn(() => 'Custom Footer');
        mockColumn.columnDef.Footer = customFooter;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.getByText('Custom Footer')).toBeInTheDocument();
        expect(customFooter).toHaveBeenCalledWith({
            column: mockColumn,
            footer: mockFooter,
            table: mockTable,
        });
    });

    it('should render footer cell with custom footer component', () => {
        const CustomFooterComponent = () => <div data-testid="custom-footer">Custom Component</div>;
        mockColumn.columnDef.Footer = CustomFooterComponent;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
        expect(screen.getByText('Custom Component')).toBeInTheDocument();
    });

    it('should apply pinned column styles when column is pinned left', () => {
        mockColumn.getIsPinned = vi.fn(() => 'left');
        mockColumn.getIsFirstColumn = vi.fn(() => true);

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-column-pinned', 'left');
        expect(cell).not.toHaveAttribute('data-first-right-pinned');
        expect(cell).toHaveAttribute('data-last-left-pinned', 'true');
    });

    it('should apply pinned column styles when column is pinned right', () => {
        mockColumn.getIsPinned = vi.fn(() => 'right');
        mockColumn.getIsLastColumn = vi.fn(() => true);

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-column-pinned', 'right');
        expect(cell).toHaveAttribute('data-first-right-pinned', 'true');
        expect(cell).not.toHaveAttribute('data-last-left-pinned');
    });

    it('should not apply pinned styles for group columns', () => {
        mockColumn.columnDef.columnDefType = 'group';
        mockColumn.getIsPinned = vi.fn(() => 'left');

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).not.toHaveAttribute('data-column-pinned');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('flex', 'justify-start');
    });

    it('should apply grid-no-grow layout styles', () => {
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('flex', 'justify-start');
    });

    it('should apply group column styles', () => {
        mockColumn.columnDef.columnDefType = 'group';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('justify-center', 'text-center');
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-footer-cell';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
                className={customClassName}
                style={customStyle}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass(customClassName);
        expect(cell).toHaveStyle('background-color: rgb(255, 0, 0)');
    });

    it('should handle custom table footer cell props', () => {
        const customProps = {
            className: 'custom-props-class',
            style: { color: 'blue' },
        };
        mockTable.options.mantineTableFooterCellProps = customProps;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('color: rgb(0, 0, 255)');
    });

    it('should handle column-specific table footer cell props', () => {
        const columnProps = {
            className: 'column-props-class',
            style: { fontWeight: 'bold' },
        };
        mockColumn.columnDef.mantineTableFooterCellProps = columnProps;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('font-weight: bold');
    });

    it('should handle function-based table footer cell props', () => {
        const functionProps = vi.fn(() => ({
            className: 'function-props-class',
            style: { fontSize: '16px' },
        }));
        mockTable.options.mantineTableFooterCellProps = functionProps;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('font-size: 16px');
        expect(functionProps).toHaveBeenCalledWith({
            column: mockColumn,
            table: mockTable,
        });
    });

    it('should handle function-based column footer cell props', () => {
        const columnFunctionProps = vi.fn(() => ({
            className: 'column-function-class',
            style: { textAlign: 'center' },
        }));
        mockColumn.columnDef.mantineTableFooterCellProps = columnFunctionProps;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('text-align: center');
        expect(columnFunctionProps).toHaveBeenCalledWith({
            column: mockColumn,
            table: mockTable,
        });
    });

    it('should handle custom children prop', () => {
        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
                children={<div data-testid="custom-children">Custom Children</div>}
            />
        );

        expect(screen.getByTestId('custom-children')).toBeInTheDocument();
        expect(screen.getByText('Custom Children')).toBeInTheDocument();
        expect(screen.queryByText('Footer Text')).not.toBeInTheDocument();
    });

    it('should handle different column grow values', () => {
        mockColumn.columnDef.grow = 0;
        mockTable.options.layoutMode = 'grid';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('flex: 0 0 auto');
    });

    it('should handle undefined column grow value', () => {
        mockColumn.columnDef.grow = undefined;
        mockTable.options.layoutMode = 'grid';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('flex: 0 0 auto');
    });

    it('should handle false column grow value', () => {
        mockColumn.columnDef.grow = false;
        mockTable.options.layoutMode = 'grid';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('flex: 0 0 auto');
    });

    it('should handle grid-no-grow layout with grow value', () => {
        mockColumn.columnDef.grow = 2;
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('flex: 2 0 auto');
    });

    it('should handle column pinning disabled', () => {
        mockTable.options.enableColumnPinning = false;
        mockColumn.getIsPinned = vi.fn(() => 'left');

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).not.toHaveAttribute('data-column-pinned');
    });

    it('should handle rendered column index', () => {
        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
                renderedColumnIndex={5}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('data-index', '5');
    });

    it('should handle undefined rendered column index', () => {
        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
                renderedColumnIndex={undefined}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).not.toHaveAttribute('data-index');
    });

    it('should handle empty footer text', () => {
        mockColumn.columnDef.footer = '';

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.queryByText('Footer Text')).not.toBeInTheDocument();
    });

    it('should handle null footer text', () => {
        mockColumn.columnDef.footer = null;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.queryByText('Footer Text')).not.toBeInTheDocument();
    });

    it('should handle undefined footer text', () => {
        mockColumn.columnDef.footer = undefined;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        expect(screen.queryByText('Footer Text')).not.toBeInTheDocument();
    });

    it('should handle undefined columnDefType', () => {
        mockColumn.columnDef.columnDefType = undefined;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).not.toHaveClass('justify-center', 'text-center');
    });

    it('should handle undefined minSize', () => {
        mockColumn.columnDef.minSize = undefined;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveStyle('min-width: max(calc(var(--header-footer_1-size) * 1px), 30px)');
    });

    it('should handle different colSpan values', () => {
        mockFooter.colSpan = 3;

        render(
            <TableFooterCell
                footer={mockFooter}
                table={mockTable}
            />
        );

        const cell = screen.getByRole('cell');
        expect(cell).toHaveAttribute('colspan', '3');
    });
}); 