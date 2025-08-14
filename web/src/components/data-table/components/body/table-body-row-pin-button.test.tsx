import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

import { TableBodyRowPinButton } from './table-body-row-pin-button';
import { createTestTableInstance } from '../../test-utils';
import type { RowData } from '../../types';

// Mock child component
vi.mock('../buttons/row-pin-button', () => ({
    RowPinButton: ({ pinningPosition }: { pinningPosition: string }) => (
        <button data-testid={`pin-button-${pinningPosition}`}>Pin {pinningPosition}</button>
    ),
}));

/**
 * Test for TableBodyRowPinButton component focusing on row pinning functionality
 */
describe('TableBodyRowPinButton - Row Pinning Functionality', () => {
    let mockTable: any;
    let mockRow: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = createTestTableInstance();
        mockTable.getState = vi.fn().mockReturnValue({
            density: 'md',
        });
        mockTable.options = {
            ...mockTable.options,
            enableRowPinning: true,
            rowPinningDisplayMode: 'top-and-bottom',
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
            getIsPinned: vi.fn(() => false),
        };
    });

    it('should render top pin button by default', () => {
        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
        expect(screen.getByText('Pin top')).toBeInTheDocument();
    });

    it('should render bottom pin button when display mode is bottom', () => {
        mockTable.options.rowPinningDisplayMode = 'bottom';

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-bottom')).toBeInTheDocument();
        expect(screen.getByText('Pin bottom')).toBeInTheDocument();
    });

    it('should render both top and bottom buttons when display mode is top-and-bottom and row is not pinned', () => {
        mockTable.options.rowPinningDisplayMode = 'top-and-bottom';
        mockRow.getIsPinned = vi.fn(() => false);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
        expect(screen.getByTestId('pin-button-bottom')).toBeInTheDocument();
        expect(screen.getByText('Pin top')).toBeInTheDocument();
        expect(screen.getByText('Pin bottom')).toBeInTheDocument();
    });

    it('should render single button when row is pinned', () => {
        mockTable.options.rowPinningDisplayMode = 'top-and-bottom';
        mockRow.getIsPinned = vi.fn(() => 'top');

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
        expect(screen.queryByTestId('pin-button-bottom')).not.toBeInTheDocument();
    });

    it('should render bottom button when row is pinned to bottom', () => {
        mockTable.options.rowPinningDisplayMode = 'top-and-bottom';
        mockRow.getIsPinned = vi.fn(() => 'bottom');

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-bottom')).toBeInTheDocument();
        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
    });

    it('should not render when row pinning is disabled', () => {
        mockTable.options.enableRowPinning = false;

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pin-button-bottom')).not.toBeInTheDocument();
    });

    it('should not render when row pinning is disabled for specific row', () => {
        mockTable.options.enableRowPinning = vi.fn(() => false);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pin-button-bottom')).not.toBeInTheDocument();
    });

    it('should apply custom className and style', () => {
        const customClassName = 'custom-pin-class';
        const customStyle = { backgroundColor: 'red' };

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
                className={customClassName}
                style={customStyle}
            />
        );

        const container = screen.getByTestId('pin-button-top').parentElement;
        expect(container).toHaveClass(customClassName);
        expect(container).toHaveStyle('background-color: red');
    });

    it('should apply row layout for xs density', () => {
        mockTable.getState = vi.fn().mockReturnValue({
            density: 'xs',
        });
        mockTable.options.rowPinningDisplayMode = 'top-and-bottom';

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        const container = screen.getByTestId('pin-button-top').parentElement;
        expect(container).toHaveStyle({ flexDirection: 'row' });
    });

    it('should apply column layout for other densities', () => {
        const densities = ['sm', 'md', 'lg', 'xl'];

        densities.forEach((density) => {
            mockTable.getState = vi.fn().mockReturnValue({
                density,
            });
            mockTable.options.rowPinningDisplayMode = 'top-and-bottom';

            render(
                <TableBodyRowPinButton
                    row={mockRow}
                    table={mockTable}
                />
            );

            const container = screen.getByTestId('pin-button-top').parentElement;
            expect(container).toHaveStyle({ flexDirection: 'column' });
        });
    });

    it('should handle custom table row pin button props', () => {
        const customProps = {
            onClick: vi.fn(),
            className: 'custom-props-class',
        };
        mockTable.options.mantineRowPinButtonProps = vi.fn(() => customProps);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
    });

    it('should pass correct props to RowPinButton', () => {
        const { RowPinButton } = require('../../buttons/row-pin-button');
        const mockRowPinButton = vi.fn(({ pinningPosition, row, table }) => (
            <button data-testid={`pin-button-${pinningPosition}`}>
                Pin {pinningPosition} for {row.id}
            </button>
        ));
        RowPinButton.mockImplementation(mockRowPinButton);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(mockRowPinButton).toHaveBeenCalledWith(
            expect.objectContaining({
                pinningPosition: 'top',
                row: mockRow,
                table: mockTable,
            }),
            expect.anything()
        );
    });

    it('should handle different pinning positions', () => {
        const positions = ['top', 'bottom'];

        positions.forEach((position) => {
            mockTable.options.rowPinningDisplayMode = position;

            render(
                <TableBodyRowPinButton
                    row={mockRow}
                    table={mockTable}
                />
            );

            expect(screen.getByTestId(`pin-button-${position}`)).toBeInTheDocument();
        });
    });

    it('should handle row pinning with function-based enableRowPinning', () => {
        mockTable.options.enableRowPinning = vi.fn(() => true);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
        expect(mockTable.options.enableRowPinning).toHaveBeenCalledWith(mockRow);
    });

    it('should handle row pinning with boolean enableRowPinning', () => {
        mockTable.options.enableRowPinning = true;

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
    });

    it('should handle row pinning with undefined enableRowPinning', () => {
        mockTable.options.enableRowPinning = undefined;

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
    });

    it('should handle row pinning with null enableRowPinning', () => {
        mockTable.options.enableRowPinning = null;

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
    });

    it('should handle row pinning with false enableRowPinning', () => {
        mockTable.options.enableRowPinning = false;

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
    });

    it('should handle row pinning with function returning false', () => {
        mockTable.options.enableRowPinning = vi.fn(() => false);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.queryByTestId('pin-button-top')).not.toBeInTheDocument();
        expect(mockTable.options.enableRowPinning).toHaveBeenCalledWith(mockRow);
    });

    it('should handle row pinning with function returning true', () => {
        mockTable.options.enableRowPinning = vi.fn(() => true);

        render(
            <TableBodyRowPinButton
                row={mockRow}
                table={mockTable}
            />
        );

        expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
        expect(mockTable.options.enableRowPinning).toHaveBeenCalledWith(mockRow);
    });

    it('should handle different row pinning display modes', () => {
        const displayModes = ['top', 'bottom', 'top-and-bottom'];

        displayModes.forEach((displayMode) => {
            mockTable.options.rowPinningDisplayMode = displayMode;

            render(
                <TableBodyRowPinButton
                    row={mockRow}
                    table={mockTable}
                />
            );

            if (displayMode === 'top-and-bottom') {
                expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
                expect(screen.getByTestId('pin-button-bottom')).toBeInTheDocument();
            } else {
                expect(screen.getByTestId(`pin-button-${displayMode}`)).toBeInTheDocument();
            }
        });
    });

    it('should handle row with different pinning states', () => {
        const pinningStates = [false, 'top', 'bottom'];

        pinningStates.forEach((pinningState) => {
            mockRow.getIsPinned = vi.fn(() => pinningState);
            mockTable.options.rowPinningDisplayMode = 'top-and-bottom';

            render(
                <TableBodyRowPinButton
                    row={mockRow}
                    table={mockTable}
                />
            );

            if (pinningState === false) {
                expect(screen.getByTestId('pin-button-top')).toBeInTheDocument();
                expect(screen.getByTestId('pin-button-bottom')).toBeInTheDocument();
            } else {
                expect(screen.getByTestId(`pin-button-${pinningState}`)).toBeInTheDocument();
            }
        });
    });
}); 