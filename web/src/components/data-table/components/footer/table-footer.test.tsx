import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableFooter } from './table-footer';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('./table-footer-row', () => ({
    TableFooterRow: ({ footerGroup, columnVirtualizer }: { footerGroup: any; columnVirtualizer?: any }) => (
        <tr data-testid={`footer-row-${footerGroup.id}`}>
            <td>Footer Row {footerGroup.id}</td>
            {columnVirtualizer && <td data-testid="virtualizer-present">Virtualizer</td>}
        </tr>
    ),
}));

/**
 * Test for TableFooter component focusing on footer rendering and sticky behavior
 */
describe('TableFooter - Footer Rendering and Sticky Behavior', () => {
    let mockTable: any;
    let mockFooterGroups: any[];

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: false,
        });
        mockTable.options = {
            ...mockTable.options,
            enableStickyFooter: false,
            layoutMode: 'semantic',
            mantineTableFooterProps: {},
        };
        mockTable.refs = {
            tableFooterRef: { current: null },
        };

        // Create mock footer groups
        mockFooterGroups = [
            {
                id: 'footer-group-1',
                headers: [
                    {
                        id: 'header-1',
                        column: {
                            columnDef: {
                                footer: 'Footer 1',
                            },
                        },
                    },
                ],
            },
            {
                id: 'footer-group-2',
                headers: [
                    {
                        id: 'header-2',
                        column: {
                            columnDef: {
                                footer: 'Footer 2',
                            },
                        },
                    },
                ],
            },
        ];

        mockTable.getFooterGroups = vi.fn(() => mockFooterGroups);
    });

    it('should render basic footer with footer groups', () => {
        render(
            <TableFooter
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-row-footer-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-row-footer-group-2')).toBeInTheDocument();
        expect(screen.getByText('Footer Row footer-group-1')).toBeInTheDocument();
        expect(screen.getByText('Footer Row footer-group-2')).toBeInTheDocument();
    });

    it('should apply sticky footer styles when enableStickyFooter is true', () => {
        mockTable.options.enableStickyFooter = true;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should apply sticky footer styles when isFullScreen is true', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should not apply sticky footer styles when enableStickyFooter is false', () => {
        mockTable.options.enableStickyFooter = false;
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: false,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).not.toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should not apply sticky footer styles when enableStickyFooter is explicitly false', () => {
        mockTable.options.enableStickyFooter = false;
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).not.toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should apply grid layout styles', () => {
        mockTable.options.layoutMode = 'grid';

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass('grid');
    });

    it('should apply grid-no-grow layout styles', () => {
        mockTable.options.layoutMode = 'grid-no-grow';

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass('grid');
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-footer';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableFooter
                table={mockTable}
                className={customClassName}
                style={customStyle}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass(customClassName);
        expect(footer).toHaveStyle('background-color: rgb(255, 0, 0)');
    });

    it('should handle custom table footer props', () => {
        const customProps = {
            className: 'custom-props-class',
            style: { color: 'blue' },
        };
        mockTable.options.mantineTableFooterProps = customProps;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveStyle('color: rgb(0, 0, 255)');
    });

    it('should handle function-based table footer props', () => {
        const functionProps = vi.fn(() => ({
            className: 'function-props-class',
            style: { fontSize: '16px' },
        }));
        mockTable.options.mantineTableFooterProps = functionProps;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveStyle('font-size: 16px');
        expect(functionProps).toHaveBeenCalledWith({
            table: mockTable,
        });
    });

    it('should handle column virtualizer', () => {
        const columnVirtualizer = {
            virtualColumns: [],
            virtualPaddingLeft: 50,
            virtualPaddingRight: 50,
        };

        render(
            <TableFooter
                table={mockTable}
                columnVirtualizer={columnVirtualizer}
            />
        );

        expect(screen.getAllByTestId('virtualizer-present')).toHaveLength(2);
    });

    it('should handle undefined column virtualizer', () => {
        render(
            <TableFooter
                table={mockTable}
                columnVirtualizer={undefined}
            />
        );

        expect(screen.queryByTestId('virtualizer-present')).not.toBeInTheDocument();
    });

    it('should handle null column virtualizer', () => {
        render(
            <TableFooter
                table={mockTable}
                columnVirtualizer={null}
            />
        );

        expect(screen.queryByTestId('virtualizer-present')).not.toBeInTheDocument();
    });

    it('should handle empty footer groups', () => {
        mockTable.getFooterGroups = vi.fn(() => []);

        render(
            <TableFooter
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('footer-row-footer-group-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('footer-row-footer-group-2')).not.toBeInTheDocument();
    });

    it('should handle undefined footer groups', () => {
        mockTable.getFooterGroups = vi.fn(() => undefined);

        expect(() => {
            render(
                <TableFooter
                    table={mockTable}
                />
            );
        }).toThrow();
    });

    it('should handle null footer groups', () => {
        mockTable.getFooterGroups = vi.fn(() => null);

        expect(() => {
            render(
                <TableFooter
                    table={mockTable}
                />
            );
        }).toThrow();
    });

    it('should handle undefined layoutMode', () => {
        mockTable.options.layoutMode = undefined;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).not.toHaveClass('grid');
    });

    it('should handle undefined mantineTableFooterProps', () => {
        mockTable.options.mantineTableFooterProps = undefined;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toBeInTheDocument();
    });

    it('should handle null mantineTableFooterProps', () => {
        mockTable.options.mantineTableFooterProps = null;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toBeInTheDocument();
    });

    it('should handle undefined enableStickyFooter', () => {
        mockTable.options.enableStickyFooter = undefined;
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should handle null enableStickyFooter', () => {
        mockTable.options.enableStickyFooter = null;
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: true,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should handle table footer ref assignment', () => {
        const mockRef = { current: null };
        mockTable.refs.tableFooterRef = mockRef;

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(mockRef.current).toBe(footer);
    });

    it('should handle table footer ref with custom ref prop', () => {
        const mockRef = { current: null };
        const customRef = { current: null };
        mockTable.refs.tableFooterRef = mockRef;
        mockTable.options.mantineTableFooterProps = {
            ref: customRef,
        };

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(mockRef.current).toBe(footer);
        expect(customRef.current).toBe(footer);
    });

    it('should handle table footer ref with function-based ref prop', () => {
        const mockRef = { current: null };
        const customRef = { current: null };
        const refFunction = vi.fn((ref) => {
            customRef.current = ref;
        });
        mockTable.refs.tableFooterRef = mockRef;
        mockTable.options.mantineTableFooterProps = {
            ref: refFunction,
        };

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(mockRef.current).toBe(footer);
        expect(customRef.current).toBe(footer);
        expect(refFunction).toHaveBeenCalledWith(footer);
    });

    it('should handle undefined tableFooterRef', () => {
        mockTable.refs.tableFooterRef = undefined;

        expect(() => {
            render(
                <TableFooter
                    table={mockTable}
                />
            );
        }).toThrow();
    });

    it('should handle null tableFooterRef', () => {
        mockTable.refs.tableFooterRef = null;

        expect(() => {
            render(
                <TableFooter
                    table={mockTable}
                />
            );
        }).toThrow();
    });

    it('should handle undefined isFullScreen', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: undefined,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).not.toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should handle null isFullScreen', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            isFullScreen: null,
        });

        render(
            <TableFooter
                table={mockTable}
            />
        );

        const footer = screen.getByRole('rowgroup');
        expect(footer).not.toHaveClass('sticky', 'bottom-0', 'z-10', 'opacity-97');
    });

    it('should handle multiple footer groups', () => {
        const multipleGroups = [
            { id: 'group-1', headers: [{ id: 'h1', column: { columnDef: { footer: 'F1' } } }] },
            { id: 'group-2', headers: [{ id: 'h2', column: { columnDef: { footer: 'F2' } } }] },
            { id: 'group-3', headers: [{ id: 'h3', column: { columnDef: { footer: 'F3' } } }] },
        ];
        mockTable.getFooterGroups = vi.fn(() => multipleGroups);

        render(
            <TableFooter
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-row-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-row-group-2')).toBeInTheDocument();
        expect(screen.getByTestId('footer-row-group-3')).toBeInTheDocument();
    });

    it('should handle footer groups with empty headers', () => {
        const groupsWithEmptyHeaders = [
            { id: 'group-1', headers: [] },
            { id: 'group-2', headers: [{ id: 'h2', column: { columnDef: { footer: 'F2' } } }] },
        ];
        mockTable.getFooterGroups = vi.fn(() => groupsWithEmptyHeaders);

        render(
            <TableFooter
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-row-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-row-group-2')).toBeInTheDocument();
    });

    it('should handle footer groups with undefined headers', () => {
        const groupsWithUndefinedHeaders = [
            { id: 'group-1', headers: undefined },
            { id: 'group-2', headers: [{ id: 'h2', column: { columnDef: { footer: 'F2' } } }] },
        ];
        mockTable.getFooterGroups = vi.fn(() => groupsWithUndefinedHeaders);

        render(
            <TableFooter
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-row-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-row-group-2')).toBeInTheDocument();
    });

    it('should handle footer groups with null headers', () => {
        const groupsWithNullHeaders = [
            { id: 'group-1', headers: null },
            { id: 'group-2', headers: [{ id: 'h2', column: { columnDef: { footer: 'F2' } } }] },
        ];
        mockTable.getFooterGroups = vi.fn(() => groupsWithNullHeaders);

        render(
            <TableFooter
                table={mockTable}
            />
        );

        expect(screen.getByTestId('footer-row-group-1')).toBeInTheDocument();
        expect(screen.getByTestId('footer-row-group-2')).toBeInTheDocument();
    });
}); 