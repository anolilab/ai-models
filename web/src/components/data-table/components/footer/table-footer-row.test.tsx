import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableFooterRow } from './table-footer-row';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('./table-footer-cell', () => ({
    TableFooterCell: ({ footer, renderedColumnIndex }: { footer: any; renderedColumnIndex: number }) => (
        <td data-testid={`footer-cell-${footer.id}`} data-index={renderedColumnIndex}>
            Footer Cell {footer.id}
        </td>
    ),
}));

/**
 * Test for TableFooterRow component focusing on footer row rendering and cell management
 */
describe('TableFooterRow - Footer Row Rendering and Cell Management', () => {
    let mockTable: any;
    let mockFooterGroup: any;
    let mockHeaders: any[];

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.options = {
            ...mockTable.options,
            layoutMode: 'semantic',
            mantineTableFooterRowProps: {},
        };

        // Create mock headers
        mockHeaders = [
            {
                id: 'header-1',
                column: {
                    columnDef: {
                        footer: 'Footer 1',
                    },
                },
            },
            {
                id: 'header-2',
                column: {
                    columnDef: {
                        footer: 'Footer 2',
                    },
                },
            },
            {
                id: 'header-3',
                column: {
                    columnDef: {
                        footer: '',
                    },
                },
            },
        ];

        // Create mock footer group
        mockFooterGroup = {
            id: 'footer-group-1',
            headers: mockHeaders,
        };
    });

    it('should render basic footer row with cells', () => {
        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
        expect(screen.getByText('Footer Cell header-1')).toBeInTheDocument();
        expect(screen.getByText('Footer Cell header-2')).toBeInTheDocument();
        expect(screen.getByText('Footer Cell header-3')).toBeInTheDocument();
    });

    it('should not render footer row when no headers have content', () => {
        mockHeaders.forEach(header => {
            header.column.columnDef.footer = '';
            header.column.columnDef.Footer = undefined;
        });

        const { container } = render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should render footer row when at least one header has string footer', () => {
        mockHeaders[0].column.columnDef.footer = '';
        mockHeaders[1].column.columnDef.footer = 'Valid Footer';
        mockHeaders[2].column.columnDef.footer = '';

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should render footer row when at least one header has Footer component', () => {
        const FooterComponent = () => <div>Footer Component</div>;
        mockHeaders[0].column.columnDef.footer = '';
        mockHeaders[1].column.columnDef.Footer = FooterComponent;
        mockHeaders[2].column.columnDef.footer = '';

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should render footer row when at least one header has Footer function', () => {
        const footerFunction = vi.fn(() => 'Footer Function');
        mockHeaders[0].column.columnDef.footer = '';
        mockHeaders[1].column.columnDef.Footer = footerFunction;
        mockHeaders[2].column.columnDef.footer = '';

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('flex');
    });

    it('should apply grid-no-grow layout styles', () => {
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('flex');
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-footer-row';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                className={customClassName}
                style={customStyle}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass(customClassName);
        expect(row).toHaveStyle('background-color: rgb(255, 0, 0)');
    });

    it('should handle custom table footer row props', () => {
        const customProps = {
            className: 'custom-props-class',
            style: { color: 'blue' },
        };
        mockTable.options.mantineTableFooterRowProps = customProps;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('custom-props-class');
        expect(row).toHaveStyle('color: rgb(0, 0, 255)');
    });

    it('should handle function-based table footer row props', () => {
        const functionProps = vi.fn(() => ({
            className: 'function-props-class',
            style: { fontSize: '16px' },
        }));
        mockTable.options.mantineTableFooterRowProps = functionProps;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toHaveClass('function-props-class');
        expect(row).toHaveStyle('font-size: 16px');
        expect(functionProps).toHaveBeenCalledWith({
            footerGroup: mockFooterGroup,
            table: mockTable,
        });
    });

    it('should handle column virtualization with virtual columns', () => {
        const columnVirtualizer = {
            virtualColumns: [
                { index: 0, start: 0, size: 100 },
                { index: 2, start: 200, size: 100 },
            ],
            virtualPaddingLeft: 50,
            virtualPaddingRight: 50,
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should render virtual padding elements
        const paddingElements = screen.getAllByRole('columnheader');
        expect(paddingElements).toHaveLength(2);

        // Should render footer cells for virtual columns
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
        expect(screen.queryByTestId('footer-cell-header-2')).not.toBeInTheDocument();
    });

    it('should handle column virtualization without virtual columns', () => {
        const columnVirtualizer = {
            virtualPaddingLeft: 50,
            virtualPaddingRight: 50,
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should render virtual padding elements
        const paddingElements = screen.getAllByRole('columnheader');
        expect(paddingElements).toHaveLength(2);

        // Should render all footer cells
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle column virtualization with only left padding', () => {
        const columnVirtualizer = {
            virtualPaddingLeft: 50,
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should render only left padding element
        const paddingElements = screen.getAllByRole('columnheader');
        expect(paddingElements).toHaveLength(1);

        // Should render all footer cells
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle column virtualization with only right padding', () => {
        const columnVirtualizer = {
            virtualPaddingRight: 50,
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should render only right padding element
        const paddingElements = screen.getAllByRole('columnheader');
        expect(paddingElements).toHaveLength(1);

        // Should render all footer cells
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle column virtualization with zero padding', () => {
        const columnVirtualizer = {
            virtualPaddingLeft: 0,
            virtualPaddingRight: 0,
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should not render padding elements
        const paddingElements = screen.queryAllByRole('columnheader');
        expect(paddingElements).toHaveLength(0);

        // Should render all footer cells
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle empty headers array', () => {
        mockFooterGroup.headers = [];

        const { container } = render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should handle undefined headers', () => {
        mockFooterGroup.headers = undefined;

        const { container } = render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should handle null headers', () => {
        mockFooterGroup.headers = null;

        const { container } = render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should handle headers with undefined columnDef', () => {
        mockHeaders[0].column = undefined;

        const { container } = render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should handle headers with undefined footer and Footer', () => {
        mockHeaders[0].column.columnDef.footer = undefined;
        mockHeaders[0].column.columnDef.Footer = undefined;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle headers with null footer and Footer', () => {
        mockHeaders[0].column.columnDef.footer = null;
        mockHeaders[0].column.columnDef.Footer = null;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle undefined layoutMode', () => {
        mockTable.options.layoutMode = undefined;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).not.toHaveClass('flex');
    });

    it('should handle undefined mantineTableFooterRowProps', () => {
        mockTable.options.mantineTableFooterRowProps = undefined;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toBeInTheDocument();
    });

    it('should handle null mantineTableFooterRowProps', () => {
        mockTable.options.mantineTableFooterRowProps = null;

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
            />
        );

        const row = screen.getByRole('row');
        expect(row).toBeInTheDocument();
    });

    it('should handle undefined columnVirtualizer', () => {
        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={undefined}
            />
        );

        // Should render all footer cells without padding
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();

        const paddingElements = screen.queryAllByRole('columnheader');
        expect(paddingElements).toHaveLength(0);
    });

    it('should handle null columnVirtualizer', () => {
        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={null}
            />
        );

        // Should render all footer cells without padding
        expect(screen.getByTestId('footer-cell-header-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();

        const paddingElements = screen.queryAllByRole('columnheader');
        expect(paddingElements).toHaveLength(0);
    });

    it('should handle virtual columns with missing index', () => {
        const columnVirtualizer = {
            virtualColumns: [
                { start: 0, size: 100 },
                { index: 2, start: 200, size: 100 },
            ],
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should render footer cells for valid virtual columns
        expect(screen.getByTestId('footer-cell-header-3')).toBeInTheDocument();
    });

    it('should handle virtual columns with invalid index', () => {
        const columnVirtualizer = {
            virtualColumns: [
                { index: 999, start: 0, size: 100 },
            ],
        };

        render(
            <TableFooterRow
                footerGroup={mockFooterGroup}
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        // Should handle gracefully without crashing
        expect(screen.getByRole('row')).toBeInTheDocument();
    });
}); 