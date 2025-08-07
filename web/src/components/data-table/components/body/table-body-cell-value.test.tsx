import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import TableBodyCellValue from './table-body-cell-value';
import { createTestTableInstance } from '../../test-utils';

/**
 * Test for TableBodyCellValue component focusing on cell value rendering and highlighting
 */
describe('TableBodyCellValue - Cell Value Rendering', () => {
    let mockTable: any;
    let mockCell: any;
    let mockRow: any;
    let mockColumn: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            globalFilter: '',
            globalFilterFn: 'fuzzy',
        });
        mockTable.options = {
            ...mockTable.options,
            enableFilterMatchHighlighting: true,
            mantineHighlightProps: { size: 'sm' },
        };

        // Create mock column
        mockColumn = {
            id: 'name',
            getFilterValue: vi.fn(() => null),
            getCanGlobalFilter: vi.fn(() => true),
            columnDef: {
                enableFilterMatchHighlighting: true,
                filterVariant: 'text',
                Cell: undefined,
                AggregatedCell: undefined,
                GroupedCell: undefined,
            },
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
            getIsGrouped: vi.fn(() => false),
            subRows: [],
        };

        // Create mock cell
        mockCell = {
            id: 'cell-1',
            getValue: vi.fn(() => 'Test Value'),
            renderValue: vi.fn(() => 'Test Value'),
            getIsAggregated: vi.fn(() => false),
            getIsGrouped: vi.fn(() => false),
            column: mockColumn,
            row: mockRow,
        };
    });

    it('should render basic cell value', () => {
        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('should render null value as empty string', () => {
        mockCell.renderValue = vi.fn(() => null);

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should render undefined value as empty string', () => {
        mockCell.renderValue = vi.fn(() => undefined);

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should render Date value as localized string', () => {
        const testDate = new Date('2023-01-01T12:00:00Z');
        mockCell.renderValue = vi.fn(() => testDate);

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText(testDate.toLocaleString())).toBeInTheDocument();
    });

    it('should render object value as JSON string', () => {
        const testObject = { name: 'John', age: 30 };
        mockCell.renderValue = vi.fn(() => testObject);

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText(JSON.stringify(testObject))).toBeInTheDocument();
    });

    it('should render aggregated cell value', () => {
        mockCell.getIsAggregated = vi.fn(() => true);
        mockColumn.columnDef.AggregatedCell = vi.fn(() => 'Aggregated Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText('Aggregated Value')).toBeInTheDocument();
        expect(mockColumn.columnDef.AggregatedCell).toHaveBeenCalledWith({
            cell: mockCell,
            column: mockColumn,
            row: mockRow,
            table: mockTable,
        });
    });

    it('should render grouped cell value', () => {
        mockCell.getIsGrouped = vi.fn(() => true);
        mockRow.getIsGrouped = vi.fn(() => true);
        mockColumn.columnDef.GroupedCell = vi.fn(() => 'Grouped Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByText('Grouped Value')).toBeInTheDocument();
        expect(mockColumn.columnDef.GroupedCell).toHaveBeenCalledWith({
            cell: mockCell,
            column: mockColumn,
            row: mockRow,
            table: mockTable,
        });
    });

    it('should render custom cell component', () => {
        const CustomCell = ({ renderedCellValue }: { renderedCellValue: any }) => (
            <div data-testid="custom-cell">Custom: {renderedCellValue}</div>
        );
        mockColumn.columnDef.Cell = vi.fn(({ renderedCellValue }) => <CustomCell renderedCellValue={renderedCellValue} />);

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('custom-cell')).toBeInTheDocument();
        expect(screen.getByText('Custom: Test Value')).toBeInTheDocument();
        expect(mockColumn.columnDef.Cell).toHaveBeenCalledWith({
            cell: mockCell,
            column: mockColumn,
            renderedCellValue: 'Test Value',
            renderedColumnIndex: 0,
            renderedRowIndex: 0,
            row: mockRow,
            table: mockTable,
        });
    });

    it('should highlight text with filter value', () => {
        mockColumn.getFilterValue = vi.fn(() => 'Test');
        mockCell.renderValue = vi.fn(() => 'Test Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const highlightedElement = screen.getByText('Test Value');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement.innerHTML).toContain('<mark>Test</mark>');
    });

    it('should highlight text with global filter', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            globalFilter: 'Value',
            globalFilterFn: 'fuzzy',
        });
        mockCell.renderValue = vi.fn(() => 'Test Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const highlightedElement = screen.getByText('Test Value');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement.innerHTML).toContain('<mark>Value</mark>');
    });

    it('should highlight multiple words with fuzzy filter', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            globalFilter: 'Test Value',
            globalFilterFn: 'fuzzy',
        });
        mockCell.renderValue = vi.fn(() => 'Test Value Example');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const highlightedElement = screen.getByText('Test Value Example');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement.innerHTML).toContain('<mark>Test</mark>');
        expect(highlightedElement.innerHTML).toContain('<mark>Value</mark>');
    });

    it('should not highlight when highlighting is disabled', () => {
        mockTable.options.enableFilterMatchHighlighting = false;
        mockColumn.getFilterValue = vi.fn(() => 'Test');
        mockCell.renderValue = vi.fn(() => 'Test Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const element = screen.getByText('Test Value');
        expect(element).toBeInTheDocument();
        expect(element.innerHTML).not.toContain('<mark>');
    });

    it('should not highlight when column highlighting is disabled', () => {
        mockColumn.columnDef.enableFilterMatchHighlighting = false;
        mockColumn.getFilterValue = vi.fn(() => 'Test');
        mockCell.renderValue = vi.fn(() => 'Test Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const element = screen.getByText('Test Value');
        expect(element).toBeInTheDocument();
        expect(element.innerHTML).not.toContain('<mark>');
    });

    it('should not highlight non-string/number values', () => {
        mockColumn.getFilterValue = vi.fn(() => 'Test');
        mockCell.renderValue = vi.fn(() => true); // boolean value

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const element = screen.getByText('true');
        expect(element).toBeInTheDocument();
        expect(element.innerHTML).not.toContain('<mark>');
    });

    it('should handle React elements in cell value', () => {
        const ReactElement = <div data-testid="react-element">React Element</div>;
        mockCell.renderValue = vi.fn(() => ReactElement);

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        expect(screen.getByTestId('react-element')).toBeInTheDocument();
        expect(screen.getByText('React Element')).toBeInTheDocument();
    });

    it('should handle empty filter value', () => {
        mockColumn.getFilterValue = vi.fn(() => '');
        mockCell.renderValue = vi.fn(() => 'Test Value');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const element = screen.getByText('Test Value');
        expect(element).toBeInTheDocument();
        expect(element.innerHTML).not.toContain('<mark>');
    });

    it('should handle case-insensitive highlighting', () => {
        mockColumn.getFilterValue = vi.fn(() => 'test');
        mockCell.renderValue = vi.fn(() => 'TEST VALUE');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const highlightedElement = screen.getByText('TEST VALUE');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement.innerHTML).toContain('<mark>TEST</mark>');
    });

    it('should handle special characters in filter value', () => {
        mockColumn.getFilterValue = vi.fn(() => 'test*value');
        mockCell.renderValue = vi.fn(() => 'test*value example');

        render(
            <TableBodyCellValue
                cell={mockCell}
                table={mockTable}
                renderedColumnIndex={0}
                renderedRowIndex={0}
            />
        );

        const highlightedElement = screen.getByText('test*value example');
        expect(highlightedElement).toBeInTheDocument();
        expect(highlightedElement.innerHTML).toContain('<mark>test*value</mark>');
    });
}); 